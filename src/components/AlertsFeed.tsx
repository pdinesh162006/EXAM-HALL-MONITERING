import React, { useState } from 'react';
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Smartphone,
  FileSpreadsheet,
  Eye,
  UserX,
  ShieldAlert
} from 'lucide-react';
import { AlertIncident } from '../types';

interface AlertsFeedProps {
  alerts: AlertIncident[];
  onSelectAlert: (alert: AlertIncident) => void;
  onQuickReview: (alertId: string, status: 'confirmed' | 'false_alarm' | 'needs_follow_up') => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({
  alerts,
  onSelectAlert,
  onQuickReview,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus !== 'all' && a.reviewStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.studentName.toLowerCase().includes(q) ||
        a.rollNo.toLowerCase().includes(q) ||
        a.seatLabel.toLowerCase().includes(q) ||
        a.behaviorTitle.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getBehaviorIcon = (type: string) => {
    switch (type) {
      case 'phone_detected':
        return <Smartphone className="h-4 w-4 text-rose-400" />;
      case 'chit_material':
      case 'object_passing':
        return <FileSpreadsheet className="h-4 w-4 text-amber-400" />;
      case 'looking_neighbor':
        return <Eye className="h-4 w-4 text-sky-400" />;
      case 'leaving_seat':
        return <UserX className="h-4 w-4 text-purple-400" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-indigo-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Confirmed
          </span>
        );
      case 'false_alarm':
        return (
          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
            <XCircle className="h-3 w-3 text-emerald-400" /> False Alarm
          </span>
        );
      case 'needs_follow_up':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <HelpCircle className="h-3 w-3" /> Needs Follow-up
          </span>
        );
      default:
        return (
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate name, roll no, seat, or behavior..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
              filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilterStatus('unreviewed')}
            className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
              filterStatus === 'unreviewed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({alerts.filter((a) => a.reviewStatus === 'unreviewed').length})
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
              filterStatus === 'confirmed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Confirmed ({alerts.filter((a) => a.reviewStatus === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilterStatus('false_alarm')}
            className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
              filterStatus === 'false_alarm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            False Alarms ({alerts.filter((a) => a.reviewStatus === 'false_alarm').length})
          </button>
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800/80">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 hover:bg-slate-800/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Alert Left Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {getBehaviorIcon(alert.behaviorType)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        {alert.id}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-bold text-white text-xs">{alert.seatLabel}</span>
                      <span className="text-slate-300 text-xs">({alert.studentName}, {alert.rollNo})</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {alert.timestamp}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-100 text-sm">{alert.behaviorTitle}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span>
                        AI Confidence: <strong className="text-emerald-400">{(alert.confidence * 100).toFixed(1)}%</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Risk Delta: <strong className="text-rose-400">+{alert.suspicionDelta}%</strong>
                      </span>
                      {alert.reviewedBy && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300">
                            Reviewed by: <strong className="text-indigo-300">{alert.reviewedBy}</strong> ({alert.reviewedAt})
                          </span>
                        </>
                      )}
                    </div>

                    {alert.invigilatorNotes && (
                      <p className="text-[11px] text-amber-200/90 bg-amber-950/30 border border-amber-900/40 rounded px-2 py-1 mt-1">
                        <strong>Invigilator Note:</strong> {alert.invigilatorNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Review Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <div>{getStatusBadge(alert.reviewStatus)}</div>

                  <button
                    onClick={() => onSelectAlert(alert)}
                    className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Inspect Evidence</span>
                  </button>

                  {alert.reviewStatus === 'unreviewed' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onQuickReview(alert.id, 'confirmed')}
                        className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 p-1.5 rounded-lg transition"
                        title="Quick Confirm"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onQuickReview(alert.id, 'false_alarm')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition"
                        title="Quick Dismiss as False Alarm"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Bell className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p>No alert incidents match the selected filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
