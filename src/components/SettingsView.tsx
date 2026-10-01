import React, { useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  Shield,
  Clock,
  Smartphone,
  Eye,
  RotateCcw,
  Lock,
  Volume2
} from 'lucide-react';
import { SystemConfig } from '../types';

interface SettingsViewProps {
  config: SystemConfig;
  onSaveConfig: (updated: SystemConfig) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<SystemConfig>(config);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update system parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormData({
      lookAwayDurationSec: 4,
      lookAwayFrequencyThreshold: 3,
      phoneConfidenceThreshold: 0.75,
      unauthorizedMaterialThreshold: 0.7,
      handHiddenDurationSec: 8,
      seatLeavingDurationSec: 5,
      suspicionScoreAlertThreshold: 65,
      evidenceRetentionDays: 90,
      alertCooldownSec: 15,
      cameraFpsTarget: 24,
      audioChimeEnabled: true,
      institutionName: 'Apex Institute of Technology - Department of Examinations',
      ethicsConsentNotice:
        'Notice: This examination hall is monitored by SentinelExam AI assistance. All video analytics and behavioral alerts require independent verification by certified invigilators.',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-400" />
            Behavioral Heuristics &amp; Threshold Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Fine-tune computer vision sensitivity to balance detection recall against false alarm rate
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Applying Changes...' : 'Save Parameters'}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Surveillance thresholds successfully updated and synced across all camera pipelines!</span>
        </div>
      )}

      {/* Grid of Rule Groups */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Group 1: Head & Gaze Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> Head Pose &amp; Gaze Peeking Rules
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Head Yaw Sustained Duration Threshold</span>
                <span className="font-mono text-indigo-400 font-bold">{formData.lookAwayDurationSec}s</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={formData.lookAwayDurationSec}
                onChange={(e) =>
                  setFormData({ ...formData, lookAwayDurationSec: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Time head must remain turned &gt;35° before contributing to suspicion score
              </p>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Frequency Count (in 2-minute rolling window)</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {formData.lookAwayFrequencyThreshold} times
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={8}
                step={1}
                value={formData.lookAwayFrequencyThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, lookAwayFrequencyThreshold: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Looking away fewer times within 120s is treated as natural thinking or clock-glancing
              </p>
            </div>
          </div>
        </div>

        {/* Group 2: Contraband Detection Sensitivity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <Smartphone className="h-4 w-4" /> Contraband Object Detection
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Mobile Phone YOLO Confidence Filter</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(formData.phoneConfidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.95}
                step={0.05}
                value={formData.phoneConfidenceThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, phoneConfidenceThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Higher threshold prevents misidentifying pencil cases or calculators as phones
              </p>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Chit / Paper Slip Confidence Threshold</span>
                <span className="font-mono text-amber-400 font-bold">
                  {(formData.unauthorizedMaterialThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.95}
                step={0.05}
                value={formData.unauthorizedMaterialThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, unauthorizedMaterialThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
            </div>
          </div>
        </div>

        {/* Group 3: Overall Alert & Suspicion Trigger */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
            <Shield className="h-4 w-4" /> Alert Scoring &amp; Cooldown
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Alert Trigger Suspicion Threshold</span>
                <span className="font-mono text-rose-400 font-bold">
                  {formData.suspicionScoreAlertThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={90}
                step={5}
                value={formData.suspicionScoreAlertThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, suspicionScoreAlertThreshold: parseInt(e.target.value, 10) })
                }
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Seat suspicion score (0-100%) required to generate a dashboard alert
              </p>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Alert Cooldown Interval (Per Seat)</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {formData.alertCooldownSec} seconds
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={formData.alertCooldownSec}
                onChange={(e) =>
                  setFormData({ ...formData, alertCooldownSec: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Suppresses repetitive alert chime spam while invigilator is actively reviewing
              </p>
            </div>
          </div>
        </div>

        {/* Group 4: Data Retention & Compliance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Lock className="h-4 w-4" /> Evidence Retention &amp; Privacy Policy
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Automated Evidence Auto-Purge Policy</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formData.evidenceRetentionDays} Days
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={180}
                step={15}
                value={formData.evidenceRetentionDays}
                onChange={(e) =>
                  setFormData({ ...formData, evidenceRetentionDays: parseInt(e.target.value, 10) })
                }
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Complies with FERPA/GDPR 90-day post-exam disciplinary window
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Institution Exam Notice Banner:</label>
              <textarea
                rows={2}
                value={formData.ethicsConsentNotice}
                onChange={(e) =>
                  setFormData({ ...formData, ethicsConsentNotice: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
