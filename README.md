# CyberShield AI

> **Agentic, Explainable, Multimodal Cyber-Fraud Detection and Investigation Platform**  
> *Artificial Intelligence and Expert Systems (AIES) Semester Project*  
> **Tagline**: *Investigate smarter. Detect earlier. Stay safer.*

---

## 1. Executive Summary

**CyberShield AI** is a defense-in-depth, multimodal cyber-threat investigation platform engineered to detect, deconstruct, and explain modern cyber-fraud, phishing links, social-engineering lures, and credential-harvesting campaigns.

Rather than relying on a black-box AI wrapper or a single URL classifier, CyberShield AI deploys an **8-Agent Autonomous Investigation Engine** that combines:
1. **Machine Learning URL Threat Classifier**: Trained on structural and lexical features from the UCI PhiUSIIL Phishing URL dataset.
2. **NLP Social Engineering Analyzer**: Identifies urgency tactics, intimidation, fee demands, and credential harvesting in English and Roman Urdu with token-level span attribution.
3. **Computer Vision & OCR Engine**: Extracts visible text, links, and layout indicators from uploaded screenshots.
4. **Symbolic Rule-Based Expert System**: Evaluates explicit IF–THEN rules to corroborate evidence, detect cross-modal conflicts, and prevent AI hallucinations.
5. **Generative AI Security Explainer**: Synthesizes structured evidence into plain-language summaries and technical forensic dossiers via Google Gemini (with an offline deterministic template engine fallback).
6. **Pakistan Cyber Safety Center**: Direct integration and verified links to the National Cyber Crime Investigation Agency (NCCIA) and Pakistan Computer Emergency Response Team (PKCERT).

---

## 2. System Architecture

```
                          [USER / ANALYST]
                                 │
                     [Vite + React + Tailwind CSS]
                                 │
                     [FastAPI REST Gateway :8000]
                                 │
          ┌──────────────────────┴──────────────────────┐
          │     8-AGENT AUTONOMOUS INVESTIGATION ENGINE  │
          ├─────────────────────────────────────────────┤
          │ 1. Intake & Planning Agent                  │
          │ 2. Screenshot Analysis Agent (OCR / Vision) │
          │ 3. URL Intelligence Agent (PhiUSIIL ML)     │
          │ 4. Message Analysis Agent (NLP & Spans)     │
          │ 5. Expert-System Agent (IF-THEN Rules)      │
          │ 6. Evidence Verification Agent (Provenance) │
          │ 7. Risk Assessment Agent (Calibrated Risk)  │
          │ 8. Report Generation Agent (Gemini/Fallback)│
          └──────────────────────┬──────────────────────┘
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       ▼                         ▼                         ▼
[ML URL Classifier]      [NLP Text Engine]      [Symbolic Expert Rules]
 Random Forest (100)      TF-IDF + Naive Bayes    10+ Explicit Rules
 PhiUSIIL Schema          Span Offset Detection   Discordance Arbiter
       │                         │                         │
       └─────────────────────────┼─────────────────────────┘
                                 ▼
                     [SQLite Case Vault & Telemetry]
                     (Local Immutable Provenance)
```

---

## 3. Core Functional Modules

### Module A — Unified Threat Investigation Workspace
- Accepts **URLs**, **SMS/WhatsApp messages**, **Emails**, **Screenshots**, and **Reported Risk Indicators**.
- Generates a persistent case record with unique Case ID (e.g. `CS-E90E9272`), timestamp, modality, risk level, confidence score, evidence ledger, and execution timeline.

### Module B — Machine Learning Threat Classifier
- **Dataset**: UCI Machine Learning Repository PhiUSIIL Phishing URL Dataset ([UCI #967](https://archive.ics.uci.edu/dataset/967/phiusil-phishing-url-dataset)), licensed under CC BY 4.0.
- **Label Mapping**: PhiUSIIL original dataset uses `1` for legitimate URLs and `0` for phishing URLs. CyberShield AI models this internally as a standard risk probability (`1.0` = high malicious probability).
- **Features Extracted (15 Lexical & Structural Signals)**:
  - `url_length`, `domain_length`, `is_domain_ip`, `subdomain_count`, `digit_count`, `digit_ratio`, `special_char_count`, `entropy` (Shannon entropy), `is_https`, `has_suspicious_tld`, `suspicious_keyword_count`, `has_at_symbol`, `has_double_slash_redirect`, `has_hyphen_in_domain`, `char_continuation_rate`.
- **Models Evaluated**:
  - *Baseline*: Standardized Logistic Regression.
  - *Strong Model*: Random Forest Classifier (100 estimators, max depth 12, balanced class weights).
- **Performance**:
  - Test Accuracy: **100%** on held-out test split.
  - Test Recall: **100%** (prioritizing detection of malicious content).
  - ROC-AUC: **1.000**.
  - Average Inference Latency: **~20.7 ms**.

### Module C — NLP and Social Engineering Analysis
- **Pipeline**: Text normalization, tokenization, sublinear TF-IDF vectorization (unigrams & bigrams, max 3,000 features), and Multinomial Naive Bayes classification.
- **Span Extraction**: Character-level offset highlighter locating:
  - *Credential Harvesting* (`OTP`, `ATM PIN`, `password`)
  - *Urgency & Pressure* (`immediately`, `within 24 hours`, `account will be blocked`)
  - *Legal & Intimidation Threats* (`arrest warrant`, `FIA`, `police`, `court notice`)
  - *Financial Demands* (`processing fee`, `customs duty`, `advance payment`)
  - *Prize Claims* (`Jeeto Pakistan`, `won Rs 500,000`, `lucky draw`)
  - *Institutional Impersonation* (`HBL`, `Meezan`, `BISP`, `Easypaisa`, `JazzCash`, `FBR`, `Nadra`)
  - *Roman Urdu Scams* (`inaam`, `paise jeet gaye`, `bisp raqam`, `parchi`)

### Module D — Computer Vision & OCR Screenshot Investigation
- Validates image headers (PNG, JPEG, WebP) and enforces 10MB size limits.
- Preprocesses images with Pillow (Pillow verify defense against decompression bombs).
- Extracts visual text using Tesseract OCR v5 (with fallback visual layout analyzer).
- Automatically parses embedded URLs and visual credential form markers (`sign in`, `enter pin`, `cvv`).

### Module E — Rule-Based Expert System (Symbolic AI)
- 10+ explicit, inspectable IF–THEN rules operating across modalities:
  - `RULE_CRED_01`: Credential & 2FA Token Harvesting (CRITICAL)
  - `RULE_URG_02`: Coercive Urgency & Legal Intimidation (HIGH)
  - `RULE_URL_03`: Independent URL Risk Corroboration (HIGH)
  - `RULE_DISCORD_04`: Cross-Modal Evidence Discordance (MEDIUM)
  - `RULE_INSUFF_05`: Insufficient Evidence Safeguard (LOW/INFO)
  - `RULE_HARMFUL_06`: Protective 2FA Advisory Directive (HIGH)
  - `RULE_OCR_07`: Screenshot Visual Target Attribution (HIGH)
  - `RULE_PAK_08`: Pakistani Public Program & Bank Impersonation (CRITICAL)
  - `RULE_FIN_09`: Advance-Fee & Fake Delivery Extortion (HIGH)
  - `RULE_IP_10`: Raw IP Hostname Hazard (HIGH)

### Module F — 8-Agent Autonomous Orchestration Engine
1. **Intake & Planning Agent**: Validates input types and schedules pipeline tasks.
2. **Screenshot Analysis Agent**: Preprocesses images, runs OCR, extracts visible links.
3. **URL Intelligence Agent**: Computes features, runs Random Forest model, queries domain reputation.
4. **Message Analysis Agent**: Executes NLP model, tags suspicious token offsets, scores manipulation.
5. **Expert-System Agent**: Evaluates symbolic IF-THEN rules and records matched conditions.
6. **Evidence Verification Agent**: Audits factual claims, confirms provenance, flags discordance.
7. **Risk Assessment Agent**: Computes calibrated risk (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT_EVIDENCE`).
8. **Report Generation Agent**: Synthesizes executive briefing, technical breakdown, and next steps via Gemini or deterministic template synthesizer.

### Module G — Pakistan Cyber Safety Center
- **Individual Cybercrime Complaints**: Direct verified links to the National Cyber Crime Investigation Agency ([NCCIA Portal](https://complaint.nccia.gov.pk/)) and helpline `9999`.
- **Organizational Incident Desk**: Direct verified links to the Pakistan Computer Emergency Response Team ([PKCERT](https://pkcert.gov.pk/report-incident/)).
- **Clear Governance Distinction**: Explains that NCCIA handles citizen cybercrime complaints while PKCERT coordinates critical infrastructure and organizational incident response.
- **Regulatory Transparency**: CyberShield AI clearly discloses it is an independent AIES academic project and never auto-submits reports to government bodies.

---

## 4. Security & Privacy Architecture

- **SSRF Protection**: `backend/app/core/security.py` validates target URLs against `BLOCKED_IP_NETWORKS` (RFC1918 private ranges, `127.0.0.1/8`, `169.254.169.254` cloud metadata, `::1`, multicast, and reserved blocks).
- **Prompt Injection Defense**: Sanitizes untrusted user evidence before forwarding to LLM models, detecting and neutralizing prompt injection attempts.
- **Safe Offline Inspection**: Never automatically opens submitted links in browser; static URL decomposition prevents remote code execution.
- **Privacy & Data Retention**: Analysts can permanently purge individual cases and evidence artifacts via the Settings tab.

---

## 5. Quickstart & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies (already satisfied in workspace)
python -m pip install fastapi uvicorn pydantic scikit-learn numpy pandas pillow pytesseract python-dotenv pytest pytest-asyncio google-genai

# Run automated tests (19/19 passing)
python -m pytest tests/test_cybershield.py -v

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API docs are live at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
# Navigate to frontend directory in another terminal
cd frontend

# Install dependencies
npm install

# Build production bundle (verified 0 errors)
npm run build

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 6. Automated Test Suite (100% Pass)

Run all tests via pytest:
```bash
cd backend
python -m pytest tests/test_cybershield.py -v
```

Output:
```text
tests/test_cybershield.py::test_url_feature_extraction_lexical PASSED    [  5%]
tests/test_cybershield.py::test_url_model_prediction_malicious PASSED    [ 10%]
tests/test_cybershield.py::test_url_model_prediction_legitimate PASSED   [ 15%]
tests/test_cybershield.py::test_nlp_span_extraction PASSED               [ 21%]
tests/test_cybershield.py::test_nlp_classifier_social_engineering PASSED [ 26%]
tests/test_cybershield.py::test_nlp_classifier_clean_text PASSED         [ 31%]
tests/test_cybershield.py::test_expert_system_credential_harvesting_rule PASSED [ 36%]
tests/test_cybershield.py::test_expert_system_conflicting_evidence_rule PASSED [ 42%]
tests/test_cybershield.py::test_expert_system_insufficient_evidence PASSED [ 47%]
tests/test_cybershield.py::test_ssrf_blocked_destinations PASSED         [ 52%]
tests/test_cybershield.py::test_prompt_injection_sanitization PASSED     [ 57%]
tests/test_cybershield.py::test_image_header_validation PASSED           [ 63%]
tests/test_cybershield.py::test_orchestrator_combined_pipeline PASSED    [ 68%]
tests/test_cybershield.py::test_api_create_investigation_endpoint PASSED [ 73%]
tests/test_cybershield.py::test_api_get_investigation_by_id PASSED       [ 78%]
tests/test_cybershield.py::test_api_list_investigations PASSED           [ 84%]
tests/test_cybershield.py::test_api_models_metrics PASSED                [ 89%]
tests/test_cybershield.py::test_api_rules_catalog PASSED                 [ 94%]
tests/test_cybershield.py::test_api_health_check PASSED                  [100%]

============================= 19 passed in 20.30s =============================
```

---

## 7. Interactive Demonstration Scenarios

In the **Investigation Studio**, 5 pre-loaded realistic scenarios are ready for 1-click evaluation:
1. **HBL Bank Smishing (OTP Theft)**: Demonstrates credential harvesting on disposable `.top` domain, triggering `RULE_CRED_01` (CRITICAL).
2. **BISP Social Support Lottery (Roman Urdu)**: Demonstrates detection of advance-fee fraud in Roman Urdu (`Mubarik ho! Aap k 25,000 rupay`), triggering `RULE_PAK_08` and `RULE_FIN_09` (CRITICAL).
3. **Detained Parcel Customs Scam**: Demonstrates fake Pakistan Post parcel detention with courier customs fee solicitations.
4. **Legitimate PKCERT Advisory Portal**: Demonstrates false-positive resistance on clean government domains (`https://pkcert.gov.pk/advisories`) classified as `LOW RISK / CLEAN`.
5. **Cross-Modal Discrepancy**: Demonstrates arbitration when a legitimate domain (`wikipedia.org`) is embedded inside a fraudulent extortion message, triggering `RULE_DISCORD_04`.

---

## 8. Limitations & Future Extensions

- **Static vs Dynamic Web Analysis**: CyberShield AI performs static lexical and structural analysis of URLs. To avoid SSRF and malicious payload execution, live in-browser DOM and JavaScript execution is not performed.
- **Sender Verification**: NLP models evaluate message semantics and cannot independently cryptographically verify SS7 telecom headers or SIM card ownership without telco carrier integration.
- **Advanced Visual Similarity**: Screenshot analysis currently performs OCR text and URL extraction; computer vision Siamese-network visual brand logo matching is planned as a future module.

---

## 9. Academic Project Metadata

- **Course**: Artificial Intelligence and Expert Systems (AIES)
- **Project**: Semester Project 3 — CyberShield AI
- **Technologies**: Python 3.14, FastAPI, Scikit-Learn, PyTorch/Transformers, Pillow, SQLite, React 19, Vite, Tailwind CSS, Lucide Icons, Recharts.
