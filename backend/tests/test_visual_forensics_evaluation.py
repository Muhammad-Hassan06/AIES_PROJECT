"""
Unit, integration, and generalization evaluation tests for Feature 2:
Explainable Visual Phishing Forensics Engine.

Verifies:
1. Spatial bounding box normalization ([ymin, xmin, ymax, xmax] in 0.0 - 1.0).
2. Explicit category tagging (CREDENTIAL_PROMPT, IMPERSONATED_BRAND, COERCIVE_TIMER, etc.).
3. Evidence-grounded rationale for each flagged region (No decorative heatmaps).
4. Generalization: Evaluates both phishing captures and legitimate informational pages,
   proving high sensitivity on threats and high specificity (low false positives) on legitimate pages.
"""

import io
import pytest
from PIL import Image, ImageDraw
from app.vision.visual_forensics import (
    ExplainableVisualForensics,
    CATEGORY_CREDENTIAL_PROMPT,
    CATEGORY_IMPERSONATED_BRAND,
    CATEGORY_COERCIVE_TIMER
)

def create_synthetic_screenshot(text_lines: list, size=(800, 600), bg_color=(255, 255, 255)):
    """Helper to generate in-memory synthetic test screenshot images."""
    img = Image.new("RGB", size, color=bg_color)
    draw = ImageDraw.Draw(img)
    y = 40
    for line in text_lines:
        draw.text((40, y), line, fill=(0, 0, 0))
        y += 45
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_phishing_screenshot_detection_and_bounding_boxes():
    """Evaluates detection on a spoofed banking login page with credential collection."""
    forensics = ExplainableVisualForensics()

    phishing_text = (
        "Bank of America Security Alert\n"
        "Your online access has been temporarily locked.\n"
        "Please enter your User ID and Password to verify identity.\n"
        "Sign In Now"
    )
    img_bytes = create_synthetic_screenshot([
        "Bank of America Security Alert",
        "Your online access has been temporarily locked.",
        "Please enter your User ID and Password to verify identity.",
        "Sign In Now"
    ])

    # Provide OCR line data simulating Windows/Tesseract OCR
    mock_ocr_lines = [
        {
            "text": "Bank of America Security Alert",
            "words": [
                {"text": "Bank", "bounding_rect": {"x": 40, "y": 40, "width": 60, "height": 20}},
                {"text": "of", "bounding_rect": {"x": 105, "y": 40, "width": 25, "height": 20}},
                {"text": "America", "bounding_rect": {"x": 135, "y": 40, "width": 80, "height": 20}},
                {"text": "Security", "bounding_rect": {"x": 220, "y": 40, "width": 80, "height": 20}}
            ]
        },
        {
            "text": "Please enter your User ID and Password to verify identity.",
            "words": [
                {"text": "Please", "bounding_rect": {"x": 40, "y": 130, "width": 60, "height": 20}},
                {"text": "Password", "bounding_rect": {"x": 240, "y": 130, "width": 80, "height": 20}},
                {"text": "Sign", "bounding_rect": {"x": 40, "y": 200, "width": 50, "height": 20}}
            ]
        }
    ]

    res = forensics.analyze_screenshot(
        image_bytes=img_bytes,
        extracted_text=phishing_text,
        ocr_lines=mock_ocr_lines
    )

    assert "visual_phishing_probability" in res
    assert res["visual_phishing_probability"] >= 0.70  # High phishing likelihood
    assert res["is_legitimate_likelihood"] <= 0.30

    assert len(res["suspicious_regions"]) >= 2

    # Check bounding box normalization
    for r in res["suspicious_regions"]:
        box = r["box"]
        assert len(box) == 4
        ymin, xmin, ymax, xmax = box
        assert 0.0 <= ymin <= 1.0
        assert 0.0 <= xmin <= 1.0
        assert 0.0 <= ymax <= 1.0
        assert 0.0 <= xmax <= 1.0
        assert ymin <= ymax
        assert xmin <= xmax

        # Check evidence explanation is present and grounded
        assert "evidence_explanation" in r
        assert len(r["evidence_explanation"]) > 20
        assert r["category"] in [
            CATEGORY_CREDENTIAL_PROMPT,
            CATEGORY_IMPERSONATED_BRAND,
            CATEGORY_COERCIVE_TIMER,
            "INPUT_FIELD",
            "DECEPTIVE_CTA"
        ]

def test_legitimate_page_generalization():
    """
    Evaluates generalization on a legitimate informational page.
    Must NOT trigger high phishing probability or false positive credential alarms.
    """
    forensics = ExplainableVisualForensics()

    legitimate_text = (
        "National Cyber Crime Information Portal\n"
        "Educational guidelines for online citizen safety.\n"
        "Read articles on cyber hygiene and digital literacy.\n"
        "Terms of Use | Privacy Policy | About Us | Contact Us\n"
        "Copyright 2026. All rights reserved."
    )
    img_bytes = create_synthetic_screenshot([
        "National Cyber Crime Information Portal",
        "Educational guidelines for online citizen safety.",
        "Terms of Use | Privacy Policy | About Us | Contact Us",
        "Copyright 2026. All rights reserved."
    ])

    res = forensics.analyze_screenshot(
        image_bytes=img_bytes,
        extracted_text=legitimate_text,
        ocr_lines=[]
    )

    # Legitimate page should have very low phishing probability
    assert res["visual_phishing_probability"] <= 0.25
    assert res["is_legitimate_likelihood"] >= 0.75

    # Should not flag credential harvesting prompts
    credential_regions = [r for r in res["suspicious_regions"] if r["category"] == CATEGORY_CREDENTIAL_PROMPT]
    assert len(credential_regions) == 0

def test_layout_classification_and_evidence_ledger():
    """Verifies layout classification and structured visual evidence ledger."""
    forensics = ExplainableVisualForensics()

    # Tall mobile screenshot simulation
    mobile_bytes = create_synthetic_screenshot(
        ["Easypaisa Alert: Aap ka account block kar diya jaye ga", "Foran apna MPIN batayein"],
        size=(360, 740)
    )

    res = forensics.analyze_screenshot(
        image_bytes=mobile_bytes,
        extracted_text="Easypaisa Alert: Aap ka account block kar diya jaye ga. Foran apna MPIN batayein",
        ocr_lines=[]
    )

    assert "MOBILE" in res["layout_type"]
    assert res["visual_phishing_probability"] >= 0.60
    assert len(res["visual_evidence_ledger"]) > 0

    for ev in res["visual_evidence_ledger"]:
        assert "component" in ev
        assert "finding" in ev
        assert "weight" in ev
        assert "confidence" in ev
