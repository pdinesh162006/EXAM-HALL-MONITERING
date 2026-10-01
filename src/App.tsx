import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PrivacyBanner } from './components/PrivacyBanner';
import { CameraStream } from './components/CameraStream';
import { SeatMapperStudio } from './components/SeatMapperStudio';
import { AlertsFeed } from './components/AlertsFeed';
import { EvidenceModal } from './components/EvidenceModal';
import { AiForensicCopilot } from './components/AiForensicCopilot';
import { ReportsView } from './components/ReportsView';
import { EvaluationView } from './components/EvaluationView';
import { CodeExplorer } from './components/CodeExplorer';
import { SettingsView } from './components/SettingsView';
import { CreateExamModal } from './components/CreateExamModal';
import { ExamSession, SeatZone, AlertIncident, SystemConfig } from './types';
import { Bell, AlertTriangle, ShieldCheck, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('live');
  const [currentRole, setCurrentRole] = useState<'invigilator' | 'admin'>('invigilator');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState<boolean>(false);

  // Core Data State
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [activeExam, setActiveExam] = useState<ExamSession | null>(null);
  const [seats, setSeats] = useState<SeatZone[]>([]);
  const [alerts, setAlerts] = useState<AlertIncident[]>([]);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertIncident | null>(null);

  // Live Toast Notification
  const [liveToast, setLiveToast] = useState<AlertIncident | null>(null);

  // System Configuration
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
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
      'Notice: This examination hall is monitored by SentinelExam AI assistance. All video analytics and behavioral alerts require independent verification by certified invigilators. No automated disciplinary sanctions are enacted without human review.',
  });

  // Fetch initial data
  useEffect(() => {
    fetch('/api/exams')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setExams(data);
          setActiveExam(data[0]);
        }
      })
      .catch((err) => console.warn('Could not load exams:', err));

    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setSystemConfig((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.warn('Could not load config:', err));
  }, []);

  // Fetch seats and alerts when activeExam changes
  useEffect(() => {
    if (!activeExam) return;

    fetch(`/api/seats/${activeExam.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSeats(data);
      })
      .catch((err) => console.warn('Could not load seats:', err));

    fetch(`/api/alerts?examId=${activeExam.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAlerts(data);
      })
      .catch((err) => console.warn('Could not load alerts:', err));
  }, [activeExam]);

  // Handler for triggering new alerts (from live feed simulation or camera stream)
  const handleTriggerAlert = async (partialAlert: Partial<AlertIncident>) => {
    if (!activeExam) return;

    const payload = {
      ...partialAlert,
      examId: activeExam.id,
    };

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created: AlertIncident = await res.json();
        setAlerts((prev) => [created, ...prev]);

        // Update local seat suspicion score
        setSeats((prev) =>
          prev.map((s) => {
            if (s.id === created.seatId) {
              const newScore = Math.min(100, s.suspicionScore + created.suspicionDelta);
              return {
                ...s,
                suspicionScore: newScore,
                status: newScore >= systemConfig.suspicionScoreAlertThreshold ? 'flagged' : 'caution',
                lastBehavior: created.behaviorTitle,
              };
            }
            return s;
          })
        );

        // Show live toast notification
        setLiveToast(created);
        setTimeout(() => setLiveToast((t) => (t?.id === created.id ? null : t)), 6000);
      }
    } catch (err) {
      console.error('Failed to post alert:', err);
    }
  };

  // Human-in-the-Loop review status updater
  const handleReviewAlert = async (
    alertId: string,
    status: 'confirmed' | 'false_alarm' | 'needs_follow_up',
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: status,
          reviewedBy: currentRole === 'admin' ? 'Chief Controller' : 'Invigilator on Duty',
          invigilatorNotes: notes,
        }),
      });

      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId
              ? {
                  ...a,
                  reviewStatus: status,
                  reviewedBy: currentRole === 'admin' ? 'Chief Controller' : 'Invigilator on Duty',
                  reviewedAt: new Date().toLocaleTimeString(),
                  invigilatorNotes: notes,
                }
              : a
          )
        );

        // Adjust seat score if dismissed as false alarm
        if (status === 'false_alarm' && selectedAlertForModal) {
          setSeats((prev) =>
            prev.map((s) => {
              if (s.id === selectedAlertForModal.seatId) {
                const decayed = Math.max(5, s.suspicionScore - selectedAlertForModal.suspicionDelta);
                return {
                  ...s,
                  suspicionScore: decayed,
                  status: decayed >= systemConfig.suspicionScoreAlertThreshold ? 'flagged' : decayed > 30 ? 'caution' : 'normal',
                };
              }
              return s;
            })
          );
        }

        setSelectedAlertForModal(null);
      }
    } catch (err) {
      alert('Failed to update alert review status.');
    }
  };

  // Save updated seat map
  const handleSaveSeats = async (updatedSeats: SeatZone[]) => {
    if (!activeExam) return;
    const res = await fetch(`/api/seats/${activeExam.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSeats),
    });
    if (res.ok) {
      setSeats(updatedSeats);
    } else {
      throw new Error('Failed to update seats on server.');
    }
  };

  // Save updated system config
  const handleSaveConfig = async (updated: SystemConfig) => {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setSystemConfig(updated);
    } else {
      throw new Error('Failed to update system config.');
    }
  };

  // Create new exam
  const handleCreateExam = async (examData: Partial<ExamSession>) => {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examData),
    });
    if (res.ok) {
      const created: ExamSession = await res.json();
      setExams((prev) => [created, ...prev]);
      setActiveExam(created);
    } else {
      throw new Error('Failed to create examination session.');
    }
  };

  const unreviewedCount = alerts.filter((a) => a.reviewStatus === 'unreviewed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Institutional Privacy & Ethics Policy Banner */}
      <PrivacyBanner
        institutionName={systemConfig.institutionName}
        consentNotice={systemConfig.ethicsConsentNotice}
        retentionDays={systemConfig.evidenceRetentionDays}
      />

      {/* Main App Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        exams={exams}
        activeExam={activeExam}
        setActiveExam={setActiveExam}
        unreviewedAlertsCount={unreviewedCount}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        onOpenCreateExam={() => setIsCreateExamOpen(true)}
        systemLatencyMs={42}
      />

      {/* Live Toast Alert Notification Bar */}
      {liveToast && (
        <div className="fixed top-16 right-5 z-50 animate-bounce bg-slate-900 border-2 border-rose-500 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3.5 max-w-md">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                🚨 Incident #{liveToast.id} Raised
              </span>
              <button
                onClick={() => setLiveToast(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="font-bold text-xs text-white truncate">{liveToast.behaviorTitle}</p>
            <p className="text-[11px] text-slate-300">
              {liveToast.seatLabel} ({liveToast.studentName}) • Conf: {(liveToast.confidence * 100).toFixed(0)}%
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedAlertForModal(liveToast);
              setLiveToast(null);
            }}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
          >
            Review
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {currentTab === 'live' && (
          <CameraStream
            seats={seats}
            onTriggerAlert={handleTriggerAlert}
            onSelectAlert={(alertId) => {
              const a = alerts.find((x) => x.id === alertId);
              if (a) setSelectedAlertForModal(a);
            }}
            audioEnabled={audioEnabled}
          />
        )}

        {currentTab === 'mapper' && (
          <SeatMapperStudio
            examId={activeExam?.id || 'EXAM-2026-CS401'}
            initialSeats={seats}
            onSaveSeats={handleSaveSeats}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsFeed
            alerts={alerts}
            onSelectAlert={(a) => setSelectedAlertForModal(a)}
            onQuickReview={(id, status) => handleReviewAlert(id, status)}
          />
        )}

        {currentTab === 'copilot' && (
          <AiForensicCopilot
            activeAlert={selectedAlertForModal || (alerts.length > 0 ? alerts[0] : null)}
            examName={activeExam ? `${activeExam.courseCode}: ${activeExam.name}` : 'Final Examination'}
          />
        )}

        {currentTab === 'reports' && activeExam && (
          <ReportsView
            exam={activeExam}
            alerts={alerts}
            seats={seats}
            retentionDays={systemConfig.evidenceRetentionDays}
          />
        )}

        {currentTab === 'evaluation' && <EvaluationView />}

        {currentTab === 'code' && <CodeExplorer />}

        {currentTab === 'settings' && (
          <SettingsView config={systemConfig} onSaveConfig={handleSaveConfig} />
        )}
      </main>

      {/* Evidence Inspection & Human Review Modal */}
      <EvidenceModal
        alert={selectedAlertForModal}
        onClose={() => setSelectedAlertForModal(null)}
        onReview={handleReviewAlert}
        onSendToCopilot={(alert) => {
          setSelectedAlertForModal(alert);
          setCurrentTab('copilot');
        }}
      />

      {/* Create Exam Session Modal */}
      <CreateExamModal
        isOpen={isCreateExamOpen}
        onClose={() => setIsCreateExamOpen(false)}
        onCreate={handleCreateExam}
      />
    </div>
  );
}
