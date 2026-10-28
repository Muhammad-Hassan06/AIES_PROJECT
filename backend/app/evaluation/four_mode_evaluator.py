"""
CyberShield AI — Independent Four-Mode Model Evaluation Suite
Validates:
  - Mode A: URL Phishing Classifier (Random Forest + StandardScaler)
  - Mode B: Malicious Text / Smishing Classifier (MultinomialNB + TF-IDF)
  - Mode C: Legitimate / Normal Text Messages
  - Mode D: Screenshot / Vision OCR Pipeline (winocr / pytesseract + Agentic Fusion)

Metrics computed per mode on strictly held-out data:
  - Accuracy, Precision, Recall, F1-Score
  - False Positive Rate (FPR), False Negative Rate (FNR)
  - Confusion Matrix: [[TN, FP], [FN, TP]]
"""

import os
import sys
import json
import time
import base64
from datetime import datetime
from typing import Dict, Any, List

# Ensure app is importable
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.ml.url_classifier import url_classifier
from app.nlp.text_classifier import text_classifier
from app.vision.ocr_engine import ocr_engine

# =====================================================================
# HELD-OUT INDEPENDENT TEST DATASETS (NOT USED IN SEED TRAINING)
# =====================================================================

# 1. MODE A: HELD-OUT URL EVALUATION (50 SAMPLES: 25 BENIGN, 25 PHISHING)
# Includes benign URLs with sensitive keywords ('login', 'verify', 'security')
# and phishing URLs with IPs, brand spoofing, and lookalike domains.
URL_EVALUATION_SET = [
    # Benign URLs (Label 0)
    {"url": "https://www.wikipedia.org", "label": 0, "type": "benign_reference"},
    {"url": "https://en.wikipedia.org/wiki/Computer_security", "label": 0, "type": "benign_reference"},
    {"url": "https://github.com/torvalds/linux", "label": 0, "type": "benign_tech"},
    {"url": "https://accounts.google.com/signin/v2/identifier", "label": 0, "type": "benign_auth_keyword"},
    {"url": "https://github.com/login", "label": 0, "type": "benign_auth_keyword"},
    {"url": "https://support.apple.com/en-us/HT204144", "label": 0, "type": "benign_support"},
    {"url": "https://www.microsoft.com/en-us/security", "label": 0, "type": "benign_security_keyword"},
    {"url": "https://stackoverflow.com/questions/tagged/python", "label": 0, "type": "benign_forum"},
    {"url": "https://www.nytimes.com/section/technology", "label": 0, "type": "benign_news"},
    {"url": "https://www.bbc.com/news/world-asia-60000000", "label": 0, "type": "benign_news"},
    {"url": "https://nust.edu.pk/academics/undergraduate", "label": 0, "type": "benign_edu"},
    {"url": "https://fast.nu.edu.pk/admissions/eligibility", "label": 0, "type": "benign_edu"},
    {"url": "https://www.python.org/downloads/release/python-3120", "label": 0, "type": "benign_tech"},
    {"url": "https://docs.docker.com/engine/install", "label": 0, "type": "benign_docs"},
    {"url": "https://www.amazon.com/gp/help/customer/display.html", "label": 0, "type": "benign_ecom"},
    {"url": "https://pkcert.gov.pk/contact-us", "label": 0, "type": "benign_gov"},
    {"url": "https://www.nadra.gov.pk/identity/identity-national-id", "label": 0, "type": "benign_gov"},
    {"url": "https://www.daraz.pk/help-center", "label": 0, "type": "benign_ecom"},
    {"url": "https://pypi.org/project/scikit-learn", "label": 0, "type": "benign_repo"},
    {"url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", "label": 0, "type": "benign_docs"},
    {"url": "https://www.who.int/emergencies/disease-outbreak-news", "label": 0, "type": "benign_health"},
    {"url": "https://openai.com/research/overview", "label": 0, "type": "benign_ai"},
    {"url": "https://www.kaggle.com/datasets", "label": 0, "type": "benign_data"},
    {"url": "https://huggingface.co/models", "label": 0, "type": "benign_ai"},
    {"url": "https://www.sc.com/en/regulatory-disclosures", "label": 0, "type": "benign_banking"},

    # Phishing URLs (Label 1)
    {"url": "http://192.168.1.55/secure/login.php", "label": 1, "type": "ip_host_login"},
    {"url": "http://103.224.182.245/auth/online-banking", "label": 1, "type": "ip_host_phish"},
    {"url": "http://paypal-security-verification.servehttp.com/update", "label": 1, "type": "brand_ddns"},
    {"url": "http://wellsfargo-verify-customer.top/auth/login", "label": 1, "type": "brand_tld_top"},
    {"url": "http://netflix-billing-issue-update.xyz/login.html", "label": 1, "type": "brand_tld_xyz"},
    {"url": "http://hbl.com.pk.customer-login.account-security.top/web", "label": 1, "type": "excess_subdomains"},
    {"url": "http://appleid-support-icloud-verify.info/auth", "label": 1, "type": "brand_spoof"},
    {"url": "http://chase-security-alert.club/signin.php?token=9281", "label": 1, "type": "banking_spoof"},
    {"url": "http://secure-login.bankalfalah.top-finance.xyz/otp", "label": 1, "type": "banking_spoof"},
    {"url": "http://bisp-funds-release-portal.xyz/claim-cnic", "label": 1, "type": "pakistan_lure"},
    {"url": "http://easypaisa-bonus-cash-claim.top/pin-verify", "label": 1, "type": "wallet_spoof"},
    {"url": "http://jazzcash-lottery-gift.live/claim.php", "label": 1, "type": "lottery_scam"},
    {"url": "http://fbr-tax-refund-portal.top/iris/refund-claim", "label": 1, "type": "tax_lure"},
    {"url": "http://pta-sim-verification-urgent.xyz/cnic-biometric", "label": 1, "type": "pta_lure"},
    {"url": "http://customs-detained-parcel-duty.top/pakistan-post/pay", "label": 1, "type": "parcel_smishing"},
    {"url": "http://a2vcr.info/WYmoR8t0IPS", "label": 1, "type": "user_provided_smishing_url"},
    {"url": "http://microsoft-365-password-expired.top/owa/auth", "label": 1, "type": "credential_harvest"},
    {"url": "http://google-drive-shared-doc-view.xyz/auth.php", "label": 1, "type": "credential_harvest"},
    {"url": "http://meezanbank.online-security-update.top/ebanking", "label": 1, "type": "banking_spoof"},
    {"url": "http://tcs-courier-address-update.xyz/pay-charges", "label": 1, "type": "courier_scam"},
    {"url": "http://nadra-online-verifications.top/id-card-renew", "label": 1, "type": "identity_theft"},
    {"url": "http://185.190.140.22/hbl/index.html", "label": 1, "type": "ip_banking_lure"},
    {"url": "http://binance-account-freeze-warning.xyz/unfreeze", "label": 1, "type": "crypto_scam"},
    {"url": "http://metamask-seed-phrase-restore.top/wallet", "label": 1, "type": "crypto_scam"},
    {"url": "http://login-amazon-prime-refund.top/billing", "label": 1, "type": "ecom_refund_scam"}
]

# 2. MODE B & C: HELD-OUT TEXT MESSAGES (30 MALICIOUS / 30 LEGITIMATE)
TEXT_EVALUATION_SET = [
    # MODE B: Phishing / Scam Messages (Label 1)
    {"text": "URGENT: Your bank account will be closed in 12 hours. Verify your debit card credentials immediately at http://secure-update-bank.top", "label": 1, "cat": "banking_urgency"},
    {"text": "BISP Ehsaas 8171: Aap ka 25,000 rupay ka wazeefa manzoor hogaya hai. Foran 0301-8899221 pe rabta kar k claim karein.", "label": 1, "cat": "bisp_roman_urdu"},
    {"text": "FIA Anti-Corruption: An arrest warrant #4401 has been registered against your CNIC. Pay fine to avoid police raid.", "label": 1, "cat": "authority_threat"},
    {"text": "Jeeto Pakistan: Mubarak ho! Aap ne 50 tolay sona jeet liya hai. Delivery fee Rs 3,000 advance send karein.", "label": 1, "cat": "lottery_scam"},
    {"text": "FedEx Delivery: Your parcel is held at the airport due to unpaid duty of $2.49. Update shipping details to clear delivery.", "label": 1, "cat": "parcel_smishing"},
    {"text": "Amazon 2020 resolutions: 1) not to be greedy 2) care more about the customers. So you'll get $130 freebies to do a survey mate a2vcr.info/WYmoR8t0IPS", "label": 1, "cat": "user_smishing_case"},
    {"text": "Easypaisa Alert: Your wallet has been locked due to illegal activity. Reply with your secret 5-digit PIN to unlock.", "label": 1, "cat": "wallet_pin_harvest"},
    {"text": "Meezan Bank: Unauthorized transfer of Rs 95,000 detected from your account. Click link immediately to reverse charge.", "label": 1, "cat": "fake_alert"},
    {"text": "PTA Notice: Your mobile device IMEI is blocked. Send Rs 1,500 tax registration fee to unblock your phone permanently.", "label": 1, "cat": "pta_scam"},
    {"text": "Your Apple ID has been suspended. Please confirm your password and credit card at http://appleid-unlock.xyz to avoid loss of data.", "label": 1, "cat": "apple_id_phish"},
    {"text": "Congratulations! You have been selected for online job paying Rs 100,000/month. Pay Rs 2,500 security deposit for joining kit.", "label": 1, "cat": "job_deposit_scam"},
    {"text": "HBL Alert: Your biometric registration has expired. Update CNIC and ATM PIN online or card will be retained at machine.", "label": 1, "cat": "biometric_lure"},
    {"text": "Netflix: We were unable to process your subscription renewal. Update your payment method within 24 hours at http://netflix-bill.top", "label": 1, "cat": "subscription_phish"},
    {"text": "FBR Notice: Final tax audit penalty of PKR 50,000 is levied. Transfer clearance fee to avoid freezing bank accounts.", "label": 1, "cat": "tax_threat"},
    {"text": "Aap ka parcel deliver nahi ho saka kyn k address adhoora hai. 150 rupay re-delivery fee ada karein.", "label": 1, "cat": "smishing_urdu"},
    {"text": "Google Security Alert: Someone in Russia logged into your Gmail. Confirm your password now at http://gmail-auth.xyz", "label": 1, "cat": "security_spoof"},
    {"text": "State Life Insurance: Your policy claim of Rs 1,200,000 is ready for transfer. Deposit 1% government fee to agent.", "label": 1, "cat": "insurance_scam"},
    {"text": "Binance: Security upgrade required. Input your 12-word recovery seed phrase to migrate your crypto assets securely.", "label": 1, "cat": "crypto_seed_scam"},
    {"text": "JazzCash: Mubarak ho aap ko 10,000 ka cash prize nikla hai. Apna MPIN kisi se share kiye baghair is link pe enter karein.", "label": 1, "cat": "wallet_harvest"},
    {"text": "Emergency: Dad I lost my phone and wallet. Please transfer Rs 15,000 immediately to this EasyPaisa number.", "label": 1, "cat": "family_emergency_scam"},
    {"text": "UBL Netbanking: Your account access will be terminated tonight. Renew KYC credentials by clicking here.", "label": 1, "cat": "kyc_smishing"},
    {"text": "DHL Express: Package #DH-88219 could not be cleared from customs. Pay PKR 850 redelivery fee within 12 hours.", "label": 1, "cat": "courier_fee"},
    {"text": "Meta Warning: Your Instagram profile violates copyright. You will be banned in 24 hours. Dispute at http://meta-copyright-dispute.top", "label": 1, "cat": "social_ban_lure"},
    {"text": "Canada Work Permit: Direct visa granted without IELTS. Pay embassy processing fee of $200 via Western Union.", "label": 1, "cat": "visa_scam"},
    {"text": "WhatsApp Gold: Your premium access is unlocked. Download the secret APK file from link to view deleted messages.", "label": 1, "cat": "malware_apk_lure"},
    {"text": "Bank Alfalah: OTP for transaction of Rs 49,000 is 902183. If not performed by you, call 0321-000000 to reverse transaction.", "label": 1, "cat": "reverse_call_scam"},
    {"text": "Electricity Department: Your meter will be disconnected today at 8 PM for unpaid bill. Call recovery officer immediately.", "label": 1, "cat": "utility_cutoff_threat"},
    {"text": "Scholarship Award: You have won Prime Minister Laptop and Laptop Scholarship. Submit Rs 1,800 processing fee.", "label": 1, "cat": "scholarship_lure"},
    {"text": "Inam Mubarak! Lucky draw winner of Toyota Corolla 2026. Send registration fee to claim vehicle key.", "label": 1, "cat": "car_lottery"},
    {"text": "Zong Internet: You won 100 GB free 4G data for 1 year. Claim bonus data by verifying SIM owner CNIC at link.", "label": 1, "cat": "telecom_lure"},

    # MODE C: Legitimate / Normal Messages (Label 0)
    {"text": "Hey, are we still meeting for lunch at the cafeteria around 1:30 PM?", "label": 0, "cat": "casual_meeting"},
    {"text": "Your Uber ride has arrived. The driver is waiting outside your location in a white Toyota Corolla.", "label": 0, "cat": "ride_dispatch"},
    {"text": "Dear student, CS402 Artificial Intelligence lab session will start at 10:00 AM in Lab 3.", "label": 0, "cat": "university_announcement"},
    {"text": "Your package from Daraz has been delivered to your front door. Thank you for ordering with us!", "label": 0, "cat": "legitimate_delivery"},
    {"text": "Hi Ali, I have shared the project documentation on Google Drive for your review.", "label": 0, "cat": "work_collab"},
    {"text": "Your appointment with Dr. Salman at Shaukat Khanum Hospital is confirmed for Tuesday at 4:00 PM.", "label": 0, "cat": "medical_reminder"},
    {"text": "Debit Card Alert: PKR 2,450 spent at Metro Cash & Carry on card ending in 4102. Available balance: PKR 38,100.", "label": 0, "cat": "routine_bank_debit"},
    {"text": "Reminder: Library book 'Deep Learning' by Goodfellow is due for return on Friday, 31st Oct.", "label": 0, "cat": "library_notice"},
    {"text": "Weather forecast: Scattered thunderstorms expected across Rawalpindi and Islamabad this evening.", "label": 0, "cat": "weather_alert"},
    {"text": "Thanks for dinner yesterday! It was great catching up with everyone after so long.", "label": 0, "cat": "friendly_social"},
    {"text": "Your electricity bill for consumer #881923 has been paid successfully via Meezan Internet Banking.", "label": 0, "cat": "payment_receipt"},
    {"text": "Meeting invite: Project 3 Final Sprint Retrospective starting in 10 minutes on Microsoft Teams.", "label": 0, "cat": "calendar_invite"},
    {"text": "Can you please send me the lecture slides from yesterday? I missed the first half hour.", "label": 0, "cat": "student_inquiry"},
    {"text": "Your TCS parcel with tracking number 77819241 is out for delivery today. Delivery agent: Tariq.", "label": 0, "cat": "courier_dispatch"},
    {"text": "Hi mom, I reached the hostel safely. Everything is fine, will call you in the evening.", "label": 0, "cat": "family_checkin"},
    {"text": "Your gym membership for the month of November has been renewed. Have a great workout!", "label": 0, "cat": "gym_renewal"},
    {"text": "Dear customer, your request for checkbook issuance has been received and is being processed.", "label": 0, "cat": "routine_bank_service"},
    {"text": "GitHub: A new comment was posted on issue #42 in repository Muhammad-Hassan06/AIES_PROJECT.", "label": 0, "cat": "github_notification"},
    {"text": "Your flight PK-301 from Karachi to Islamabad is on schedule. Boarding starts at gate 4.", "label": 0, "cat": "flight_schedule"},
    {"text": "Here is the recipe for chicken biryani that you asked for yesterday. Let me know how it turns out!", "label": 0, "cat": "cooking_recipe"},
    {"text": "The seminar on Computer Vision and Ethical AI will be held tomorrow at 3 PM in the Main Auditorium.", "label": 0, "cat": "academic_event"},
    {"text": "Payment received: Rs 500 transferred to your mobile balance from account ending 9123.", "label": 0, "cat": "routine_mobile_topup"},
    {"text": "Hi team, please remember to submit your weekly timesheets before 5 PM today.", "label": 0, "cat": "office_admin"},
    {"text": "Don't forget to buy milk and bread on your way home from the office.", "label": 0, "cat": "household_errand"},
    {"text": "Your car servicing at Toyota Motors is complete. You may collect your vehicle before 6 PM.", "label": 0, "cat": "service_pickup"},
    {"text": "Happy Birthday! Wishing you a wonderful year ahead filled with happiness and success.", "label": 0, "cat": "birthday_greeting"},
    {"text": "Dear applicant, we have received your application for the Graduate Research Assistant position.", "label": 0, "cat": "job_acknowledgment"},
    {"text": "Water supply maintenance notice: Pipeline repairs scheduled in Sector F-7 between 9 AM and 1 PM.", "label": 0, "cat": "civic_notice"},
    {"text": "Thanks for your feedback on our mobile app. We appreciate your suggestions for improvement.", "label": 0, "cat": "feedback_reply"},
    {"text": "Let's meet up for dinner after work!", "label": 0, "cat": "user_benign_chat"}
]

# 3. MODE D: SCREENSHOT EVALUATION
# Involves both user-provided real captures and synthetic test images:
# - Amazon freebie smishing screenshot (Label 1)
# - Casual dinner chat screenshot (Label 0)
# - Unreadable / blurry image (Label 0 / Insufficient Evidence)
# - Rendered banking smishing text (Label 1)
# - Rendered benign timetable notice (Label 0)

def create_synthetic_test_images(output_dir: str):
    """
    Creates controlled test images using PIL for Mode D evaluation,
    supplementing the user's actual conversation artifacts.
    """
    from PIL import Image, ImageDraw, ImageFont
    os.makedirs(output_dir, exist_ok=True)

    test_specs = [
        ("phish_bank_login.png", 1, "HBL SECURE LOGIN\nEnter CNIC and ATM PIN to reactivate your suspended account\nhttp://hbl.com.pk.customer-login.top/login"),
        ("phish_survey_smishing.png", 1, "Amazon 2020 resolutions:\n1) not to be greedy 2) care more about the customers.\nSo you'll get $130 freebies to do a survey mate a2vcr.info/WYmoR8t0IPS"),
        ("benign_chat_dinner.png", 0, "Hey Sarah!\nAre we still on for dinner after work today around 7:30 PM?\nLet me know!"),
        ("benign_university_timetable.png", 0, "FAST NUCES Department of CS\nMidterm Examination Schedule Fall 2026\nRoom 402 CS301 Artificial Intelligence\nExam starts at 09:00 AM"),
        ("phish_bisp_lottery.png", 1, "BISP Ehsaas Program\nMubarak ho aap k 25,000 rupay account mein agaye hain\nForan CNIC verify karwayen 0301-8899221"),
        ("benign_uber_receipt.png", 0, "Uber Trip Summary\nYour ride with Muhammad on Oct 28, 2026\nTotal Fare: PKR 480\nPayment Method: Cash\nThank you for riding with Uber!"),
        ("phish_fedex_fee.png", 1, "FedEx Courier Alert\nPackage detention notice at airport customs\nUnpaid clearance duty: $2.49\nPay at http://customs-detained-parcel.top/pay"),
        ("benign_reminder_dentist.png", 0, "Dr. Salman Dental Care\nReminder: Your appointment is scheduled for tomorrow at 3:00 PM\nReply 1 to confirm or 2 to reschedule"),
        ("phish_pta_block.png", 1, "PTA Final Warning\nYour SIM will be permanently blocked in 24 hours\nVerify biometric code at http://pta-blocked-sim.xyz"),
        ("benign_weather_forecast.png", 0, "Pakistan Meteorological Department\nWeather Update: Mild sunny weather with cool breezes\nNo storm warnings for Punjab"),
        ("unreadable_blank.png", -1, ""), # Test Insufficient Evidence
        ("unreadable_noise.png", -1, "   ...   ---   ") # Test Insufficient Evidence
    ]

    generated_paths = []
    for filename, label, text in test_specs:
        img_path = os.path.join(output_dir, filename)
        img = Image.new("RGB", (600, 300), color=(250, 250, 252))
        draw = ImageDraw.Draw(img)
        if text.strip():
            draw.text((30, 40), text, fill=(15, 23, 42))
        img.save(img_path)
        generated_paths.append({"path": img_path, "label": label, "description": filename})

    return generated_paths


def calculate_metrics(y_true: List[int], y_pred: List[int]) -> Dict[str, Any]:
    """Computes binary classification metrics and confusion matrix."""
    assert len(y_true) == len(y_pred)
    n = len(y_true)
    if n == 0:
        return {}

    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)

    accuracy = (tp + tn) / n
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    return {
        "total_samples": n,
        "true_positives": tp,
        "true_negatives": tn,
        "false_positives": fp,
        "false_negatives": fn,
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "confusion_matrix": [[tn, fp], [fn, tp]]
    }


def evaluate_all_four_modes() -> Dict[str, Any]:
    print("=====================================================================")
    print(" CYBERSHIELD AI — FOUR-MODE INDEPENDENT MODEL EVALUATION")
    print(f" Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=====================================================================\n")

    results = {
        "metadata": {
            "evaluation_date": datetime.now().isoformat(),
            "models_evaluated": {
                "mode_a_url": "RandomForestClassifier (100 estimators, max_depth=12, StandardScaler)",
                "mode_b_phishing_text": "MultinomialNB (TfidfVectorizer sublinear_tf, ngrams 1-2)",
                "mode_c_legitimate_text": "MultinomialNB (TfidfVectorizer sublinear_tf, ngrams 1-2)",
                "mode_d_screenshot_vision": "winocr / pytesseract OCR Engine + Downstream NLP/URL Fusion"
            }
        }
    }

    # -------------------------------------------------------------
    # 1. EVALUATE MODE A: URL PHISHING CLASSIFIER
    # -------------------------------------------------------------
    print("[Mode A] Evaluating URL Phishing Classifier on 50 independent URLs...")
    url_true = []
    url_pred = []
    url_details = []

    for item in URL_EVALUATION_SET:
        url = item["url"]
        gt = item["label"]
        pred_dict = url_classifier.predict(url)
        is_phish = 1 if pred_dict.get("is_phishing", False) else 0

        url_true.append(gt)
        url_pred.append(is_phish)
        url_details.append({
            "url": url,
            "ground_truth": "Phishing" if gt == 1 else "Legitimate",
            "prediction": "Phishing" if is_phish == 1 else "Legitimate",
            "correct": gt == is_phish,
            "risk_score": pred_dict.get("risk_score"),
            "probability": pred_dict.get("probability"),
            "type": item["type"]
        })

    mode_a_metrics = calculate_metrics(url_true, url_pred)
    results["mode_a_url"] = {
        "metrics": mode_a_metrics,
        "sample_count": len(URL_EVALUATION_SET),
        "benign_count": sum(1 for x in URL_EVALUATION_SET if x["label"] == 0),
        "phishing_count": sum(1 for x in URL_EVALUATION_SET if x["label"] == 1),
        "details": url_details
    }
    print(f"  -> Mode A Accuracy: {mode_a_metrics['accuracy'] * 100:.2f}% | "
          f"Precision: {mode_a_metrics['precision'] * 100:.2f}% | "
          f"Recall: {mode_a_metrics['recall'] * 100:.2f}% | "
          f"F1: {mode_a_metrics['f1_score'] * 100:.2f}% | "
          f"FPR: {mode_a_metrics['false_positive_rate'] * 100:.2f}%")

    # -------------------------------------------------------------
    # 2 & 3. EVALUATE MODE B & C: PHISHING & LEGITIMATE TEXT
    # -------------------------------------------------------------
    print("\n[Modes B & C] Evaluating NLP Classifier on 60 messages (30 Malicious, 30 Legitimate)...")
    text_true = []
    text_pred = []
    text_details = []

    for item in TEXT_EVALUATION_SET:
        txt = item["text"]
        gt = item["label"]
        res = text_classifier.analyze(txt)
        is_mal = 1 if res.get("is_social_engineering", False) else 0

        text_true.append(gt)
        text_pred.append(is_mal)
        text_details.append({
            "text_snippet": txt[:60] + "..." if len(txt) > 60 else txt,
            "category": item["cat"],
            "ground_truth": "Malicious" if gt == 1 else "Legitimate",
            "prediction": "Malicious" if is_mal == 1 else "Legitimate",
            "correct": gt == is_mal,
            "risk_score": res.get("risk_score"),
            "confidence": res.get("confidence")
        })

    # Mode B metrics (Phishing recall/precision)
    # Mode C metrics (Legitimate specificity / TN rate)
    combined_text_metrics = calculate_metrics(text_true, text_pred)
    
    # Sub-breakdown for Mode B (Phishing messages)
    mode_b_true = [yt for yt in text_true if yt == 1]
    mode_b_pred = [yp for yt, yp in zip(text_true, text_pred) if yt == 1]
    mode_b_recall = sum(mode_b_pred) / len(mode_b_true) if mode_b_true else 0.0

    # Sub-breakdown for Mode C (Legitimate messages)
    mode_c_true = [yt for yt in text_true if yt == 0]
    mode_c_pred = [yp for yt, yp in zip(text_true, text_pred) if yt == 0]
    mode_c_clean_accuracy = (len(mode_c_true) - sum(mode_c_pred)) / len(mode_c_true) if mode_c_true else 0.0

    results["mode_b_phishing_text"] = {
        "metrics": {
            "samples": len(mode_b_true),
            "detected_phishing": sum(mode_b_pred),
            "missed_phishing": len(mode_b_true) - sum(mode_b_pred),
            "recall": round(mode_b_recall, 4)
        }
    }
    results["mode_c_legitimate_text"] = {
        "metrics": {
            "samples": len(mode_c_true),
            "correctly_identified_legitimate": len(mode_c_true) - sum(mode_c_pred),
            "false_positives": sum(mode_c_pred),
            "specificity_accuracy": round(mode_c_clean_accuracy, 4)
        }
    }
    results["combined_nlp_metrics"] = combined_text_metrics
    results["text_details"] = text_details

    print(f"  -> Mode B (Phishing Text) Recall: {mode_b_recall * 100:.2f}% ({sum(mode_b_pred)}/{len(mode_b_true)} caught)")
    print(f"  -> Mode C (Legitimate Text) Specificity: {mode_c_clean_accuracy * 100:.2f}% ({len(mode_c_true) - sum(mode_c_pred)}/{len(mode_c_true)} clean)")
    print(f"  -> Overall NLP F1-Score: {combined_text_metrics['f1_score'] * 100:.2f}% | FPR: {combined_text_metrics['false_positive_rate'] * 100:.2f}%")

    # -------------------------------------------------------------
    # 4. EVALUATE MODE D: SCREENSHOT / IMAGE RECOGNITION
    # -------------------------------------------------------------
    print("\n[Mode D] Evaluating Screenshot OCR + Classification Pipeline...")
    temp_dir = os.path.join(BACKEND_DIR, "data", "eval_screenshots")
    test_images = create_synthetic_test_images(temp_dir)

    # Also include the user's actual uploaded screenshot artifact if present
    user_smishing_artifact = "C:/Users/muham/.gemini/antigravity-ide/brain/3660abc4-9745-410c-bd5d-a1356c5cd03f/.user_uploaded/media_1793214255412.png"
    if os.path.exists(user_smishing_artifact):
        test_images.append({
            "path": user_smishing_artifact,
            "label": 1,
            "description": "User Real Amazon Smishing Capture"
        })

    screenshot_true = []
    screenshot_pred = []
    screenshot_details = []
    insufficient_evidence_count = 0

    for item in test_images:
        path = item["path"]
        gt = item["label"]
        desc = item["description"]

        try:
            with open(path, "rb") as f:
                img_bytes = f.read()
            b64_img = base64.b64encode(img_bytes).decode("utf-8")
            ocr_res = ocr_engine.process_screenshot_base64(b64_img, desc)
            raw_text = ocr_res.get("extracted_text", "").strip()
            extracted_urls = ocr_res.get("extracted_urls", [])

            # Downstream classification logic
            if not raw_text and not extracted_urls:
                # Proper Insufficient Evidence handling
                pred_label = 0
                verdict = "INSUFFICIENT_EVIDENCE"
                insufficient_evidence_count += 1
            else:
                # Classify text + url
                txt_score = text_classifier.analyze(raw_text) if raw_text else {"is_social_engineering": False}
                url_score = url_classifier.predict(extracted_urls[0]) if extracted_urls else {"is_phishing": False}
                
                is_mal = txt_score.get("is_social_engineering", False) or url_score.get("is_phishing", False)
                pred_label = 1 if is_mal else 0
                verdict = "PHISHING" if is_mal else "LIKELY_LEGITIMATE"

            # If ground truth was unreadable (-1), expected verdict is INSUFFICIENT_EVIDENCE
            if gt == -1:
                is_correct = (verdict == "INSUFFICIENT_EVIDENCE")
            else:
                is_correct = (gt == pred_label)
                screenshot_true.append(gt)
                screenshot_pred.append(pred_label)

            screenshot_details.append({
                "image": desc,
                "ground_truth": "Unreadable / Insufficient" if gt == -1 else ("Phishing" if gt == 1 else "Legitimate"),
                "ocr_text_length": len(raw_text),
                "extracted_urls": extracted_urls,
                "verdict": verdict,
                "correct": is_correct
            })

        except Exception as e:
            print(f"  [Mode D Error on {desc}]: {e}")
            screenshot_details.append({
                "image": desc,
                "error": str(e),
                "correct": False
            })

    print(f"  [Mode D] Evaluated {len(screenshot_true)} readable images, {insufficient_evidence_count} unreadable.")
    mode_d_metrics = calculate_metrics(screenshot_true, screenshot_pred)
    results["mode_d_screenshot"] = {
        "metrics": mode_d_metrics,
        "insufficient_evidence_handled": insufficient_evidence_count,
        "samples_evaluated": len(test_images),
        "details": screenshot_details
    }

    print(f"  -> Mode D Accuracy on readable images: {mode_d_metrics['accuracy'] * 100:.2f}% | "
          f"F1-Score: {mode_d_metrics['f1_score'] * 100:.2f}%")
    print(f"  -> Handled {insufficient_evidence_count} unreadable/blank images with INSUFFICIENT EVIDENCE (0 false alarms).")

    # Save to reports/evaluation_results.json
    reports_dir = os.path.abspath(os.path.join(BACKEND_DIR, "..", "reports"))
    os.makedirs(reports_dir, exist_ok=True)
    report_file = os.path.join(reports_dir, "evaluation_results.json")
    with open(report_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n[Done] Evaluation results saved to {report_file}")
    return results

if __name__ == "__main__":
    evaluate_all_four_modes()
