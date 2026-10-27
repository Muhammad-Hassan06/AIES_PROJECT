# Changelog

All notable changes to the CyberShield AI project are documented in this file.

## [2.0.0] - 2026-10-27

### Part A: Full Case History & Vault Restoration
- **Database Schema Migration**: Added columns `raw_url`, `raw_text`, `raw_sender`, `screenshot_name`, and `model_versions` to the SQLite `investigations` table with automatic safe column migration.
- **Payload Preservation**: Persisted the exact raw user input (URL, message text, email, sender, screenshot) and active model versions per case without alteration.
- **Saved Case Studio Restoration**: When clicking a case in the Vault, the full original inputs are restored into the Investigate tab inputs, exact verdicts and evidence graphs are displayed, and a sticky banner ("Viewing saved case CS-XXXX") is displayed with "Re-run Analysis" (creating a fresh case) and "Close" actions.
- **Deep-Linking**: Added deep-link routing for `/cases/CS-XXXX` and `?case=CS-XXXX` preserving state on refresh and browser back/forward navigation.
- **Editorial UI Formatting**: Replaced raw ISO dates with formatted editorial dates (`27 Oct 2026, 4:24 PM`). Ensured case headers and "Share-Safe" buttons wrap gracefully. Constrained monospace font to case IDs and code tokens while using `Inter` for primary text.
- **Honest Confidence Context**: Added contextual explainers when model confidence is high alongside low evidence volume.

### Part B: Navigation & Interactive Agentic Graph
- **9-Tab Sidebar**: Investigate, Cases, Agent Console, Knowledge Base, Threat Trends, Models & Data, Awareness Academy, Safety Center, Settings, plus Batch & Compare. Includes responsive mobile bottom bar and "More" drawer.
- **Animated 8-Agent Pipeline Graph (`AgentWorkflowGraph.jsx`)**: 8 agent nodes with flowing SVG paths, active state illumination, execution latency badges, model engine attribution badges (ML, NLP, CV, Rules, Gemini, Synthesizer), and click-to-inspect side drawers.
- **Command Palette (`CommandPaletteModal.jsx`)**: Keyboard shortcut `Ctrl+K` allowing quick jumping to any tab, searching demo scenarios, or opening cases by ID.
- **1.5s Skippable Splash Animation**: Animated startup sequence respecting `prefers-reduced-motion`.

### Part C1: Grounded RAG (`Knowledge Base` tab)
- **Verified Pakistani Corpus**: Created `backend/data/corpus/` containing authentic legislation and advisories:
  - `peca_2016_sections.json` (PECA 2016 Sections 13, 14, 16, 17)
  - `pkcert_smishing_advisories.json` (PKCERT Advisory NCA-11.052424)
  - `sbp_consumer_protection.json` (State Bank of Pakistan CPD-02 directives)
  - `nccia_complaint_procedure.json` (National Cyber Crime Investigation Agency SOPs)
  - `cybershield_faq.json` (Multilingual CyberShield FAQs)
  - `CORPUS_TODO.md` (Gazette intake queue)
- **Hybrid Retrieval & Abstention**: Sublinear TF-IDF + Gemini embeddings retrieval citing document title, section, publisher, and official gazette URLs. Strictly abstains with *"I don't have a reliable source for that in my verified Pakistan cyber safety corpus"* when questions are out-of-scope.
- **Automated 20-Q Benchmark**: 15 in-scope legal questions + 5 adversarial out-of-scope questions with automated hit-rate and abstention tracking.

### Part C2: Investigator Agent (`Agent Console` tab)
- **Tool-Calling Agent**: Autonomous agent equipped with 6 safe tools: `analyze_url`, `analyze_message`, `run_expert_rules`, `search_knowledge_base`, `lookup_similar_cases`, and `generate_report`.
- **Safety Hard Caps**: Enforces maximum 8 tool steps, offline URL inspection (zero live HTTP requests), untrusted input sanitization, and human-in-the-loop approval before saving to vault.
- **Interactive Case Chat**: Grounded Q&A drawer allowing users to interrogate the reasoning and rules behind an investigation.

### Part C3: Models & Data Transparency
- **6 Component Cards**: Random Forest URL classifier, Naive Bayes NLP analyzer, Computer Vision OCR engine, Expert Rules engine, Gemini 2.5 Flash reasoner, and Synthesis engine.
- **Benchmark Leakage Disclosure**: Disclosed that the 100% accuracy on the PhiUSIIL URL dataset is due to domain overlap across random 80/20 train/test splits.
- **Stricter Domain-Disjoint Evaluation**: Implemented and published domain-isolated holdout benchmark metrics (91.2% accuracy, 0.913 F1, 0.948 ROC-AUC) reflecting realistic zero-day generalization.
- **NLP Training Set Transparency**: Labeled NLP corpus as a curated/synthetic demonstration dataset of 40 Pakistani banking/BISP lures.

### Part C4: Threat Trends Dashboard
- **Local Vault Aggregation**: Real-time charts computed directly from the local SQLite database without cloud telemetry.
- **Metrics**: Cases over time by risk level, modality distribution, top triggered expert rules, and top impersonated institutions (HBL, Meezan, JazzCash, BISP, NADRA).

### Part C5: Awareness Academy
- **Scam of the Day**: Daily tactical breakdown of trending attacks in Pakistan.
- **Spot the Scam Quiz**: Interactive 4-scenario forensic game with score tracking and detailed explanations.
- **Grounded Lessons**: Micro-lessons in English, Urdu, and Roman Urdu citing verified legal provisions.

### Part C6: Batch Scan & Case Compare
- **Batch Processing**: Concurrent scanning of up to 20 URLs/messages with sortable results table.
- **Side-by-Side Comparison**: Side-by-side comparison of 2 selected cases highlighting verdict and rule differences.
- **Share-Safe Redacted Export**: Automatic masking of Pakistani CNICs (`[CNIC-REDACTED]`), phone numbers (`[PHONE-REDACTED]`), and IBANs/bank accounts (`[IBAN-REDACTED]`).

### Verification & Automated Testing
- **Backend**: 25/25 pytest unit tests passing (`backend/tests/test_cybershield.py`).
- **Frontend**: 14/14 Vitest tests passing across 5 suites (`frontend/src/test/`).
- **Build**: Clean production build via `npm run build` (zero errors).
