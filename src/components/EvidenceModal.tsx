import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  Clock,
  User,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  FileSpreadsheet,
  Eye,
  UserX,
  Lock,
  FileText
} from 'lucide-react';
import { AlertIncident } from '../types';

interface EvidenceModalProps {
  alert: AlertIncident | null;
  onClose: () => void;
  onReview: (alertId: string, status: 'confirmed' | 'false_alarm' | 'needs_follow_up', notes?: string) => void;
  onSendToCopilot: (alert: AlertIncident) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  alert,
  onClose,
  onReview,
  onSendToCopilot,
}) => {
  if (!alert) return null;

  const [notes, setNotes] = useState<string>(alert.invigilatorNotes || '');
  const [isPlayingClip, setIsPlayingClip] = useState<boolean>(true);
  const [scrubberSec, setScrubberSec] = useState<number>(5.2);

  const getBehaviorIcon = (type: string) => {
    switch (type) {
      case 'phone_detected':
        return <Smartphone className="h-5 w-5 text-rose-400" />;
      case 'chit_material':
      case 'object_passing':
        return <FileSpreadsheet className="h-5 w-5 text-amber-400" />;
      case 'looking_neighbor':
        return <Eye className="h-5 w-5 text-sky-400" />;
      case 'leaving_seat':
        return <UserX className="h-5 w-5 text-purple-400" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              {getBehaviorIcon(alert.behaviorType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  Incident Evidence #{alert.id}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {alert.timestamp}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">{alert.behaviorTitle}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 grid md:grid-cols-2 gap-5 overflow-y-auto">
          {/* Left Column: Visual Video Replay & Keyframe Snapshot */}
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center shadow-inner">
              {/* Synthetic Visual Evidence Frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center">
                {/* Visual Candidate Silhouette with Infraction Box */}
                <div className="relative w-48 h-48 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center">
                  {/* Candidate avatar */}
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-slate-400 font-bold">
                    {alert.seatLabel}
                  </div>
                  <div className="w-24 h-28 bg-slate-800/80 rounded-t-2xl mt-1 border-t-2 border-slate-600"></div>

                  {/* Flagged Item Highlight Box */}
                  {alert.behaviorType === 'phone_detected' && (
                    <div className="absolute bottom-4 right-8 w-12 h-16 border-2 border-rose-500 bg-rose-500/20 rounded flex items-center justify-center">
                      <span className="text-[9px] font-bold text-rose-400 font-mono">PHONE</span>
                    </div>
                  )}

                  {alert.behaviorType === 'object_passing' && (
                    <div className="absolute top-1/2 -right-6 w-16 h-8 border-2 border-amber-500 bg-amber-500/20 rounded flex items-center justify-center">
                      <span className="text-[8px] font-bold text-amber-300 font-mono">CHIT PASS</span>
                    </div>
                  )}

                  {alert.behaviorType === 'looking_neighbor' && (
                    <div className="absolute top-6 -right-8 flex items-center gap-1 text-sky-400 text-[10px] font-bold">
                      <span>Yaw +42° ➔</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Watermark timestamp & evidence hash */}
              <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-800/80 rounded px-2 py-0.5 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-emerald-400" />
                <span>SHA-256: 7f8a9e... Verified</span>
              </div>

              <div className="absolute top-2 right-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded px-2 py-0.5 text-[10px] font-bold font-mono">
                AI CONF: {(alert.confidence * 100).toFixed(1)}%
              </div>

              <div className="absolute bottom-2 left-2 bg-slate-950/80 rounded px-2 py-0.5 text-[10px] text-slate-400">
                10s Event Clip Buffer (-5s / +5s)
              </div>
            </div>

            {/* Video Clip Timeline Scrubber Simulation */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingClip(!isPlayingClip)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                  >
                    {isPlayingClip ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <span>Replaying Clip (-00:05.0 to +00:05.0)</span>
                </div>
                <span className="font-mono text-indigo-400">{scrubberSec.toFixed(1)}s / 10.0s</span>
              </div>

              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={scrubberSec}
                onChange={(e) => setScrubberSec(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
            </div>

            {/* AI Copilot Direct Analysis Trigger */}
            <button
              onClick={() => onSendToCopilot(alert)}
              className="w-full bg-gradient-to-r from-indigo-950 to-purple-950 hover:from-indigo-900 hover:to-purple-900 border border-indigo-700/60 text-indigo-200 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Analyze Forensic Evidence with Gemini AI Copilot</span>
            </button>
          </div>

          {/* Right Column: Candidate Info, Telemetry & Invigilator Review */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Candidate Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Target Candidate &amp; Seating Details
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                      {alert.seatLabel.replace('Seat ', '')}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{alert.studentName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">Roll: {alert.rollNo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Seat Zone</span>
                    <span className="font-mono text-indigo-400 font-bold text-xs">{alert.seatLabel}</span>
                  </div>
                </div>
              </div>

              {/* Behavioral Metrics Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Recorded Sensor Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">AI Confidence</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {(alert.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Suspicion Index Delta</span>
                    <span className="font-mono text-rose-400 font-bold">+{alert.suspicionDelta}%</span>
                  </div>
                  {alert.metrics.durationSec && (
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block">Infraction Duration</span>
                      <span className="font-mono text-slate-200">{alert.metrics.durationSec}s</span>
                    </div>
                  )}
                  {alert.metrics.neighborSeat && (
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block">Aisle Proximity</span>
                      <span className="font-mono text-amber-300">{alert.metrics.neighborSeat}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invigilator Notes Input */}
              <div>
                <label className="block text-slate-400 font-medium text-xs mb-1.5">
                  Invigilator Physical Observation Note:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record physical verification details, items confiscated, or student explanations..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Human-in-the-Loop Verdict Action Buttons */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Human-in-the-Loop Review Verdict (Mandatory):
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onReview(alert.id, 'confirmed', notes)}
                  className="bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm Violation</span>
                </button>

                <button
                  onClick={() => onReview(alert.id, 'false_alarm', notes)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer border border-slate-700"
                >
                  <XCircle className="h-4 w-4 text-emerald-400" />
                  <span>False Alarm</span>
                </button>

                <button
                  onClick={() => onReview(alert.id, 'needs_follow_up', notes)}
                  className="bg-amber-600 hover:bg-amber-500 text-white p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Needs Follow-up</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
