import React, { useState } from 'react';
import { X, PlusCircle, Calendar, Clock, Video, Users } from 'lucide-react';
import { ExamSession } from '../types';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (exam: Partial<ExamSession>) => Promise<void>;
}

export const CreateExamModal: React.FC<CreateExamModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [hallName, setHallName] = useState('Hall 104 - Main Auditorium');
  const [invigilator, setInvigilator] = useState('Prof. David Vance');
  const [cameraSource, setCameraSource] = useState('rtsp://hall104-cam01.internal/live');
  const [totalCandidates, setTotalCandidates] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !courseCode) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        name,
        courseCode,
        hallName,
        invigilator,
        cameraSource,
        totalCandidates,
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        status: 'live',
      });
      onClose();
    } catch (err) {
      alert('Failed to create examination session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-fade-in text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-indigo-400" />
            Provision New Examination Session
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Course Code &amp; Number</label>
            <input
              type="text"
              required
              placeholder="e.g. CS401, BIO204, LAW301"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Course / Examination Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced Operating Systems &amp; Concurrency"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Hall / Room ID</label>
              <input
                type="text"
                value={hallName}
                onChange={(e) => setHallName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Total Candidates</label>
              <input
                type="number"
                min={1}
                max={120}
                value={totalCandidates}
                onChange={(e) => setTotalCandidates(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Invigilator on Duty</label>
            <input
              type="text"
              value={invigilator}
              onChange={(e) => setInvigilator(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Surveillance Camera Stream (RTSP / USB)</label>
            <input
              type="text"
              value={cameraSource}
              onChange={(e) => setCameraSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-[11px] focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-semibold cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? 'Provisioning...' : 'Provision Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
