import React, { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS = {
  en: {
    app_title: 'CyberShield AI',
    tagline: 'Investigate smarter. Detect earlier. Stay safer.',
    nav_investigate: 'Investigate',
    nav_cases: 'Cases',
    nav_attack_dna: 'Attack DNA Graph',
    nav_dossiers: 'Scam Dossiers',
    nav_agent: 'Agent Console',
    nav_rag: 'Knowledge Base',
    nav_trends: 'Threat Trends',
    nav_models: 'Models & Data',
    nav_awareness: 'Awareness Academy',
    nav_batch: 'Batch & Compare',
    nav_insights: 'Insights',
    nav_safety: 'Safety Center',
    nav_privacy: 'Digital Privacy',
    nav_settings: 'Settings',
    active_case: 'Active Case',
    engine_active: 'Engine Online',
    new_case: 'New Case',
    analyze_button: 'Analyze',
    analyzing: 'Investigating with 8-Agent Pipeline...',
    try_example: 'Try this example',
    simple_view: 'Simple',
    technical_view: 'Technical',
    view_mode: 'View Detail:',
    risk_critical: 'CRITICAL THREAT',
    risk_high: 'HIGH RISK',
    risk_medium: 'MEDIUM SUSPICION',
    risk_low: 'LOW RISK / CLEAN',
    risk_insufficient: 'INSUFFICIENT EVIDENCE',
    risk_verdict_title: 'Forensic Risk Verdict',
    model_confidence: 'Model Confidence',
    evidence_strength: 'Evidence Strength',
    recommended_actions: 'What should I do now?',
    copy_report: 'Copy Report',
    print_report: 'Print / Save PDF',
    share_safe_button: 'Share-Safe Summary',
    sec_why: 'Why we think this (Evidence Ledger)',
    sec_highlighted: 'Highlighted Message Text (NLP Spans)',
    sec_url: 'URL Security Analysis',
    sec_screenshot: 'Screenshot Vision & OCR',
    sec_rules: 'Expert Rules Triggered',
    sec_timeline: '8-Agent Investigation Timeline',
    sec_technical: 'Technical Forensic Report',
    no_active_case: 'No active investigation. Submit evidence above or choose an example.',
    insufficient_evidence_notice: 'Insufficient evidence to confirm malicious intent. Exercise standard cyber hygiene.',
    scam_of_the_day: 'Scam of the Day',
    spot_the_scam: 'Spot the Scam Mini-Quiz',
    report_to_authorities: 'Report to Authorities Helper',
    purge_all_cases: 'Purge All Cases',
    purge_confirm: 'Are you sure you want to permanently delete all cases from your local vault? This action cannot be undone.',
    model_transparency: 'Model Transparency & Real-World Evaluation',
    dataset_leakage_note: 'Important Note: Benchmark evaluation (e.g. PhiUSIIL) reports 100% accuracy and 1.000 ROC-AUC due to dataset separability. Real-world performance on live evasion campaigns is lower. CyberShield uses independent expert rules to mitigate model blind spots.',
  },
  ur: {
    app_title: 'سائبر شیلڈ اے آئی',
    tagline: 'ہوشمندی سے تفتیش کریں۔ بروقت خطرہ پہچانیں۔ محفوظ رہیں۔',
    nav_investigate: 'تفتیش کریں',
    nav_cases: 'کیسز',
    nav_attack_dna: 'اٹیک ڈی این اے گراف',
    nav_dossiers: 'اسکیم ڈوزیئرز و ٹائم لائن',
    nav_agent: 'ایجنٹ کنسول',
    nav_rag: 'قانونی رہنمائی (RAG)',
    nav_trends: 'خطرات کے رجحانات',
    nav_models: 'ماڈلز اور ڈیٹا',
    nav_awareness: 'آگاہی اکیڈمی',
    nav_batch: 'بیک وقت تفتیش',
    nav_insights: 'تجزیات و ماڈلز',
    nav_safety: 'حفاظتی مرکز',
    nav_privacy: 'ڈیجیٹل پرائیویسی',
    nav_settings: 'سیٹنگز',
    active_case: 'موجودہ کیس',
    engine_active: 'سسٹم آن لائن',
    new_case: 'نیا کیس',
    analyze_button: 'تجزیہ کریں',
    analyzing: '8 ایجنٹ پائپ لائن کے ساتھ تفتیش جاری ہے...',
    try_example: 'یہ مثال آزمائیں',
    simple_view: 'سادہ',
    technical_view: 'تکنیکی',
    view_mode: 'تفصیل کا طریقہ:',
    risk_critical: 'شدید ترین خطرہ',
    risk_high: 'زیادہ خطرہ',
    risk_medium: 'درمیانہ شبہ',
    risk_low: 'محفوظ / کم خطرہ',
    risk_insufficient: 'ناکافی شواہد',
    risk_verdict_title: 'حتمی خطرے کا فیصلہ',
    model_confidence: 'ماڈل کا یقین',
    evidence_strength: 'شواہد کی مضبوطی',
    recommended_actions: 'اب مجھے کیا کرنا چاہیے؟',
    copy_report: 'رپورٹ کاپی کریں',
    print_report: 'پرنٹ / پی ڈی ایف محفوظ کریں',
    share_safe_button: 'محفوظ شیئر خلاصہ',
    sec_why: 'ہم ایسا کیوں سمجھتے ہیں (شواہد کا کھاتہ)',
    sec_highlighted: 'پیغام کے نمایاں حصے (الفاظ کا تجزیہ)',
    sec_url: 'ویب سائٹ لنک کا تجزیہ',
    sec_screenshot: 'اسکرین شاٹ اور تصویر کا تجزیہ',
    sec_rules: 'لاگو ہونے والے تصدیقی اصول',
    sec_timeline: '8 ایجنٹس کی تفتیشی ٹائم لائن',
    sec_technical: 'مکمل تکنیکی رپورٹ',
    no_active_case: 'کوئی کیس موجود نہیں۔ اوپر دی گئی جگہ میں لنک یا پیغام درج کریں یا نیچے سے مثال منتخب کریں۔',
    insufficient_evidence_notice: 'بدنیتی کی تصدیق کے لیے شواہد ناکافی ہیں۔ براہ کرم معمول کی احتیاط برتیں۔',
    scam_of_the_day: 'آج کا فراڈ (اسکیم آف دی ڈے)',
    spot_the_scam: 'فراڈ پہچانیں کوئز',
    report_to_authorities: 'سرکاری اداروں کو رپورٹ کا طریقہ',
    purge_all_cases: 'تمام کیسز صاف کریں',
    purge_confirm: 'کیا آپ واقعی اپنے مقامی والٹ سے تمام کیسز ہمیشہ کے لیے ختم کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔',
    model_transparency: 'ماڈلز کی شفافیت اور زمینی حقائق',
    dataset_leakage_note: 'اہم وضاحت: امتحانی ڈیٹا سیٹس پر ماڈل کے 100 فیصد نتائج حقیقی دنیا کے مقابلے میں زیادہ ہوتے ہیں۔ حقیقی دنیا میں نئے فراڈ سے نمٹنے کے لیے سائبر شیلڈ ماہرانہ اصولوں کا استعمال کرتا ہے۔',
  },
  ro: {
    app_title: 'CyberShield AI',
    tagline: 'Hoshmandi se investigation karein. Barwaqt pehchanein. Mehfooz rahein.',
    nav_investigate: 'Investigate',
    nav_cases: 'Cases',
    nav_agent: 'Agent Console',
    nav_rag: 'Knowledge Base',
    nav_trends: 'Threat Trends',
    nav_models: 'Models & Data',
    nav_awareness: 'Awareness Academy',
    nav_batch: 'Batch & Compare',
    nav_insights: 'Insights & Models',
    nav_safety: 'Safety Center',
    nav_privacy: 'Digital Privacy',
    nav_settings: 'Settings',
    active_case: 'Active Case',
    engine_active: 'Engine Active',
    new_case: 'Naya Case',
    analyze_button: 'Analyze Karein',
    analyzing: '8-Agent Pipeline investigation jaari hai...',
    try_example: 'Yeh example check karein',
    simple_view: 'Aasan',
    technical_view: 'Technical',
    view_mode: 'Detail View:',
    risk_critical: 'SHADEED KHATRA',
    risk_high: 'ZYADA KHATRA',
    risk_medium: 'DARMIYANA KHATRA',
    risk_low: 'MEHFOOZ / KAM KHATRA',
    risk_insufficient: 'NAKAFI SABOOT',
    risk_verdict_title: 'Forensic Risk Faisla',
    model_confidence: 'Model Confidence',
    evidence_strength: 'Saboot ki Mazbooti',
    recommended_actions: 'Ab mujhay kya karna chahiye?',
    copy_report: 'Report Copy Karein',
    print_report: 'Print / Save PDF',
    share_safe_button: 'Share-Safe Summary',
    sec_why: 'Hum aisa kyun samajhte hain (Evidence Ledger)',
    sec_highlighted: 'Highlighted Message Text (NLP Spans)',
    sec_url: 'URL Security Analysis',
    sec_screenshot: 'Screenshot Vision & OCR',
    sec_rules: 'Expert Rules Triggered',
    sec_timeline: '8-Agent Investigation Timeline',
    sec_technical: 'Technical Forensic Report',
    no_active_case: 'Koi case load nahi hua. Ooper link ya message likhein ya sample choose karein.',
    insufficient_evidence_notice: 'Fraud confirm karne k liye saboot nakafi hain. Mamool ki ehtiyat karein.',
    scam_of_the_day: 'Aaj Ka Scam Alert',
    spot_the_scam: 'Spot the Scam Game',
    report_to_authorities: 'Idaron Ko Report Karne Ka Tariqa',
    purge_all_cases: 'Tamam Cases Delete Karein',
    purge_confirm: 'Kya aap waqai tamam cases delete karna chahte hain? Yeh wapis nahi aasakengay.',
    model_transparency: 'Model Transparency & Real Metrics',
    dataset_leakage_note: 'Zaroori Note: Static dataset par 100% accuracy aana aam baat hai lekin real-world attacks mein accuracy kam ho sakti hai. Is liye CyberShield expert rules bhi use karta hai.',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('cybershield_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('cybershield_lang', language);
    const html = document.documentElement;
    if (language === 'ur') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ur');
      html.classList.add('font-urdu');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', language === 'ro' ? 'ur-Latn' : 'en');
      html.classList.remove('font-urdu');
    }
  }, [language]);

  const t = (key) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  const isRtl = language === 'ur';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
