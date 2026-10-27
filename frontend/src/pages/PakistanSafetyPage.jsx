import React from 'react';
import { 
  ShieldAlert, ExternalLink, PhoneCall, AlertTriangle, 
  Building, UserCheck, ShieldCheck, FileWarning, CheckCircle2 
} from 'lucide-react';

const LOCAL_SCENARIOS = [
  {
    title: 'Bank & Mobile Wallet OTP Impersonation',
    institution: 'HBL, Meezan, Easypaisa, JazzCash',
    description: 'Callers or SMS allege that your bank debit card or mobile wallet is suspended due to inactivity or KYC failure. They create panic and demand the 4-digit PIN or 6-digit SMS OTP code.',
    defense: 'Never disclose any OTP or PIN over phone calls or SMS. Banks already have your customer profile and will NEVER request your one-time password.',
    helpline: 'Call bank helpline printed directly on back of your physical ATM card.'
  },
  {
    title: 'Fake BISP & Ehsaas Cash Grant Fraud',
    institution: 'Benazir Income Support Program (BISP)',
    description: 'WhatsApp messages or SMS claiming cash grants of Rs. 25,000 have been approved. Victims are instructed to dial an unverified mobile number and transfer advance delivery or registration charges via mobile wallet.',
    defense: 'BISP only communicates via official 8171 SMS code. BISP never demands advance processing fees, delivery charges, or JazzCash transfers.',
    helpline: 'Verify through official 8171 SMS portal only.'
  },
  {
    title: 'Counterfeit Courier & Pakistan Post Customs Duty',
    institution: 'Pakistan Post, TCS, Leopards',
    description: 'SMS notification stating an international parcel has been detained at customs depot due to incomplete address. A link directs victims to a fake tracking website asking for Rs. 100-800 customs fee via debit card.',
    defense: 'Inspect the domain carefully. Official Pakistan Post operates on .gov.pk. Couriers do not solicit credit card details through unsolicited SMS links.',
    helpline: 'Track parcels directly on official websites without clicking SMS links.'
  },
  {
    title: 'Legal Intimidation & Fake FIA / Police Notices',
    institution: 'Federal Investigation Agency (FIA), Police',
    description: 'Calls or messages alleging an arrest warrant or cybercrime FIR has been registered against your CNIC. Scammers demand immediate settlement fines to avoid a police raid.',
    defense: 'Law enforcement agencies never issue arrest warrants or demand fine payments via WhatsApp or mobile wallet transfers. This is extortion.',
    helpline: 'Report immediately to the NCCIA helpline at 9999.'
  }
];

export default function PakistanSafetyPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-900/40 shadow-xl space-y-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-emerald-400 tracking-wider uppercase">
            National Cyber Safety Center (Pakistan)
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Verified Pakistani Incident Response & Prevention Hub
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Guidance and official reporting channels for Pakistani citizens and organizations.
          Understand jurisdictional differences between individual cybercrime reporting and national CERT incident escalation.
        </p>
      </div>

      {/* Official Reporting Portals (NCCIA vs PKCERT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NCCIA Card */}
        <div className="rounded-xl border border-cyan-800/60 bg-gradient-to-b from-slate-900 to-cyan-950/20 p-6 space-y-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                FOR CITIZENS & INDIVIDUALS
              </span>
              <h3 className="text-base font-bold text-white mt-2">
                National Cyber Crime Investigation Agency (NCCIA)
              </h3>
            </div>
            <UserCheck className="w-6 h-6 text-cyan-400" />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The dedicated statutory agency responsible for investigating cybercrime complaints lodged by individuals, including:
          </p>

          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Financial smishing and unauthorized bank withdrawals</li>
            <li>Stolen identity, CNIC misuse, and SIM card cloning</li>
            <li>Online harassment, blackmail, and unauthorized account access</li>
            <li>Fake investment, prize lottery, and employment scams</li>
          </ul>

          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
            <a
              href="https://complaint.nccia.gov.pk/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Lodge Citizen Complaint</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://www.nccia.gov.pk/"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center space-x-1 transition-colors"
            >
              <span>Official Site</span>
            </a>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <PhoneCall className="w-3 h-3 text-cyan-400" />
            <span>Toll Free Helpline: <strong className="text-cyan-300">9999</strong> (24/7 Citizen Support)</span>
          </div>
        </div>

        {/* PKCERT Card */}
        <div className="rounded-xl border border-amber-800/60 bg-gradient-to-b from-slate-900 to-amber-950/20 p-6 space-y-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                FOR ORGANIZATIONS & ENTERPRISES
              </span>
              <h3 className="text-base font-bold text-white mt-2">
                Pakistan Computer Emergency Response Team (PKCERT)
              </h3>
            </div>
            <Building className="w-6 h-6 text-amber-400" />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The national Computer Emergency Response Team operating under the Ministry of IT & Telecommunication, handling:
          </p>

          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Targeted institutional phishing campaigns & brand spoofing</li>
            <li>Ransomware, malware outbreaks, and critical infrastructure attacks</li>
            <li>Publishing national cybersecurity advisories and zero-day alerts</li>
            <li>Sectoral coordination across telecom, banking, and public utilities</li>
          </ul>

          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
            <a
              href="https://pkcert.gov.pk/report-incident/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Report Organizational Incident</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://pkcert.gov.pk/advisories"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center space-x-1 transition-colors"
            >
              <span>View Advisories</span>
            </a>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>Incident Email: <strong className="text-amber-300">incident@pkcert.gov.pk</strong></span>
          </div>
        </div>
      </div>

      {/* Common Pakistani Scam Patterns & Countermeasures */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <FileWarning className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            High-Prevalence Threat Scenarios in Pakistan
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LOCAL_SCENARIOS.map((sc, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-100 text-sm">{sc.title}</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                  {sc.institution}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {sc.description}
              </p>
              <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-xs text-emerald-300">
                <span className="font-semibold block mb-0.5">Verification Rule:</span>
                {sc.defense}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Regulatory Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs space-y-1.5">
        <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Notice Regarding Automated Reporting & Affiliation:</span>
        </div>
        <p className="leading-relaxed">
          CyberShield AI is an academic research and forensic decision-support system developed for the Artificial Intelligence
          and Expert Systems (AIES) project. It is <strong>not officially affiliated</strong> with PKCERT, NCCIA, or any government body.
          To protect user privacy, CyberShield AI never submits complaints to authorities automatically. If you have been victimized by cyber fraud,
          please use the verified official portals above to register your formal complaint.
        </p>
      </div>
    </div>
  );
}
