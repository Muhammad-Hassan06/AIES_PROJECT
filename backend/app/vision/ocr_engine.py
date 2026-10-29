import re
import io
import os
import time
import base64
import asyncio
import concurrent.futures
from typing import Dict, Any, List, Optional
from PIL import Image
from app.core.security import validate_image_header
from app.core.config import settings

URL_REGEX = r"(https?://[^\s<>\"']+|www\.[^\s<>\"']+|[a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|org|net|pk|xyz|top|info|live|online|site|co|io|biz|ru|cn|gov|edu)[^\s<>\"']*)"

SUSPICIOUS_LOGIN_KEYWORDS = [
    "sign in", "login", "password", "username", "enter pin", "otp verification",
    "cnic", "security question", "debit card", "cvv", "verify identity",
    "reset your password", "reset password", "account holder", "new device", "new divice",
    "unusual activity", "suspicious activity", "verify your account", "transactions"
]

SUSPICIOUS_BRAND_CUES = [
    "hbl", "ubl", "meezan", "bank alfalah", "mcb", "easypaisa", "jazzcash",
    "bisp", "nadra", "fbr", "pakistan post", "tcs", "state bank", "amazon",
    "bank of america", "bank america", "chase", "wells fargo", "citibank",
    "paypal", "apple", "microsoft", "netflix", "dhl", "fedex"
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
            import shutil
            candidate_paths = [
                shutil.which("tesseract"),
                "/usr/bin/tesseract",
                "/usr/local/bin/tesseract",
                os.getenv("TESSERACT_PATH"),
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
            ]
            for p in candidate_paths:
                if p and os.path.exists(p):
                    pytesseract.pytesseract.tesseract_cmd = p
                    break
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

    def _prepare_image_for_ocr(self, img: Image.Image) -> Tuple[Image.Image, float, Tuple[int, int]]:
        """
        Safely flattens alpha transparency onto white and applies adaptive Lanczos upscaling.
        Returns: (preprocessed_img, scale_factor, (orig_w, orig_h))
        """
        orig_w, orig_h = img.size

        # Handle RGBA / transparency safely: Composite over a solid white canvas
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            background = Image.new("RGBA", img.size, (255, 255, 255, 255))
            converted = img.convert("RGBA")
            background.paste(converted, (0, 0), converted)
            cleaned_img = background.convert("RGB")
        elif img.mode != "RGB":
            cleaned_img = img.convert("RGB")
        else:
            cleaned_img = img

        scale_factor = 1.0
        if orig_w < 1400 or orig_h < 900:
            scale_factor = max(1.5, min(3.0, 1600.0 / max(1, max(orig_w, orig_h))))
            new_w = int(orig_w * scale_factor)
            new_h = int(orig_h * scale_factor)
            ocr_img = cleaned_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        else:
            ocr_img = cleaned_img

        return ocr_img, scale_factor, (orig_w, orig_h)

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

        ocr_prep_img, scale_factor, (width, height) = self._prepare_image_for_ocr(img)

        extracted_text = ""
        engine_name = "Embedded OCR Pattern Parser"

        ocr_lines = []
        # Tier 1: Windows Native OCR (built into Windows 10/11)
        if not extracted_text and self.winocr_available:
            try:
                import winocr
                ocr_img = ocr_prep_img.convert("RGBA") if ocr_prep_img.mode != "RGBA" else ocr_prep_img
                res = None
                if hasattr(winocr, "recognize_pil_sync"):
                    try:
                        res = winocr.recognize_pil_sync(ocr_img)
                    except Exception:
                        res = None

                if res is None:
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                                res = pool.submit(asyncio.run, winocr.recognize_pil(ocr_img)).result(timeout=5.0)
                        else:
                            res = loop.run_until_complete(winocr.recognize_pil(ocr_img))
                    except RuntimeError:
                        res = asyncio.run(winocr.recognize_pil(ocr_img))
                    except Exception:
                        res = None

                if res and isinstance(res, dict):
                    if res.get("text") and len(res["text"].strip()) > 0:
                        extracted_text = res["text"].strip()
                        engine_name = "Windows Native OCR (winocr)"
                    if "lines" in res:
                        ocr_lines = res["lines"]
                elif hasattr(res, "text") and res.text and len(res.text.strip()) > 0:
                    extracted_text = res.text.strip()
                    engine_name = "Windows Native OCR (winocr)"
                    if hasattr(res, "lines"):
                        ocr_lines = res.lines
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

        # Tier 3: Multimodal Vision API OCR (Gemini / Groq / OpenAI)
        # Indispensable on cloud hosts (such as Render Linux containers) where native desktop OCR is absent
        if not extracted_text:
            # 3a. Try Gemini Vision if API key is configured with robust multi-model fallback & timeout
            if settings.GEMINI_API_KEY:
                candidate_models = [
                    settings.GEMINI_MODEL,
                    "gemini-2.5-flash-lite",
                    "gemini-flash-latest",
                    "gemini-3.8-flash",
                    "gemini-2.5-flash"
                ]
                seen_models = set()
                for m_cand in candidate_models:
                    if not m_cand or m_cand in seen_models:
                        continue
                    seen_models.add(m_cand)
                    try:
                        from google import genai
                        client = genai.Client(api_key=settings.GEMINI_API_KEY)
                        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                            future = pool.submit(
                                client.models.generate_content,
                                model=m_cand,
                                contents=[ocr_prep_img, "Extract all visible text, URLs, numbers, email addresses, and words from this screenshot verbatim. Do not explain, return only the raw text:"]
                            )
                            v_res = future.result(timeout=6.0)
                        if v_res and v_res.text and len(v_res.text.strip()) > 3:
                            extracted_text = v_res.text.strip()
                            engine_name = f"Gemini Vision ({m_cand})"
                            break
                    except Exception as exc:
                        err_str = str(exc).lower()
                        if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                            # Quota is exhausted for the project today, avoid wasting time retrying candidate models
                            break
                        continue

            # 3b. Try Groq LLaMA 3.2 Vision if Groq key is configured
            if not extracted_text and settings.GROQ_API_KEY:
                groq_models = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
                for g_model in groq_models:
                    try:
                        import httpx
                        b64_clean = base64_str if "," not in base64_str else base64_str.split(",", 1)[1]
                        groq_payload = {
                            "model": g_model,
                            "messages": [{
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Extract all readable text, URLs, phone numbers, and words from this image verbatim. Return only the raw text with no commentary."},
                                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_clean}"}}
                                ]
                            }],
                            "temperature": 0.1
                        }
                        g_res = httpx.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                            json=groq_payload,
                            timeout=14.0
                        )
                        if g_res.status_code == 200:
                            g_content = g_res.json()["choices"][0]["message"]["content"]
                            if g_content and len(g_content.strip()) > 3:
                                extracted_text = g_content.strip()
                                engine_name = f"Groq LLaMA Vision ({g_model})"
                                break
                    except Exception:
                        continue

            # 3c. Try OpenAI Vision if OpenAI key is configured
            if not extracted_text and settings.OPENAI_API_KEY:
                try:
                    import httpx
                    b64_clean = base64_str if "," not in base64_str else base64_str.split(",", 1)[1]
                    oai_payload = {
                        "model": "gpt-4o-mini",
                        "messages": [{
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract all readable text, URLs, phone numbers, and words from this image verbatim. Return only the raw text."},
                                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_clean}"}}
                            ]
                        }],
                        "max_tokens": 1000
                    }
                    o_res = httpx.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        json=oai_payload,
                        timeout=12.0
                    )
                    if o_res.status_code == 200:
                        o_content = o_res.json()["choices"][0]["message"]["content"]
                        if o_content and len(o_content.strip()) > 3:
                            extracted_text = o_content.strip()
                            engine_name = "OpenAI GPT-4o-mini Vision"
                except Exception:
                    pass

        # Tier 4: EXIF metadata / comment extraction or clean non-hallucinatory fallback
        ocr_warning = None
        if not extracted_text:
            if "comment" in img.info:
                comment_text = str(img.info["comment"]).strip()
                if comment_text:
                    extracted_text = comment_text
                    engine_name = "Embedded EXIF/Image Metadata"
            
            if not extracted_text:
                extracted_text = ""
                has_cloud_vision_key = bool(settings.GEMINI_API_KEY or settings.GROQ_API_KEY or settings.OPENAI_API_KEY)
                if not self.winocr_available and not self.tesseract_available and not has_cloud_vision_key:
                    engine_name = "OCR Engine Offline"
                    ocr_warning = (
                        "No OCR engine is available on this server host. "
                        "Neither a local Tesseract binary nor a Vision API key (GEMINI_API_KEY or GROQ_API_KEY) is configured. "
                        "To analyze screenshots on Render, add GEMINI_API_KEY or GROQ_API_KEY in your Render Dashboard → Environment variables."
                    )
                else:
                    engine_name = "Visual Layout Analyzer (No Text Detected)"
                    ocr_warning = "Image contains no machine-readable textual characters. Visual layout contour analysis was performed."

        # Self-referential loop guard: detect if user uploaded a screenshot of CyberShield's own results UI
        # Signature phrases that only appear in the CyberShield verdict report page
        CYBERSHIELD_UI_SIGNATURES = [
            "forensic risk verdict",
            "plain-language verdict",
            "evidence insufficient",
            "simple view active",
            "share-safe summary",
            "agent execution trace",
            "triggered rules",
            "evidence ledger",
            "cybershield ai",
        ]
        text_lower_check = extracted_text.lower() if extracted_text else ""
        self_ref_hits = sum(1 for sig in CYBERSHIELD_UI_SIGNATURES if sig in text_lower_check)
        if self_ref_hits >= 2:
            return {
                "error": "Self-referential screenshot detected: You appear to have uploaded a screenshot of CyberShield's own results page. Please upload the actual suspicious message, email, or phishing webpage screenshot instead.",
                "extracted_text": "",
                "extracted_urls": [],
                "detected_keywords": [],
                "visual_indicators": ["⚠️ Screenshot is of CyberShield results UI — upload the actual phishing content"],
                "ocr_engine": engine_name,
                "latency_ms": round((time.time() - start_time) * 1000.0, 2)
            }

        # Extract URLs from recognized text
        found_urls = re.findall(URL_REGEX, extracted_text, re.IGNORECASE) if extracted_text else []
        cleaned_urls = []
        for u in found_urls:
            u_clean = u.strip().rstrip(".,;:)-_$\\/'\"`*<>[]{}")
            u_clean = re.sub(r"\s+", "", u_clean)
            if not u_clean.startswith("http"):
                u_clean = "http://" + u_clean
            if u_clean not in cleaned_urls:
                cleaned_urls.append(u_clean)

        # Detect suspicious login keywords & brands
        # Use \s+ instead of literal space to handle OCR-introduced newlines/multiple spaces in multi-word phrases
        text_lower = extracted_text.lower() if extracted_text else ""
        # Normalize whitespace in OCR text for robust multi-word matching
        text_normalized = re.sub(r'\s+', ' ', text_lower).strip()
        detected_keywords = []
        if text_normalized:
            for kw in SUSPICIOUS_LOGIN_KEYWORDS:
                # Build pattern with \s+ between words to handle OCR whitespace variations
                kw_pattern = r'\b' + r'\s+'.join(re.escape(w) for w in kw.split()) + r'\b'
                if re.search(kw_pattern, text_normalized):
                    detected_keywords.append(kw)

        detected_brands = []
        if text_normalized:
            for brand in SUSPICIOUS_BRAND_CUES:
                brand_pattern = r'\b' + r'\s+'.join(re.escape(w) for w in brand.split()) + r'\b'
                if re.search(brand_pattern, text_normalized):
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

        # Feature 2: Explainable Visual Forensics Engine
        from app.vision.visual_forensics import visual_forensics_engine
        vf_result = visual_forensics_engine.analyze_screenshot(
            image_bytes=image_bytes,
            extracted_text=extracted_text,
            ocr_lines=ocr_lines,
            scale_factor=scale_factor,
            extracted_urls=cleaned_urls
        )

        latency = (time.time() - start_time) * 1000.0

        return {
            "filename": filename,
            "extracted_text": extracted_text,
            "extracted_urls": cleaned_urls,
            "detected_keywords": detected_keywords,
            "visual_indicators": visual_indicators,
            "ocr_engine": engine_name,
            "ocr_warning": ocr_warning,
            "layout_type": vf_result.get("layout_type", "GENERIC_GRAPHIC"),
            "visual_phishing_probability": vf_result.get("visual_phishing_probability", 0.0),
            "is_legitimate_likelihood": vf_result.get("is_legitimate_likelihood", 1.0),
            "suspicious_regions": vf_result.get("suspicious_regions", []),
            "visual_evidence_ledger": vf_result.get("visual_evidence_ledger", []),
            "forensics_summary": vf_result.get("forensics_summary", ""),
            "latency_ms": round(latency, 2)
        }

ocr_engine = ScreenshotOCREngine()
