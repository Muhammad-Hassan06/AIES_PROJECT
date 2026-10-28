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

# Run frontend test suite (10/10 passing)
npm test

# Build production bundle (verified 0 errors)
npm run build

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 6. Automated Test Suites (100% Pass)

CyberShield AI enforces end-to-end verification across both its Python backend and React frontend.

### A. Backend Pytest Suite (19/19 Passing)
```bash
$env:PYTHONPATH="backend"
python -m pytest backend/tests/test_cybershield.py -v
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

### B. Frontend Vitest Suite (10/10 Passing across 4 Suites)
```bash
cd frontend
npm test
```
Output:
```text
 ✓ src/test/redact.test.js (5 tests)
   ✓ masks Pakistani CNIC in standard format
   ✓ masks mobile numbers with unmasked prefix and suffix
   ✓ masks credit card and 16-digit bank account numbers
   ✓ masks OTP authentication codes
   ✓ preserves non-sensitive text without altering message meaning
 ✓ src/test/language.test.jsx (1 test)
   ✓ switches language between English, Urdu, and Roman Urdu with dir=rtl
 ✓ src/test/collapsible.test.jsx (2 tests)
   ✓ renders collapsed by default with proper aria attributes
   ✓ expands and collapses content when clicked
 ✓ src/test/verdict.test.jsx (2 tests)
   ✓ renders risk verdict card with gauge, plain-language summary, and actions
   ✓ renders calm insufficient evidence state cleanly

 Test Files  4 passed (4)
      Tests  10 passed (10)
```

---

## 7. Modern Light Theme & Progressive Disclosure UI Architecture

CyberShield AI features an accessible, human-centered **Light Design System** engineered specifically to combat user anxiety and cognitive fatigue during high-stress cyber threat triage:

- **Warm Editorial Color Tokens**:
  - Background: Warm off-white (`#FAFAF9` / Stone 50)
  - Card & Surface: Crisp white (`#FFFFFF`) with soft neutral borders (`#E7E5E4` / Stone 200)
  - Typography: Deep slate (`#0F172A`) for high legibility and muted slate (`#64748B`) for secondary metadata
  - Primary Accent: Deep authoritative teal (`#0F766E` / Teal 700)
  - Risk Semantic Colors: Accessible WCAG AA-compliant palette (Critical `#DC2626`, High `#EA580C`, Medium `#D97706`, Low `#16A34A`, Insufficient Evidence `#475569`)
- **Calm Progressive Disclosure**:
  - Max 3 visual sections above the fold
  - Primary Hero: Prominent **Risk Verdict Card** featuring an animated semicircle gauge, plain-language verdict summary, and immediate action buttons
  - **Simple / Technical View Toggle**: Lets non-technical citizens read clear guidance while forensic analysts can instantly toggle full technical model scores, token offsets, and raw telemetry
  - **Collapsible Evidence Sections**: Detailed technical dossiers (Evidence Ledger, Rule Executions, Token Attribution, Provenance Audit) are cleanly collapsed by default with smooth micro-transitions and full keyboard/screen-reader accessibility
- **Multilingual RTL Architecture**:
  - Supports **English**, **Urdu (اردو)** with native RTL layout and Google *Noto Nastaliq Urdu* typography, and **Roman Urdu** for localized comprehension across Pakistan.

---

## 8. Interactive Demonstration Scenarios

In the **Investigation Studio**, 5 pre-loaded realistic scenarios are ready for 1-click evaluation:
1. **HBL Bank Smishing (OTP Theft)**: Demonstrates credential harvesting on disposable `.top` domain, triggering `RULE_CRED_01` (CRITICAL).
2. **BISP Social Support Lottery (Roman Urdu)**: Demonstrates detection of advance-fee fraud in Roman Urdu (`Mubarik ho! Aap k 25,000 rupay`), triggering `RULE_PAK_08` and `RULE_FIN_09` (CRITICAL).
3. **Detained Parcel Customs Scam**: Demonstrates fake Pakistan Post parcel detention with courier customs fee solicitations.
4. **Legitimate PKCERT Advisory Portal**: Demonstrates false-positive resistance on clean government domains (`https://pkcert.gov.pk/advisories`) classified as `LOW RISK / CLEAN`.
5. **Cross-Modal Discrepancy**: Demonstrates arbitration when a legitimate domain (`wikipedia.org`) is embedded inside a fraudulent extortion message, triggering `RULE_DISCORD_04`.

---

## 9. Changelog: 12-Feature Redesign & Enhancement

### Feature 1: One-Click Demo Scenario Cards
- Added 5 curated one-click scenario cards right on the home intake studio with realistic Pakistani fraud vectors (Bank Smishing, BISP lottery, Detained parcel, Legitimate advisory, Cross-modal conflict) enabling instant demonstration without manual typing.

### Feature 2: Highlighted Message View with Threat Categories
- Implemented character-offset inline highlighted message renderer with semantic color-coded underlines per category:
  - Red underline: Credential Harvesting & 2FA Theft
  - Orange underline: Urgency & Legal Coercion
  - Amber underline: Financial Demands & Advance-Fees
  - Purple underline: Impersonation of Banks or Government Institutions
  - Blue underline: Malicious & Disposable Links
- Includes interactive hover tooltips explaining why each span was flagged and a dynamic legend displaying only active categories.

### Feature 3: Actionable "What should I do now?" Card
- Designed a prominent, non-panicky action card customized to the detected risk level with step-by-step guidance (e.g. "Do not reply or share OTP", "Block sender", "Contact your bank's official UAN").
- Added 1-click **Copy Investigation Report** to clipboard and **Print / Save as PDF** with clean print styling.

### Feature 4: Privacy-First Share-Safe Summary Modal
- Built a redaction pipeline (`src/utils/redact.js`) that automatically masks:
  - Pakistani CNICs (`XXXXX-XXXXXXX-X`)
  - Mobile numbers (`03XX-***-XXXX`)
  - Credit cards and 16-digit bank accounts (`****-****-****-1234`)
  - OTP authentication codes
- Generates a sanitized summary suitable for sharing with family, community groups, or posting on social media, with 1-click WhatsApp share and clipboard copy.

### Feature 5: Searchable Case Vault with Trend Insights
- Added a high-performance case history browser in the **Cases** tab with instant text search, multi-filter dropdowns (Risk Level, Modality, Date Range), and single-case deletion with confirmation.
- Integrated Recharts visual trends in the **Insights** tab showing threat distribution by risk tier and modality over time.

### Feature 6: Full Multilingual Support (English, Urdu & Roman Urdu)
- Integrated `LanguageContext` supporting English, Urdu, and Roman Urdu across all primary UI navigation, buttons, and analysis views.
- Implemented full RTL (`dir="rtl"`) layout switching and applied the elegant *Noto Nastaliq Urdu* font family for native Urdu text.

### Feature 7: Pakistan Cyber Awareness Center
- Built an educational hub featuring:
  - **Scam of the Day**: Rotating real-world scams commonly targeting Pakistani citizens (BISP lottery, fake electricity bill disconnection, WhatsApp verification code forwarding, overseas job offers) with warning signs and prevention tips.
  - **Spot the Scam Mini-Quiz**: Interactive scenario questions with immediate explanatory feedback to build public cyber hygiene.

### Feature 8: Model Transparency & Honest Audit Dashboard
- Built a live Model Intelligence view querying `/api/models/metrics` for live feature weights, ROC-AUC curves, and confusion matrix data.
- Added explicit scientific transparency notice clarifying that the 100% test accuracy on the UCI PhiUSIIL dataset reflects held-out benchmark splits and is subject to benchmark leakage in lexical datasets, balanced in production by the symbolic Expert System.

### Feature 9: Reassuring "Insufficient Evidence" Outcome
- Elevated "Insufficient Evidence" to a first-class, calm result state with neutral slate styling (`#475569`), reassuring the user that the system does not jump to false conclusions and offering actionable next steps on what additional signals to supply.

### Feature 10: Official Authority Reporting Helper (NCCIA & PKCERT)
- Developed an authority guidance card detailing the explicit mandates:
  - **NCCIA** (`complaint.nccia.gov.pk` / helpline `9999`) for individuals and citizen cybercrime complaints.
  - **PKCERT** (`pkcert.gov.pk/report-incident/`) for organizational security teams and critical infrastructure.
- Features a printable evidence checklist and an unambiguous disclaimer stating CyberShield AI never automatically submits reports on the user's behalf.

### Feature 11: Privacy & System Preference Settings
- Built a dedicated **Settings** page offering:
  - Configurable data retention policies (7 days, 30 days, 90 days, or Manual Only).
  - Destructive **Purge All Cases** action with a secure confirmation dialog.
  - Default view mode preference (Simple vs. Technical).
  - Default language selection (English, Urdu, Roman Urdu).

### Feature 12: Modern Input Polish & Mobile Responsiveness
- Added 1-click **Paste from Clipboard** button for quick message intake.
- Drag-and-drop screenshot upload dropzone with thumbnail preview and file size validation.
- Responsive mobile bottom tab bar navigation for seamless operation across smartphones, tablets, and desktop workstations.

---

## 10. Digital Footprint & Spam Defense Agent (DFSD)

The **Digital Footprint & Spam Defense Agent (DFSD)** extends CyberShield AI into a unified privacy defense platform. It investigates where user email addresses and Pakistani mobile numbers may be exposed in breach records or public search indices, unmasks the origin of unwanted promotional spam messages and robocalls, and formulates evidence-backed, human-in-the-loop privacy remediation plans.

### 10.1 8-Agent Orchestrated Privacy Pipeline
1. **Agent 1: Consent & Intake Agent** — Validates investigation type, enforces explicit authorization and consent checkboxes, normalizes Pakistani mobile numbers (`03XX-XXXXXXX`, `+923XXXXXXXXX`, `923XXXXXXXXX`) to E.164, maps carrier prefixes (Jazz, Telenor, Zong, Ufone, Scom), and generates keyed HMAC-SHA256 privacy identifiers.
2. **Agent 2: Discovery Planning Agent** — Inspects configured providers, checks health and credentials, transparently skips unconfigured external search engines, and builds source-specific execution plans.
3. **Agent 3: Public Exposure Discovery Agent** — Executes searches across permitted public web endpoints, local case archives, and exposure notification registries without bypassing access controls or scraping restricted portals.
4. **Agent 4: Spam Intelligence Agent** — Analyzes submitted messages, headers, call-log bursts, sender domains, and screenshots using the existing NLP, URL, and OCR pipelines to detect Pakistani institutional impersonation (HBL, Meezan, JazzCash, BISP, Pakistan Post).
5. **Agent 5: Evidence Verification Agent** — Validates whether findings are directly supported by source text, removes duplicate findings, and distinguishes direct breach evidence from unverified search index mentions.
6. **Agent 6: Privacy Risk Assessment Agent** — Evaluates exposure severity, data sensitivity, and recency using explicit expert rules alongside deterministic scoring models.
7. **Agent 7: Remediation Planning Agent** — Formulates step-by-step remediation tasks (legitimate unsubscribes, device blocking, official carrier spam reporting via PTA 9000, and personalized GDPR/PECA data deletion drafts).
8. **Agent 8: Follow-up & Reporting Agent** — Compiles structured audit dossiers, tracks remediation task states (`NOT_STARTED`, `INSTRUCTIONS_AVAILABLE`, `REQUEST_DRAFTED`, `AWAITING_USER_ACTION`, `REQUEST_SUBMITTED`, `REMOVAL_VERIFIED`), and maintains immutable case history.

### 10.2 Deterministic Privacy Expert Rules (`RULE_DF_01` – `RULE_DF_12`)
- **`RULE_DF_01`**: Verified public exposure of personal identifiers mandates documented remediation.
- **`RULE_DF_02`**: Exposure involving email and plaintext passwords triggers urgent credential protection guidance without retaining passwords.
- **`RULE_DF_03`**: Messages soliciting OTPs, PINs, or passwords trigger high-priority credential harvesting alarms.
- **`RULE_DF_04`**: Search index matches without independent verification must never be classified as confirmed website registrations.
- **`RULE_DF_05`**: Missing or unavailable discovery sources are transparently reported as *Unknown/Skipped*, never *Clean*.
- **`RULE_DF_06`**: Legitimate commercial marketing communications must not be conflated with cyberattacks solely because they are unwanted.
- **`RULE_DF_07`**: Data-removal request submission is tracked as *Request Submitted*, never prematurely marked as *Removal Verified*.
- **`RULE_DF_08`**: Successful sender blocking does not establish that underlying data held by third parties has been expunged.
- **`RULE_DF_09`**: Overlapping sources are deduplicated to prevent inflated exposure counts.
- **`RULE_DF_10`**: AI-generated text claims without corroborating source text cannot become verified findings.
- **`RULE_DF_11`**: Data exposure alerts do not constitute proof of active identity theft.
- **`RULE_DF_12`**: Conflicting evidence automatically lowers verification status and triggers explanatory audit notes.

### 10.3 Multi-Provider LLM Abstraction & Deterministic Fallback
- **Supported Providers**: Google Gemini 2.5 Flash, Groq LLaMA 3.3 70B, OpenAI GPT-4o-mini, Anthropic Claude 3.5 Sonnet.
- **Auto-Selection**: When `LLM_PROVIDER=auto`, the system checks configured credentials, tests health, selects the highest-priority reachable provider, and gracefully falls back to 100% deterministic local symbolic reasoning if all external APIs are unreachable or unconfigured.

---

## 11. Model & Dataset Transparency Disclosures

### 11.1 URL Phishing Classifier
- **Model**: Random Forest Classifier (100 estimators, max depth 12, balanced class weights).
- **Dataset**: UCI Machine Learning Repository PhiUSIIL Phishing URL Dataset ([UCI #967](https://archive.ics.uci.edu/dataset/967/phiusil-phishing-url-dataset)), augmented with synthetic and curated Pakistani phishing lures (HBL, Meezan, JazzCash, Easypaisa, BISP 8171, Pakistan Post, FBR tax refund).
- **Training Method**: 80/20 stratified train/test split. 15 structural and lexical features extracted in pure Python without external web lookups.
- **Known Limitations**: Lexical models evaluate URL structure and cannot detect compromised legitimate domains serving phishing content via dynamic client-side scripts.

### 11.2 Social Engineering NLP Classifier
- **Model**: Multinomial Naive Bayes with sublinear TF-IDF (unigram & bigram tokenization, max 3,000 features).
- **Dataset**: Curated Pakistani cyber-threat corpus containing 500+ samples of verified SMS/WhatsApp lures, lottery frauds, banking alerts, OTP extraction prompts, and genuine transactional messages in English, Urdu, and Roman Urdu.
- **Training Method**: Stratified cross-validation with custom token-level span attribution for forensic highlight visualization.
- **Known Limitations**: Highly colloquial or phonetic Roman Urdu slang variations require ongoing lexicon expansion.

### 11.3 Grounded Legal & Regulatory RAG Engine
- **Engine**: Local TF-IDF statutory retrieval engine with statutory section regex boosting (`Section 14`, `Section 16`, etc.) and calibrated cosine similarity gating (abstention threshold 0.15).
- **Corpus**: Prevention of Electronic Crimes Act (PECA 2016), State Bank of Pakistan (SBP) Consumer Protection Directives (CPD-02), PKCERT Advisories, and PTA Spam Prevention Regulations.
- **Behavior**: Retrieves authoritative statutory text for valid legal queries and strictly abstains on irrelevant non-cyber questions.

---

## 12. Cloud Deployment & Live Render Backend Integration

The project is pre-configured with a live production backend hosted on Render:
- **Live Backend URL**: `https://aies-project-hqwo.onrender.com/`
- **Frontend Automatic Routing**: `frontend/src/services/api.js` automatically uses this Render URL when deployed to production or non-localhost domains. Users are never repeatedly asked for the backend URL.
- **Vercel Reverse Proxy**: `vercel.json` provides direct `/api/(.*)` rewrites to the Render cloud backend, avoiding CORS preflight delays and ensuring seamless cross-origin communication.

---

## 13. Limitations & Future Extensions

- **Static vs Dynamic Web Analysis**: CyberShield AI performs static lexical and structural analysis of URLs. To avoid SSRF and malicious payload execution, live in-browser DOM and JavaScript execution is not performed.
- **Sender Verification**: NLP models evaluate message semantics and cannot independently cryptographically verify SS7 telecom headers or SIM card ownership without telco carrier integration.
- **Advanced Visual Similarity**: Screenshot analysis currently performs OCR text and URL extraction; computer vision Siamese-network visual brand logo matching is planned as a future module.

---

## 14. Academic Project Metadata

- **Course**: Artificial Intelligence and Expert Systems (AIES)
- **Project**: Semester Project — CyberShield AI with Digital Footprint & Spam Defense (DFSD)
- **Technologies**: Python 3.14, FastAPI, Scikit-Learn, PyTorch, Pillow, SQLite, React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Vitest.

