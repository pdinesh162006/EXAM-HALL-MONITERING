import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  BarChart3,
  Calendar,
  Clock,
  User,
  School
} from 'lucide-react';
import { ExamSession, AlertIncident, SeatZone } from '../types';

interface ReportsViewProps {
  exam: ExamSession;
  alerts: AlertIncident[];
  seats: SeatZone[];
  retentionDays: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  exam,
  alerts,
  seats,
  retentionDays,
}) => {
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const confirmedAlerts = alerts.filter((a) => a.reviewStatus === 'confirmed');
  const falseAlarms = alerts.filter((a) => a.reviewStatus === 'false_alarm');
  const followUpAlerts = alerts.filter((a) => a.reviewStatus === 'needs_follow_up');
  const unreviewed = alerts.filter((a) => a.reviewStatus === 'unreviewed');

  // Calculate Infraction Breakdown
  const infractionsByType: Record<string, number> = {};
  alerts.forEach((a) => {
    infractionsByType[a.behaviorType] = (infractionsByType[a.behaviorType] || 0) + 1;
  });

  // Calculate Overall Integrity Score (0-100)
  const integrityScore = Math.max(0, 100 - confirmedAlerts.length * 8 - followUpAlerts.length * 3);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Incident_ID',
      'Exam_ID',
      'Course_Code',
      'Timestamp',
      'Seat_ID',
      'Student_Name',
      'Roll_No',
      'Behavior_Type',
      'Behavior_Title',
      'Confidence',
      'Review_Status',
      'Reviewed_By',
      'Reviewed_At',
      'Invigilator_Notes',
    ];

    const rows = alerts.map((a) => [
      `"${a.id}"`,
      `"${a.examId}"`,
      `"${exam.courseCode}"`,
      `"${a.timestamp}"`,
      `"${a.seatLabel}"`,
      `"${a.studentName}"`,
      `"${a.rollNo}"`,
      `"${a.behaviorType}"`,
      `"${a.behaviorTitle.replace(/"/g, '""')}"`,
      `"${(a.confidence * 100).toFixed(1)}%"`,
      `"${a.reviewStatus}"`,
      `"${a.reviewedBy || 'N/A'}"`,
      `"${a.reviewedAt || 'N/A'}"`,
      `"${(a.invigilatorNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SentinelExam_Report_${exam.courseCode}_${exam.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header Summary & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {exam.courseCode}
            </span>
            <span className="text-slate-400 text-xs">{exam.date} • {exam.hallName}</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">{exam.name}</h2>
          <p className="text-xs text-slate-400">
            Superintendent: <strong className="text-slate-200">{exam.invigilator}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-indigo-400" />
            <span>Export CSV Audit</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Printer className="h-4 w-4" />
            <span>Generate Official Printable PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Hall Integrity Index
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{integrityScore}%</span>
            <span className="text-[11px] text-slate-500">Benchmark: &gt;85%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${integrityScore}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Confirmed Malpractice
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{confirmedAlerts.length}</span>
            <span className="text-[11px] text-slate-500">Flags Physical Confirmed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Requires board investigation</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            False Alarms Dismissed
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-300">{falseAlarms.length}</span>
            <span className="text-[11px] text-slate-500">
              ({alerts.length > 0 ? ((falseAlarms.length / alerts.length) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Cleared by invigilator</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Candidates Monitored
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-400">{seats.length}</span>
            <span className="text-[11px] text-slate-500">Seats Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Coverage: 100% video surveillance</p>
        </div>
      </div>

      {/* Incident Log & Risk Ranking */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Incident Audit Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Comprehensive Incident Register
            </h3>
            <span className="text-xs text-slate-400">Total Entries: {alerts.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Time</th>
                  <th className="p-2.5">Candidate / Seat</th>
                  <th className="p-2.5">Infraction Type</th>
                  <th className="p-2.5">Confidence</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 rounded-r-lg">Review Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono text-slate-400">{a.timestamp}</td>
                    <td className="p-2.5">
                      <p className="font-bold text-white">{a.studentName}</p>
                      <p className="text-slate-500 font-mono text-[10px]">{a.seatLabel} • {a.rollNo}</p>
                    </td>
                    <td className="p-2.5 font-medium text-slate-300">{a.behaviorTitle}</td>
                    <td className="p-2.5 font-mono text-emerald-400">{(a.confidence * 100).toFixed(0)}%</td>
                    <td className="p-2.5">
                      {a.reviewStatus === 'confirmed' ? (
                        <span className="text-rose-400 font-bold">Confirmed</span>
                      ) : a.reviewStatus === 'false_alarm' ? (
                        <span className="text-slate-400">False Alarm</span>
                      ) : a.reviewStatus === 'needs_follow_up' ? (
                        <span className="text-amber-400 font-bold">Follow-up</span>
                      ) : (
                        <span className="text-indigo-400">Unreviewed</span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-400 max-w-[180px] truncate">
                      {a.invigilatorNotes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Candidate Risk Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rose-400" />
              Candidate Suspicion Ranking
            </h3>
          </div>

          <div className="space-y-3">
            {[...seats]
              .sort((a, b) => b.suspicionScore - a.suspicionScore)
              .map((s) => (
                <div key={s.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{s.studentName} ({s.label})</span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        s.suspicionScore >= 65
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : s.suspicionScore >= 35
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      Score: {s.suspicionScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-full rounded-full ${
                        s.suspicionScore >= 65
                          ? 'bg-rose-500'
                          : s.suspicionScore >= 35
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${s.suspicionScore}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">Roll: {s.rollNo}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Official Printable PDF View Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <School className="h-8 w-8 text-indigo-700" />
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950">
                    Apex Institute of Technology - Department of Examinations
                  </h1>
                  <p className="text-xs text-slate-600">
                    Official Examination Hall Integrity &amp; Behavioral Surveillance Record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 print:hidden font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border">
              <div>
                <p><strong>Course:</strong> {exam.courseCode} - {exam.name}</p>
                <p><strong>Hall:</strong> {exam.hallName}</p>
                <p><strong>Date &amp; Time:</strong> {exam.date} ({exam.startTime} - {exam.endTime})</p>
              </div>
              <div>
                <p><strong>Chief Superintendent:</strong> {exam.invigilator}</p>
                <p><strong>Surveillance System:</strong> SentinelExam AI v1.4</p>
                <p><strong>Data Retention Policy:</strong> {retentionDays} Days (Encrypted)</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-slate-900">Summary of Incidents</h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="p-2">Incident ID</th>
                    <th className="p-2">Candidate Roll</th>
                    <th className="p-2">Seat</th>
                    <th className="p-2">Violation Description</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {confirmedAlerts.map((a) => (
                    <tr key={a.id}>
                      <td className="p-2 font-mono font-bold text-rose-700">{a.id}</td>
                      <td className="p-2">{a.rollNo} ({a.studentName})</td>
                      <td className="p-2 font-mono">{a.seatLabel}</td>
                      <td className="p-2">{a.behaviorTitle}</td>
                      <td className="p-2 font-bold text-rose-700">Confirmed</td>
                    </tr>
                  ))}
                  {confirmedAlerts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                        No confirmed malpractice infractions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-4 text-xs space-y-4">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong>Mandatory Statutory Declaration:</strong> I hereby certify that the flagged incidents listed above were independently reviewed and confirmed by human invigilators on duty. In accordance with university ethics bylaws, no automated penalties were imposed. All video keyframes and sensor telemetry have been archived under secure storage protocol.
              </p>

              <div className="grid grid-cols-2 pt-6 gap-8">
                <div>
                  <div className="border-b border-slate-400 pb-1 text-slate-700 font-mono">
                    {exam.invigilator}
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">Invigilator Signature</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 text-slate-700 font-mono">
                    Dr. H. Vance, Chief Exam Controller
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">Chief Controller Countersign</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t print:hidden">
              <button
                onClick={handlePrint}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Print / Save as PDF
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
