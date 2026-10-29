"""
CyberShield AI — Dedicated Test Suite for Repaired OCR & Visual Phishing Detection Pipeline
Validates:
1. Test A: Phishing screenshots with mismatched domains and credential harvesting.
2. Test B: Legitimate screenshots of official bank portals (verifies NO false positive alarms).
3. Test C: Difficult / unreadable / blank screenshots (verifies Insufficient Evidence safeguard).
4. Test D: Transparency preservation on RGBA images (prevents black-on-black text vanishing).
5. Bounding box spatial normalization (verifies coordinates stay strictly within [0.0, 1.0]).
6. Security guard validation: Rejecting files > 10MB and unsupported formats.
7. Schema compatibility: Both backend and frontend keys are provided.
"""

import io
import pytest
from PIL import Image, ImageDraw
from app.vision.ocr_engine import ocr_engine
from app.vision.visual_forensics import ExplainableVisualForensics
from app.core.security import validate_image_header, MAX_IMAGE_SIZE_BYTES
from app.intelligence.external_intel import is_brand_aligned_with_url

def create_test_image(lines, size=(800, 400), bg="white", text_color="black"):
    img = Image.new("RGB", size, color=bg)
    draw = ImageDraw.Draw(img)
    y = 30
    for line in lines:
        draw.text((30, y), line, fill=text_color)
        y += 40
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_legitimate_bank_login_not_falsely_flagged():
    """Test B: Legitimate login page on official domain must NOT trigger critical phishing."""
    vf = ExplainableVisualForensics()
    legit_text = "Chase Online Banking\nSign In to your account\nUsername and Password\nhttps://www.chase.com"
    img_bytes = create_test_image([
        "Chase Online Banking",
        "Sign In to your account",
        "https://www.chase.com"
    ])

    res = vf.analyze_screenshot(
        image_bytes=img_bytes,
        extracted_text=legit_text,
        ocr_lines=[],
        extracted_urls=["https://www.chase.com"]
    )

    # Must NOT have high phishing probability because chase.com is the official domain
    assert res["visual_phishing_probability"] <= 0.35
    assert res["is_legitimate_likelihood"] >= 0.65
    assert "Legitimate layout verified" in res["forensics_summary"]

def test_phishing_bank_login_flagged_on_mismatched_domain():
    """Test A: Phishing login page on suspicious/unverified domain must trigger high threat."""
    vf = ExplainableVisualForensics()
    phish_text = "Chase Security Alert\nEnter your password immediately\nhttp://chase-update-account.top/login"
    img_bytes = create_test_image([
        "Chase Security Alert",
        "Enter your password immediately",
        "http://chase-update-account.top/login"
    ])

    res = vf.analyze_screenshot(
        image_bytes=img_bytes,
        extracted_text=phish_text,
        ocr_lines=[],
        extracted_urls=["http://chase-update-account.top/login"]
    )

    assert res["visual_phishing_probability"] >= 0.60
    assert res["is_legitimate_likelihood"] <= 0.40

def test_unreadable_blank_screenshot_returns_clean_evidence():
    """Test C: Blank or noise screenshot produces low threat and zero false-positive regions."""
    vf = ExplainableVisualForensics()
    blank_img = create_test_image([])

    res = vf.analyze_screenshot(
        image_bytes=blank_img,
        extracted_text="",
        ocr_lines=[]
    )

    assert res["visual_phishing_probability"] <= 0.10
    assert len(res["suspicious_regions"]) == 0

def test_bounding_box_coordinates_strictly_normalized_under_upscaling():
    """Verifies that bounding boxes stay within [0.0, 1.0] when scaled."""
    vf = ExplainableVisualForensics()
    mock_words = [
        {"text": "Password", "bounding_rect": {"x": 200, "y": 300, "width": 150, "height": 40}}
    ]
    box = vf._extract_bounding_box_from_words(
        words=mock_words,
        keyword="password",
        img_w=600,
        img_h=300,
        scaled_w=1600,
        scaled_h=800
    )
    assert box is not None
    ymin, xmin, ymax, xmax = box["normalized"]
    assert 0.0 <= ymin <= ymax <= 1.0
    assert 0.0 <= xmin <= xmax <= 1.0

def test_rgba_transparency_compositing_preserves_dark_text():
    """Test D: Dark text on transparent RGBA background does not turn into black-on-black."""
    img = Image.new("RGBA", (400, 200), (0, 0, 0, 0)) # Fully transparent
    draw = ImageDraw.Draw(img)
    draw.text((20, 30), "Visible Black Text", fill=(0, 0, 0, 255))
    
    ocr_prep_img, scale, dims = ocr_engine._prepare_image_for_ocr(img)
    assert ocr_prep_img.mode == "RGB"
    # Background corner should be solid white (255, 255, 255), not black (0, 0, 0)
    corner_pixel = ocr_prep_img.getpixel((5, 5))
    assert corner_pixel == (255, 255, 255)

def test_image_header_validation_and_size_guard():
    """Verifies file size limits and magic bytes rejection."""
    # Valid PNG
    valid_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
    is_valid, mime = validate_image_header(valid_png)
    assert is_valid is True
    assert mime == "image/png"

    # Unsupported executable / script
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00"
    is_valid, err = validate_image_header(fake_exe)
    assert is_valid is False
    assert "Unsupported file format" in err

    # Oversized payload
    oversized = b"\x89PNG\r\n\x1a\n" + b"\x00" * (MAX_IMAGE_SIZE_BYTES + 10)
    is_valid, err = validate_image_header(oversized)
    assert is_valid is False
    assert "exceeds maximum allowed upload size" in err

def test_dual_schema_compatibility_keys_present():
    """Ensures backend returns both frontend and backend property aliases."""
    vf = ExplainableVisualForensics()
    img_bytes = create_test_image(["Bank of America", "Sign In", "https://attacker.top"])
    res = vf.analyze_screenshot(
        image_bytes=img_bytes,
        extracted_text="Bank of America Sign In https://attacker.top",
        ocr_lines=[],
        extracted_urls=["https://attacker.top"]
    )

    for r in res["suspicious_regions"]:
        # Frontend required keys
        assert "bounding_box" in r
        assert "extracted_text" in r
        assert "grounded_rationale" in r
        # Backend legacy keys
        assert "box" in r
        assert "detected_text" in r
        assert "evidence_explanation" in r

def test_bisp_ehsaas_social_engineering_detection():
    """Verifies that BISP / Ehsaas Roman Urdu lottery lures are caught by NLP and expert rules."""
    from app.nlp.text_classifier import text_classifier
    bisp_text = (
        "BISP Ehsaas Program\n"
        "Mubarak ho aap k 25,000 rupay account mein agaye hain\n"
        "Foran CNIC verify karwayen 0301-8899221"
    )
    res = text_classifier.analyze(bisp_text)
    assert res["is_social_engineering"] is True
    assert res["risk_score"] >= 0.70
    assert any("Impersonation" in c or "Roman Urdu" in c or "Credential" in c for c in res["categories_detected"])
