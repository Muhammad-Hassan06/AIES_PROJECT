import React from 'react';
import { 
  Building2, Gift, Package, ShieldCheck, 
  AlertTriangle, ArrowRight, Sparkles 
} from 'lucide-react';

export const SAMPLE_SCENARIOS = [
  {
    id: 'hbl-smishing',
    title: 'HBL Bank OTP Phishing',
    category: 'Banking Smishing',
    threatBadge: 'Credential Theft',
    badgeType: 'danger',
    icon: Building2,
    description: 'Urgent SMS threatening account freeze and directing victim to a fake bank login portal to steal 6-digit OTP.',
    type: 'combined',
    url: 'http://secure-login.hbl-verify.top/auth/session?token=88291',
    text: 'URGENT: Your HBL Bank internet banking session has been suspended due to 3 failed attempts. Enter your 6-digit OTP code immediately at the link above to avoid permanent account freeze.',
    sender: '+92-301-8891029',
    indicators: ['otp_requested', 'urgency', 'password_requested']
  },
  {
    id: 'bisp-lottery',
    title: 'BISP Support Grant Scam',
    category: 'Social Support Lottery',
    threatBadge: 'Advance Fee Lure',
    badgeType: 'warning',
    icon: Gift,
    description: 'Roman Urdu message falsely claiming Rs. 25,000 cash grant, soliciting an advance JazzCash fee to release funds.',
    type: 'message',
    url: '',
    text: 'BISP Alert: Mubarik ho! Aap k 25,000 rupay BISP Benazir Income Support Program mein aagaye hain. Foran call karein 0312-9988112 aur apna CNIC verify karwa k advance delivery fee 1,500 JazzCash bhejein.',
    sender: '0312-9988112',
    indicators: ['payment_requested']
  },
  {
    id: 'pakpost-customs',
    title: 'Detained Parcel Customs Scam',
    category: 'Logistics Courier',
    threatBadge: 'Payment Extortion',
    badgeType: 'danger',
    icon: Package,
    description: 'Fake postal customs notification claiming parcel detention, requesting Rs. 850 customs duty to a rogue domain.',
    type: 'combined',
    url: 'http://pakistan-post-tracking-fee.top/delivery/parcel',
    text: 'Pakistan Post Notice: Your parcel #PK-9812 is held at Lahore Customs. Pay Rs. 850 customs duty within 12 hours to release for home delivery.',
    sender: 'PakPost-Alert',
    indicators: ['payment_requested', 'urgency']
  },
  {
    id: 'pkcert-benign',
    title: 'Official PKCERT Advisory Portal',
    category: 'Legitimate Authority',
    threatBadge: 'Safe / Clean',
    badgeType: 'success',
    icon: ShieldCheck,
    description: 'Genuine official Pakistani government CERT advisory domain and verified threat advisory channel.',
    type: 'url',
    url: 'https://pkcert.gov.pk/advisories',
    text: 'Official PKCERT Incident Reporting and Security Advisories Portal',
    sender: 'info@pkcert.gov.pk',
    indicators: []
  },
  {
    id: 'cross-modal',
    title: 'Cross-Modal Discrepancy',
    category: 'Multimodal Evasion',
    threatBadge: 'Contradictory Evidence',
    badgeType: 'warning',
    icon: AlertTriangle,
    description: 'Severe fake FIA extortion threat text paired with an innocent Wikipedia URL to test conflict resolution.',
    type: 'combined',
    url: 'https://en.wikipedia.org/wiki/Phishing',
    text: 'FIA Cyber Crime Wing: An arrest warrant has been issued in your name for illegal transaction. Transfer Rs 35,000 penalty immediately or police will raid your address.',
    sender: 'FIA-Officer',
    indicators: ['urgency', 'payment_requested']
  }
];

export default function DemoScenarioCards({ onSelectScenario }) {
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-stone-100 text-slate-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-xs text-slate-600 rtl:space-x-reverse">
        <Sparkles className="w-4 h-4 text-teal-700" />
        <span className="font-semibold text-slate-900">
          Explore Pakistani Cyber-Fraud Scenarios:
        </span>
        <span className="text-slate-400">Click to test instant analysis</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {SAMPLE_SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs hover:border-teal-400 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-teal-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${getBadgeStyle(
                      sc.badgeType
                    )}`}
                  >
                    {sc.threatBadge}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                    {sc.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {sc.category}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {sc.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {sc.type} input
                </span>
                <button
                  type="button"
                  onClick={() => onSelectScenario(sc)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span>Try this example</span>
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
