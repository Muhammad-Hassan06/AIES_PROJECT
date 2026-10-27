# CyberShield AI — Frontend Client

A responsive, high-fidelity React + Vite + Tailwind CSS client for the **CyberShield AI** multimodal cyber-threat investigation platform.

## Architecture & Design System

- **Stack**: React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Recharts, Vitest
- **Theme**: Clean editorial light theme
  - Background: Warm off-white (`#FAFAF9`)
  - Surfaces: Crisp white (`#FFFFFF`) with soft borders (`#E7E5E4`)
  - Primary Accent: Deep blue-teal (`#0F766E`)
  - Typography: `Inter` font family (monospace reserved exclusively for case IDs, hashes, and technical code tokens)
- **Internationalization**: Full multilingual switching for English, Urdu (اردو), and Roman Urdu with automatic RTL bidirectional layout alignment.

## Navigation Suite (9 Tabs + Batch Suite)

1. **Investigate (`/` or `/cases/CS-XXXX`)**: Multi-modal investigation studio with restored case history banner, animated 8-agent pipeline graph, telemetry stepper, and interactive confidence explainers.
2. **Cases (`/cases`)**: Searchable case history vault with formatted Pakistani dates, risk badges, submitted payload previews, and single-click studio restoration.
3. **Agent Console**: Autonomous tool-calling investigator agent powered by Gemini function calling with step cap safety (max 8 steps), live execution timeline, user approval gate, and follow-up case chat.
4. **Knowledge Base**: Grounded RAG search across verified Pakistani cyber legislation (PECA 2016), SBP circulars, PKCERT advisories, and NCCIA SOPs. Supports query-level abstention on out-of-scope prompts and automated 20-Q evaluation benchmark.
5. **Threat Trends**: Real-time forensic analytics computed locally from the SQLite vault (timeline by risk level, modality breakdown, top rules, and impersonated institutions).
6. **Models & Data**: Complete provenance and evaluation cards for all 6 AI/ML components, with honest disclosures regarding synthetic NLP training sets and PhiUSIIL domain-leakage caveats alongside stricter Domain-Disjoint holdout scores.
7. **Awareness Academy**: "Scam of the day" card, interactive "Spot the scam" quiz challenge, and grounded micro-lessons in 3 languages.
8. **Batch & Compare**: Concurrent processing of up to 20 URLs/messages, side-by-side comparison of 2 cases, and redacted "Share-Safe" export (masking CNICs, phone numbers, and IBANs).
9. **Safety Center**: Official Pakistani cyber emergency helplines (NCCIA 9999, PKCERT, SBP, commercial bank hotlines).
10. **Settings**: Vault diagnostics, local cache purging, and motion preferences.

## Quickstart

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Run automated Vitest test suite
npm test

# Build production bundle
npm run build
```
