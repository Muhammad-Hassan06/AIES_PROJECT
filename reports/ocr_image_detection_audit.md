# CyberShield AI — Comprehensive OCR & Visual Fraud Detection Audit and Repair Report

**Date:** October 29, 2026  
**Auditor:** Senior Computer Vision & Machine Learning Engineer (CyberShield AI Diagnostic Suite)  
**System:** CyberShield AI (AI and Expert Systems Cybersecurity Platform)  
**Target Subsystems:** Image Upload, Computer Vision / OCR, Visual Forensics, Expert Rules, Dual-Schema Canvas Renderer  

---

## 1. Executive Summary

A comprehensive, end-to-end audit, repair, and verification of the OCR and image-based phishing detection pipeline in **CyberShield AI** was conducted.

Prior to these repairs, users experienced:
1. **Frontend Canvas Crashes (`TypeError`):** Attempting to destructure missing properties on bounding box regions because the backend outputted `box`, `detected_text`, and `evidence_explanation` while the canvas expected `bounding_box`, `extracted_text`, and `grounded_rationale`.
2. **Bounding Box Spatial Drift:** Bounding boxes overflowing beyond the `[0.0, 1.0]` normalized canvas space because coordinates were calculated on an upscaled image (2.67x) without scaling back to the original viewport.
3. **Catastrophic OCR Loss on Transparent Screenshots:** PNG screenshots with alpha/transparent backgrounds caused text to disappear during standard grayscale/RGB conversion when dark text rested on transparent layers.
4. **False Positive Alarms on Legitimate Banking Portals:** Official portals (e.g., Chase, HBL, Bank of America) were automatically flagged as **CRITICAL PHISHING** whenever login cues were detected alongside financial brand names, because the system lacked destination brand-domain alignment checks.
5. **Missing Upload Size & Payload Safeguards:** No strict backend byte limits existed to reject oversized payloads (>10MB).
6. **Hardcoded Metrics in Models Catalog:** Model evaluation endpoints reported mock statistics rather than genuine measured outcomes from test runs.

All six defects were addressed in the codebase. All existing and newly developed tests pass without failure:
- **New Dedicated Screenshot Detection Suite:** 7 of 7 passed (`backend/tests/test_screenshot_detection_repair.py`).
- **Visual Forensics Evaluation Suite:** 3 of 3 passed (`backend/tests/test_visual_forensics_evaluation.py`).
- **Complete Backend Test Suite:** 86 of 86 passed across all modules.
- **Complete Frontend Vitest Suite:** 21 of 21 tests passed across 7 test suites.

---

## 2. Discovered Architecture

### Discovery: No Deep CNN Exists
An initial architectural discovery was conducted to verify whether the system utilizes a Convolutional Neural Network (CNN), a Vision Transformer (ViT), a multimodal LLM API, or a hybrid architecture.

**Findings:**
- **No standalone CNN or Vision Transformer model** is present in the repository.
- The vision pipeline is a **hybrid multi-tier OCR and heuristic visual forensics engine** coupled with downstream NLP/URL classifiers and symbolic expert rules.
- Text extraction uses a multi-tier OCR strategy:
  1. Primary: Windows native OCR (`winocr`) if installed and supported on the host.
  2. Fallback: Local Tesseract OCR (`pytesseract`) configured across common system paths.
  3. Secondary Fallback: PIL-based geometric visual layout analyzer (detecting text lines, brand badges, and form contours).
- Extracted textual signals, detected URLs, and visual layout geometry are evaluated by:
  - Random Forest URL Threat Classifier (`backend/data/models/url_model.joblib`).
  - Multinomial Naive Bayes Lure Classifier (`backend/data/models/nlp_model.joblib`).
  - Deterministic Forward-Chaining Expert Rules (`backend/app/rules/expert_system.py`).
  - Sub-additive Evidence Fusion Engine (`backend/app/scoring/risk_scoring.py`).

### End-to-End Pipeline Data Flow
```
Uploaded Image (Base64)
   │
   ▼
[1] Security & Header Validation (Magic bytes, max 10MB limit, format verification)
   │
   ▼
[2] Preprocessing & Transparency Flattening (RGBA/LA alpha composite onto pure white, aspect-ratio preserved scaling)
   │
   ▼
[3] Multi-Tier OCR Engine (winocr / pytesseract / PIL layout analyzer)
   │──▶ Extracts raw text with line preservation
   │──▶ Extracts word-level bounding boxes and confidence
   │──▶ Sanitizes and extracts visible URLs/domains
   │
   ▼
[4] Visual Forensics & Bounding Box Normalization
   │──▶ Re-scales coordinates back from upscaled space to original viewport
   │──▶ Generates dual-schema keys (`bounding_box` + `box`)
   │──▶ Computes visual risk with Brand-Domain Alignment verification
   │
   ▼
[5] Downstream Hybrid Fusion
   │──▶ URL Classifier on extracted URLs
   │──▶ NLP Classifier on extracted text
   │──▶ Expert System Rules (Conditional on brand vs domain match)
   │
   ▼
[6] Structured API Response (Direct UI rendering, Raw OCR drawer, Interactive Canvas)
```

---

## 3. Audit of Bugs and Root Causes

| # | Subsystem | Issue Identified | Root Cause | Fix Applied |
|---|---|---|---|---|
| 1 | **Image Validation** (`security.py`) | No payload size rejection; potential DOS from gigabyte image inputs. | Missing byte limit validation in `validate_image_header`. | Added `MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024` (10MB) check and header validation. |
| 2 | **OCR Preprocessing** (`ocr_engine.py`) | Text lost on PNG screenshots with transparent backgrounds. | Direct conversion from `RGBA` to `RGB` or `L` filled transparent backgrounds with black, drowning out dark text. | Implemented `_prepare_image_for_ocr` using PIL `Image.new("RGBA", ..., (255, 255, 255, 255))` and `alpha_composite`. |
| 3 | **Bounding Box Geometry** (`visual_forensics.py`) | Visual bounding boxes misaligned and overflowed the image canvas in frontend. | OCR ran on an image upscaled by `scale_factor = 2.67x`. Box pixel coordinates `(left, top, w, h)` were divided by original `(width, height)`, multiplying coordinates by `2.67` and exceeding `1.0`. | Coordinates are scaled back to original unscaled dimensions before calculating normalized `[ymin, xmin, ymax, xmax]` in range `[0.0, 1.0]`. |
| 4 | **Frontend-Backend Contract** (`VisualForensicsCanvas.jsx` & `visual_forensics.py`) | Canvas crashed with `TypeError: Cannot read properties of undefined (reading '0')`. | Backend emitted `box`, `detected_text`, `evidence_explanation`; frontend destructured `r.bounding_box`. | Implemented dual-schema keys in backend (`bounding_box` + `box`, `extracted_text` + `detected_text`, `grounded_rationale` + `evidence_explanation`) and resilient key fallbacks in React. |
| 5 | **Brand-Domain Alignment** (`external_intel.py`, `visual_forensics.py`, `expert_system.py`) | Legitimate banking login pages (Chase, HBL, Bank of America) falsely flagged as **CRITICAL PHISHING**. | `RULE_INTL_11` and `RULE_PAK_08` triggered whenever a brand was detected near login fields, without checking if the visible URL domain belonged to the genuine institution. | Added `BRAND_OFFICIAL_DOMAINS` catalog and `is_brand_aligned_with_url()` helper. Suppressed impersonation rules when the domain matches the brand. |
| 6 | **UI Forensics Inspection** (`VisualForensicsCanvas.jsx`, `InvestigationStudioPage.jsx`) | Users could not inspect raw OCR text or extracted URLs directly in the UI. | No dedicated inspection drawer; stale reports persisted when selecting a new file. | Added raw OCR verbatim inspection panel with character count, URL pills, and automatic stale report clearing. |
| 7 | **Render Cloud OCR Availability** (`ocr_engine.py`, `Dockerfile`, `render.yaml`) | Screenshots on Render free tier returned `Insufficient Evidence / Needs Review (0/100)`. | Host container lacked Windows `winocr` and local Tesseract, while single-model Gemini call hit daily 20-request free quota (`429 RESOURCE_EXHAUSTED`). | Added Linux `/usr/bin/tesseract` resolution, multi-model Gemini fallbacks (`gemini-2.5-flash-lite`, `gemini-flash-latest`), Groq vision, and an explicit actionable UI advisory banner when OCR is offline. |
| 8 | **Roman Urdu & CNIC Span Detection** (`text_classifier.py`) | BISP lottery and mobile SMS scam screenshots failed semantic span extraction. | Credential harvesting regex required exact phrase `cnic number` (missing `cnic` alone), and Roman Urdu regex lacked `foran`, `rupay`, `account mein`. | Added standalone `cnic`, `foran`, `rupay`, and expanded localized Roman Urdu fraud cue dictionaries. |

---

## 4. Code Modifications Summary

The following files were updated and validated:

1. **[`backend/app/core/security.py`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/backend/app/core/security.py)**
   - Defined `MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024` (10MB).
   - Enforced payload size checks and magic byte header verification for PNG, JPEG, WEBP, and BMP.

2. **[`backend/app/intelligence/external_intel.py`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/backend/app/intelligence/external_intel.py)**
   - Added `BRAND_OFFICIAL_DOMAINS` dictionary covering major Pakistani and global institutions (HBL, Meezan, Bank of America, Chase, Wells Fargo, PayPal, Microsoft, Google, etc.).
   - Implemented `is_brand_aligned_with_url(text, url)` with root-domain extraction and sub-domain spoofing guards.
   - Expanded `KNOWN_LEGITIMATE_DOMAINS` with international banking portals.

3. **[`backend/app/vision/ocr_engine.py`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/backend/app/vision/ocr_engine.py)**
   - Added Windows Tesseract search paths (`Program Files\Tesseract-OCR\tesseract.exe`, etc.).
   - Created `_prepare_image_for_ocr(img)`: Composites RGBA/LA/P transparency onto solid white canvas and applies adaptive Lanczos upscaling for small text.
   - Improved regex patterns to sanitize OCR character noise in extracted URLs.
   - Passed `scale_factor` and `extracted_urls` to downstream visual forensics.

4. **[`backend/app/vision/visual_forensics.py`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/backend/app/vision/visual_forensics.py)**
   - Corrected `_extract_bounding_box_from_words` to scale coordinates from OCR space back to viewport space.
   - Added dual-schema keys to all region outputs (`bounding_box` + `box`, `extracted_text` + `detected_text`, `grounded_rationale` + `evidence_explanation`).
   - Integrated `is_brand_aligned_with_url` in `_compute_visual_risk` to eliminate false positive penalties on authentic portals.

5. **[`backend/app/rules/expert_system.py`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/backend/app/rules/expert_system.py)**
   - Modified `RULE_PAK_08` (Financial Brand & OTP Phishing) and `RULE_INTL_11` (International Brand Spoofing) to check `not brand_aligned` before firing.

6. **[`backend/app/api/routes.py`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/backend/app/api/routes.py)**
   - Loaded genuine OCR evaluation metrics from `reports/evaluation_results.json` into `/models/metrics` dynamically.

7. **[`frontend/src/services/api.js`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/frontend/src/services/api.js)**
   - Added `analyzeScreenshotDirect(screenshotBase64, filename)` for direct screenshot forensic invocation.

8. **[`frontend/src/components/VisualForensicsCanvas.jsx`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/frontend/src/components/VisualForensicsCanvas.jsx)**
   - Added dual-schema destructuring fallback (`r.bounding_box || r.box`, `r.extracted_text || r.detected_text`, etc.).
   - Added raw verbatim OCR text inspection drawer with character counters and URL pills.

9. **[`frontend/src/pages/InvestigationStudioPage.jsx`](file:///c:/Users/muham/OneDrive/Documents/AIES/Project3/frontend/src/pages/InvestigationStudioPage.jsx)**
   - Added client-side 10MB limit check.
   - Implemented immediate clearing of stale reports on new file upload.
   - Added interactive screenshot thumbnail preview with clear button.

---

## 5. Empirical Test & Evaluation Results

### 1. Dedicated Screenshot Detection Test Suite (`test_screenshot_detection_repair.py`)
Executed with Python 3.14.7:
```
backend/tests/test_screenshot_detection_repair.py::test_screenshot_detection_phishing_mismatch PASSED
backend/tests/test_screenshot_detection_repair.py::test_screenshot_detection_legitimate_bank PASSED
backend/tests/test_screenshot_detection_repair.py::test_screenshot_detection_unreadable_blank PASSED
backend/tests/test_screenshot_detection_repair.py::test_screenshot_detection_transparent_upscaled PASSED
backend/tests/test_screenshot_detection_repair.py::test_bounding_box_coordinates_strictly_in_unit_interval PASSED
backend/tests/test_screenshot_detection_repair.py::test_transparent_png_text_extraction PASSED
backend/tests/test_screenshot_detection_repair.py::test_oversized_image_rejection PASSED
============================== 7 passed in 2.97s ==============================
```

#### Results Breakdown across 4 Mandatory Benchmark Scenarios:
1. **Scenario A (Phishing Screenshot with Spoofed URL):**
   - *Input:* HBL Bank brand logo and login form paired with fraudulent URL `http://hblcom.pk.customer-login.top/login`.
   - *Outcome:* Classification `PHISHING`, Severity `CRITICAL`, Risk Score `0.85+`, Brand mismatch detected.
2. **Scenario B (Legitimate Banking Screenshot):**
   - *Input:* Official Bank of America login portal on `https://bankofamerica.com/login`.
   - *Outcome:* Classification `LIKELY_LEGITIMATE`, Severity `LOW` / `SAFE`, Risk Score `<= 0.25`, No false positive brand spoofing rules triggered.
3. **Scenario C (Unreadable / Blank Screenshot):**
   - *Input:* Blank white canvas without discernible text or layout elements.
   - *Outcome:* Classification `INSUFFICIENT_EVIDENCE`, Explanation clearly indicates lack of readable textual/visual cues, Zero false positives.
4. **Scenario D (Transparent / Upscaled Screenshot):**
   - *Input:* 4-channel RGBA screenshot with transparent background and high-density text.
   - *Outcome:* Alpha composited onto white; OCR text successfully extracted; all bounding box coordinates satisfy `0.0 <= coord <= 1.0`.

### 2. Full Regression Test Verification
- **All Backend Tests:** 86 passed, 0 failures (41.19s).
- **All Frontend Vitest Tests:** 21 passed across 7 test suites (370.84s).

---

## 6. Risk Scoring & Confidence Meter Policy

To prevent misleading risk indicators, CyberShield AI maintains clear definitions between **Calibrated Probability**, **Uncalibrated Model Confidence**, and **Heuristic Fraud-Risk Score**:

1. **Fraud-Risk Score (0.0 to 1.0):**
   - Represents a **sub-additive heuristic fusion** combining:
     - Scikit-learn classifier posterior probabilities (URL Random Forest and NLP Naive Bayes).
     - Deterministic expert rules weights.
     - Brand-domain alignment validation.
   - It is an operational priority score, not a frequentist probability.
2. **Model Confidence (0.0 to 1.0):**
   - Represents the individual machine learning model's internal score (e.g. `predict_proba`).
3. **Uncertainty & Insufficient Evidence:**
   - If an uploaded image produces no OCR text and lacks distinct visual form elements, the system issues `INSUFFICIENT_EVIDENCE` with an uncertainty status, avoiding arbitrary default classifications.

---

## 7. Known Limitations & Operational Guidance

1. **Offline Static Inspection:** The screenshot analyzer inspects image pixels only. It does not navigate live URLs, render dynamic DOM trees, or execute JavaScript.
2. **Low-Resolution Artifacts:** Heavily compressed WhatsApp screenshots (below 300x150 px) or screenshots with severe JPEG compression artifacts can degrade OCR character recognition accuracy.
3. **Phonetic & Roman Urdu Variations:** Non-standardized transliteration of Roman Urdu financial terms may require ongoing dictionary and synonym additions.
4. **Adversarial Typography:** Text disguised using non-standard Unicode homoglyphs or rendered as complex artistic distortion may require OCR post-normalization.

---
*Report certified by CyberShield AI Diagnostic Verification Suite.*
