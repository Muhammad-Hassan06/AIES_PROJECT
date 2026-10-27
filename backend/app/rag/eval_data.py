"""
CyberShield AI Grounded RAG 20-Question Evaluation Benchmark
Covers PECA 2016 statutory law, PKCERT advisories, SBP consumer directives, 
NCCIA reporting SOP, CyberShield multilingual FAQs, and out-of-scope abstention test cases.
"""

RAG_EVALUATION_DATASET = [
    # In-Scope Statutory PECA 2016 Questions
    {
        "id": "Q01",
        "question": "What is the punishment for electronic fraud under PECA 2016?",
        "expected_doc_id": "LAW_PECA_2016",
        "expected_section": "14",
        "language": "en",
        "should_abstain": False
    },
    {
        "id": "Q02",
        "question": "Under which section of PECA is electronic forgery defined and penalized?",
        "expected_doc_id": "LAW_PECA_2016",
        "expected_section": "13",
        "language": "en",
        "should_abstain": False
    },
    {
        "id": "Q03",
        "question": "What does Section 16 of PECA 2016 say about stealing or using someone's identity information?",
        "expected_doc_id": "LAW_PECA_2016",
        "expected_section": "16",
        "language": "en",
        "should_abstain": False
    },
    {
        "id": "Q04",
        "question": "Is selling a mobile SIM card without biometric verification an offence in Pakistan?",
        "expected_doc_id": "LAW_PECA_2016",
        "expected_section": "17",
        "language": "en",
        "should_abstain": False
    },

    # In-Scope PKCERT Smishing & Advisory Questions
    {
        "id": "Q05",
        "question": "How do fake Pakistan Post package detention SMS scams work according to PKCERT?",
        "expected_doc_id": "CERT_PK_SMISHING",
        "expected_section": "1",
        "language": "en",
        "should_abstain": False
    },
    {
        "id": "Q06",
        "question": "What are the key technical indicators of smishing messages highlighted by PKCERT?",
        "expected_doc_id": "CERT_PK_SMISHING",
        "expected_section": "2",
        "language": "en",
        "should_abstain": False
    },
    {
        "id": "Q07",
        "question": "Where can organizations report cyber security incidents to the National CERT?",
        "expected_doc_id": "CERT_PK_SMISHING",
        "expected_section": "3",
        "language": "en",
        "should_abstain": False
    },

    # In-Scope SBP Consumer Protection Directives
    {
        "id": "Q08",
        "question": "Does any bank in Pakistan have authority to ask customers for an OTP over telephone call?",
        "expected_doc_id": "SBP_CONSUMER_PROTECTION",
        "expected_section": "1",
        "language": "en",
        "should_abstain": False
    },
    {
        "id": "Q09",
        "question": "What is the bank's liability if an unauthorized digital transaction takes place without customer negligence?",
        "expected_doc_id": "SBP_CONSUMER_PROTECTION",
        "expected_section": "2",
        "language": "en",
        "should_abstain": False
    },
    {
        "id": "Q10",
        "question": "How can a consumer escalate a banking dispute if their commercial bank does not resolve fraud complaints?",
        "expected_doc_id": "SBP_CONSUMER_PROTECTION",
        "expected_section": "3",
        "language": "en",
        "should_abstain": False
    },

    # In-Scope NCCIA Reporting & Evidence Preservation
    {
        "id": "Q11",
        "question": "What is the official toll-free helpline number for individual cybercrime reporting to NCCIA?",
        "expected_doc_id": "NCCIA_COMPLAINT_PROCEDURE",
        "expected_section": "2",
        "language": "en",
        "should_abstain": False
    },
    {
        "id": "Q12",
        "question": "What digital evidence must a victim preserve when lodging a cyber fraud complaint with NCCIA?",
        "expected_doc_id": "NCCIA_COMPLAINT_PROCEDURE",
        "expected_section": "3",
        "language": "en",
        "should_abstain": False
    },

    # In-Scope Multilingual FAQs (Urdu & Roman Urdu)
    {
        "id": "Q13",
        "question": "Agar kisi personal number se bank account block hone ka SMS aye to kya karna chahiye?",
        "expected_doc_id": "CYBERSHIELD_COMMUNITY_FAQ",
        "expected_section": "FAQ-01",
        "language": "ro",
        "should_abstain": False
    },
    {
        "id": "Q14",
        "question": "اگر غلطی سے اپنا او ٹی پی کسی انجان شخص کو دے دیا ہو تو کیا فورا کرنا چاہیے؟",
        "expected_doc_id": "CYBERSHIELD_COMMUNITY_FAQ",
        "expected_section": "FAQ-02",
        "language": "ur",
        "should_abstain": False
    },
    {
        "id": "Q15",
        "question": "BISP ya Benazir program ki raqam ka message 8171 ke ilawa kisi number se aye to kya karein?",
        "expected_doc_id": "CYBERSHIELD_COMMUNITY_FAQ",
        "expected_section": "FAQ-03",
        "language": "ro",
        "should_abstain": False
    },

    # Out-of-Scope Questions (System MUST ABSTAIN)
    {
        "id": "Q16",
        "question": "What is the capital city of France?",
        "expected_doc_id": None,
        "expected_section": None,
        "language": "en",
        "should_abstain": True
    },
    {
        "id": "Q17",
        "question": "How do you cook traditional Lahori chicken biryani step by step?",
        "expected_doc_id": None,
        "expected_section": None,
        "language": "en",
        "should_abstain": True
    },
    {
        "id": "Q18",
        "question": "Who won the 1992 Cricket World Cup final at the MCG?",
        "expected_doc_id": None,
        "expected_section": None,
        "language": "en",
        "should_abstain": True
    },
    {
        "id": "Q19",
        "question": "What is the current stock market price of Apple Inc (AAPL)?",
        "expected_doc_id": None,
        "expected_section": None,
        "language": "en",
        "should_abstain": True
    },
    {
        "id": "Q20",
        "question": "How do you change a flat tire on a Toyota Corolla car?",
        "expected_doc_id": None,
        "expected_section": None,
        "language": "en",
        "should_abstain": True
    }
]
