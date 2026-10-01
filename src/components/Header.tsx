import React from 'react';
import {
  ShieldAlert,
  Video,
  Grid3X3,
  Bell,
  Sparkles,
  FileText,
  BarChart3,
  Sliders,
  Volume2,
  VolumeX,
  Code2,
  PlusCircle,
  Clock,
  Radio,
  UserCheck
} from 'lucide-react';
import { ExamSession } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  exams: ExamSession[];
  activeExam: ExamSession | null;
  setActiveExam: (exam: ExamSession) => void;
  unreviewedAlertsCount: number;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  currentRole: 'invigilator' | 'admin';
  setCurrentRole: (role: 'invigilator' | 'admin') => void;
  onOpenCreateExam: () => void;
  systemLatencyMs: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  exams,
  activeExam,
  setActiveExam,
  unreviewedAlertsCount,
  audioEnabled,
  setAudioEnabled,
  currentRole,
  setCurrentRole,
  onOpenCreateExam,
  systemLatencyMs,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
            <ShieldAlert className="h-5 w-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base text-white">SentinelExam AI</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.4 Vision Core
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-time Exam Hall Behavioral Analytics &amp; Integrity Suite
            </p>
          </div>
        </div>

        {/* Exam Session Selector & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <select
              value={activeExam?.id || ''}
              onChange={(e) => {
                const found = exams.find((x) => x.id === e.target.value);
                if (found) setActiveExam(found);
              }}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200">
                  {ex.courseCode}: {ex.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenCreateExam}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-700 transition"
            title="Create new examination session"
          >
            <PlusCircle className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">New Exam</span>
          </button>

          {/* Telemetry Indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] text-slate-400">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>Pipeline: <strong className="text-emerald-400 font-mono">{systemLatencyMs}ms</strong></span>
            <span className="text-slate-600">|</span>
            <span>24.8 FPS</span>
          </div>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
              audioEnabled
                ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={audioEnabled ? 'Alert chime enabled' : 'Alert chime muted'}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Role Pill */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setCurrentRole('invigilator')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                currentRole === 'invigilator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Invigilator
            </button>
            <button
              onClick={() => setCurrentRole('admin')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                currentRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="border-t border-slate-800/80 bg-slate-950/90 backdrop-blur px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1">
          <button
            onClick={() => setCurrentTab('live')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
              currentTab === 'live'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-indigo-400" />
            <span>Surveillance Cockpit</span>
          </button>

          <button
            onClick={() => setCurrentTab('mapper')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
              currentTab === 'mapper'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Seat Mapper Studio</span>
          </button>

          <button
            onClick={() => setCurrentTab('alerts')}
            className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
              currentTab === 'alerts'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bell className="h-3.5 w-3.5 text-rose-400" />
            <span>Live Alerts &amp; Evidence</span>
            {unreviewedAlertsCount > 0 && (
              <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {unreviewedAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('copilot')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
              currentTab === 'copilot'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Forensic Copilot</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-semibold border border-amber-500/30">
              Search Grounded
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
              currentTab === 'reports'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            <span>Exam Reports &amp; Audit</span>
          </button>

          <button
            onClick={() => setCurrentTab('evaluation')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
              currentTab === 'evaluation'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
            <span>Benchmark &amp; Accuracy</span>
          </button>

          <button
            onClick={() => setCurrentTab('code')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
              currentTab === 'code'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-sky-400" />
            <span>Python Pipeline &amp; Docker</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-slate-400" />
            <span>Rule Thresholds</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
