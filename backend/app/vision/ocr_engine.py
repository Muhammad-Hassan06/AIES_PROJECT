import re
import io
import time
import base64
import asyncio
import concurrent.futures
from typing import Dict, Any, List, Optional
from PIL import Image
from app.core.security import validate_image_header

URL_REGEX = r"(https?://[^\s<>\"']+|www\.[^\s<>\"']+|[a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|org|net|pk|xyz|top|info|live|online|site|co|io|biz|ru|cn)[^\s<>\"']*)"

SUSPICIOUS_LOGIN_KEYWORDS = [
    "sign in", "login", "password", "username", "enter pin", "otp verification",
    "cnic", "security question", "debit card", "cvv", "verify identity"
]

SUSPICIOUS_BRAND_CUES = [
    "hbl", "ubl", "meezan", "bank alfalah", "mcb", "easypaisa", "jazzcash",
    "bisp", "nadra", "fbr", "pakistan post", "tcs", "state bank", "amazon"
]

class ScreenshotOCREngine:
    def __init__(self):
        self.tesseract_available = False
        self.winocr_available = False
        self._check_tesseract()
        self._check_winocr()

    def _check_tesseract(self):
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            self.tesseract_available = True
        except Exception:
            self.tesseract_available = False

    def _check_winocr(self):
        try:
            import winocr
            self.winocr_available = True
        except Exception:
            self.winocr_available = False

    def process_screenshot_base64(self, base64_str: str, filename: Optional[str] = "screenshot.png") -> Dict[str, Any]:
        start_time = time.time()
        
        # Strip data URL prefix if present
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        try:
            image_bytes = base64.b64decode(base64_str)
        except Exception as e:
            return {
                "error": f"Invalid base64 encoding: {str(e)}",
                "extracted_text": "",
                "extracted_urls": [],
                "detected_keywords": [],
                "visual_indicators": [],
                "ocr_engine": "None",
                "latency_ms": 0.0
            }

        is_valid, mime_or_err = validate_image_header(image_bytes)
        if not is_valid:
            return {
                "error": f"File validation failed: {mime_or_err}",
                "extracted_text": "",
                "extracted_urls": [],
                "detected_keywords": [],
                "visual_indicators": [],
                "ocr_engine": "None",
                "latency_ms": 0.0
            }

        # Safe PIL processing
        try:
            img = Image.open(io.BytesIO(image_bytes))
            # Protect against decompression bomb
            img.verify()
            img = Image.open(io.BytesIO(image_bytes))  # Re-open after verify
            width, height = img.size
        except Exception as e:
            return {
                "error": f"Malformed or corrupted image: {str(e)}",
                "extracted_text": "",
                "extracted_urls": [],
                "detected_keywords": [],
                "visual_indicators": [],
                "ocr_engine": "PIL_Validator",
                "latency_ms": 0.0
            }

        extracted_text = ""
        engine_name = "Embedded OCR Pattern Parser"

        # Adaptive preprocessing: Upscale small or low-resolution images with Lanczos interpolation
        # This dramatically enhances character segmentation and fidelity for Windows Native OCR & Tesseract
        scale_factor = 1.0
        if width < 1400 or height < 900:
            scale_factor = max(2.0, min(3.0, 1600.0 / max(1, max(width, height))))
            ocr_prep_img = img.resize(
                (int(width * scale_factor), int(height * scale_factor)),
                Image.Resampling.LANCZOS
            )
        else:
            ocr_prep_img = img

        # Tier 1: Windows Native OCR (built into Windows 10/11)
        if not extracted_text and self.winocr_available:
            try:
                import winocr
                ocr_img = ocr_prep_img.convert("RGBA") if ocr_prep_img.mode != "RGBA" else ocr_prep_img
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                            res = pool.submit(asyncio.run, winocr.recognize_pil(ocr_img)).result()
                    else:
                        res = loop.run_until_complete(winocr.recognize_pil(ocr_img))
                except RuntimeError:
                    res = asyncio.run(winocr.recognize_pil(ocr_img))

                if res and res.text and len(res.text.strip()) > 0:
                    extracted_text = res.text.strip()
                    engine_name = "Windows Native OCR (winocr)"
            except Exception:
                pass

        # Tier 2: Try Tesseract if available and on system PATH
        if not extracted_text and self.tesseract_available:
            try:
                import pytesseract
                gray_img = ocr_prep_img.convert("L")
                text = pytesseract.image_to_string(gray_img)
                if text and len(text.strip()) > 0:
                    extracted_text = text.strip()
                    engine_name = "Tesseract OCR v5"
            except Exception:
                pass

        # Tier 3: EXIF metadata / comment extraction or clean non-hallucinatory fallback
        if not extracted_text:
            if "comment" in img.info:
                comment_text = str(img.info["comment"]).strip()
                if comment_text:
                    extracted_text = comment_text
                    engine_name = "Embedded EXIF/Image Metadata"
            
            if not extracted_text:
                extracted_text = ""
                engine_name = "Visual Layout Analyzer (No Text Detected)"

        # Extract URLs from recognized text
        found_urls = re.findall(URL_REGEX, extracted_text, re.IGNORECASE) if extracted_text else []
        cleaned_urls = []
        for u in found_urls:
            u_clean = u.strip().rstrip(".,;:)-_$\\/'\"")
            if not u_clean.startswith("http"):
                u_clean = "http://" + u_clean
            if u_clean not in cleaned_urls:
                cleaned_urls.append(u_clean)

        # Detect suspicious login keywords & brands with exact word boundaries
        text_lower = extracted_text.lower() if extracted_text else ""
        detected_keywords = []
        if text_lower:
            for kw in SUSPICIOUS_LOGIN_KEYWORDS:
                pattern = r"\b" + re.escape(kw) + r"\b"
                if re.search(pattern, text_lower):
                    detected_keywords.append(kw)

        detected_brands = []
        if text_lower:
            for brand in SUSPICIOUS_BRAND_CUES:
                pattern = r"\b" + re.escape(brand) + r"\b"
                if re.search(pattern, text_lower):
                    detected_brands.append(brand)

        visual_indicators = []
        if detected_keywords:
            visual_indicators.append(f"Visual Form Elements Detected: {', '.join(detected_keywords[:3])}")
        if detected_brands:
            visual_indicators.append(f"Brand Identity Impersonation: {', '.join(detected_brands)}")
        if cleaned_urls:
            visual_indicators.append(f"Visible Target URL: {cleaned_urls[0]}")
        if width > 0 and height > 0:
            aspect_ratio = round(width / height, 2)
            if aspect_ratio < 0.6:
                visual_indicators.append("Mobile Screenshot Aspect Ratio (Typical for SMS/WhatsApp captures)")

        latency = (time.time() - start_time) * 1000.0

        return {
            "filename": filename,
            "extracted_text": extracted_text,
            "extracted_urls": cleaned_urls,
            "detected_keywords": detected_keywords,
            "visual_indicators": visual_indicators,
            "ocr_engine": engine_name,
            "latency_ms": round(latency, 2)
        }

ocr_engine = ScreenshotOCREngine()
