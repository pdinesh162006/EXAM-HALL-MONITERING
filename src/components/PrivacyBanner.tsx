import React, { useState } from 'react';
import { ShieldCheck, Info, X, Lock, Eye } from 'lucide-react';

interface PrivacyBannerProps {
  institutionName: string;
  consentNotice: string;
  retentionDays: number;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({
  institutionName,
  consentNotice,
  retentionDays,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 border-b border-indigo-900/60 text-slate-200 px-4 py-2.5 text-xs transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <p className="truncate text-slate-300">
            <span className="font-semibold text-white mr-1.5">Human-in-the-Loop Protocol:</span>
            {consentNotice}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
            <Lock className="h-3 w-3 text-indigo-400" />
            <span>Encrypted Evidence • Auto-Purge: {retentionDays} Days</span>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer flex items-center gap-1"
          >
            <Info className="h-3 w-3" />
            <span>Ethics Policy</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800"
            title="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-slate-300 text-[11px] grid md:grid-cols-3 gap-3">
          <div className="bg-slate-800/50 p-2 rounded border border-slate-700/40">
            <p className="font-semibold text-slate-100 flex items-center gap-1 mb-1">
              <Eye className="h-3 w-3 text-cyan-400" /> Human Review Guarantee
            </p>
            <p className="text-slate-400">
              The AI camera system only flags potential behavioral anomalies. Under institutional regulations, no disciplinary action or penalty may be imposed without direct, independent verification by the invigilator on duty.
            </p>
          </div>
          <div className="bg-slate-800/50 p-2 rounded border border-slate-700/40">
            <p className="font-semibold text-slate-100 flex items-center gap-1 mb-1">
              <Lock className="h-3 w-3 text-emerald-400" /> Privacy &amp; Data Retention
            </p>
            <p className="text-slate-400">
              Snapshots and 10-second event clips are stored with AES-256 encryption. Records are automatically destroyed after {retentionDays} days following grade finalization in accordance with FERPA and GDPR standards.
            </p>
          </div>
          <div className="bg-slate-800/50 p-2 rounded border border-slate-700/40">
            <p className="font-semibold text-slate-100 flex items-center gap-1 mb-1">
              <ShieldCheck className="h-3 w-3 text-indigo-400" /> Anti-Bias Calibrations
            </p>
            <p className="text-slate-400">
              Thresholds account for natural physiological movements (stretching, checking the hall clock, thinking posture) to maintain a low false-positive baseline (&lt; 1 false alarm per candidate/hour).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
