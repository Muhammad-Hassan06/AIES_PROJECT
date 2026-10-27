# Corpus Ingestion Status & Future Documents (CORPUS_TODO.md)

This log tracks all ingested legal and regulatory source texts for the CyberShield Grounded RAG system, alongside documents pending retrieval or restricted behind physical gazette publications.

## Ingested Documents (Verified Public Guidance & Law)
1. **Prevention of Electronic Crimes Act, 2016 (PECA)**
   - *Sections*: 13 (Electronic Forgery), 14 (Electronic Fraud), 16 (Unauthorized Use of Identity Information), 17 (Unauthorized Issuance of SIM Cards).
   - *Source*: National Assembly of Pakistan (`na.gov.pk/uploads/documents/1472635250_286.pdf`).
   - *Status*: Verified & Ingested into `peca_2016_sections.json`.
2. **National CERT / PKCERT Smishing Alert (NCA-11.052424)**
   - *Subject*: Smishing Alert on Fake Delivery Package Scam Threats & Incident Reporting Protocol.
   - *Source*: PKCERT / National CERT Portal (`https://pkcert.gov.pk/report-incident.asp`).
   - *Status*: Verified & Ingested into `pkcert_smishing_advisories.json`.
3. **State Bank of Pakistan (SBP) Consumer Protection Directives**
   - *Subject*: Digital Banking App Security, TPIN/FPIN Shift, OTP Solicitation Prohibition, Bank Liability Framework, and CPD Redressal Escalation.
   - *Source*: SBP Consumer Protection Department (`https://www.sbp.org.pk/cpd/cpd.asp`).
   - *Status*: Verified & Ingested into `sbp_consumer_protection.json`.
4. **National Cyber Crime Investigation Agency (NCCIA) SOP**
   - *Subject*: Citizen Cybercrime Mandate, 24/7 Helpline 9999, Digital Evidence Preservation Checklist.
   - *Source*: NCCIA Complaint Desk (`https://complaint.nccia.gov.pk/`).
   - *Status*: Verified & Ingested into `nccia_complaint_procedure.json`.
5. **CyberShield Multilingual Safety FAQ**
   - *Subject*: Common citizen fraud scenarios in English, Urdu (اردو), and Roman Urdu.
   - *Status*: Verified & Ingested into `cybershield_faq.json` (explicitly tagged as `CyberShield FAQ`).

---

## Pending Documents / Future Ingestion Roadmap (CORPUS_TODO)
- [ ] **PECA 2024 / 2025 Draft Amendments**: Full gazette text pending final presidential assent and official notification by the Senate Secretariat.
- [ ] **Provincial Police Cyber Desks (Punjab Police Khidmat Markaz & Sindh CPLC Manuals)**: Standard operating procedures for physical reporting of cyber-financial extortion across provincial police stations.
- [ ] **PTA DIRBS (Device Identification, Registration & Blocking System) Telecom Manual**: Complete technical specifications on IMEI pairing and unauthorized handset blocking protocols.
