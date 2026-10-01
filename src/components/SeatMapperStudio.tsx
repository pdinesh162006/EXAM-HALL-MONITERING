import React, { useState, useRef, useEffect } from 'react';
import {
  Grid3X3,
  Plus,
  Trash2,
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  Move,
  User,
  Hash,
  Sparkles,
  Info
} from 'lucide-react';
import { SeatZone } from '../types';

interface SeatMapperStudioProps {
  examId: string;
  initialSeats: SeatZone[];
  onSaveSeats: (seats: SeatZone[]) => Promise<void>;
}

export const SeatMapperStudio: React.FC<SeatMapperStudioProps> = ({
  examId,
  initialSeats,
  onSaveSeats,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [seats, setSeats] = useState<SeatZone[]>(initialSeats);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(
    initialSeats.length > 0 ? initialSeats[0].id : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Sync when initialSeats changes
  useEffect(() => {
    setSeats(initialSeats);
    if (!selectedSeatId && initialSeats.length > 0) {
      setSelectedSeatId(initialSeats[0].id);
    }
  }, [initialSeats]);

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  // Draw seat zones on calibration canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Draw dark surveillance room background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Grid lines for calibration
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Perspective desk cues
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // Draw all defined seat zones
    seats.forEach((seat) => {
      const isSelected = seat.id === selectedSeatId;
      const sx = (seat.x / 100) * w;
      const sy = (seat.y / 100) * h;
      const sw = (seat.width / 100) * w;
      const sh = (seat.height / 100) * h;

      ctx.save();
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#6366f1';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(99, 102, 241, 0.08)';

      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);

      // Label banner
      ctx.fillStyle = isSelected ? '#0284c7' : '#4338ca';
      ctx.fillRect(sx, sy - 18, Math.max(100, sw * 0.7), 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${seat.label} • ${seat.rollNo}`, sx + 4, sy - 5);

      // Student name inside
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px sans-serif';
      ctx.fillText(seat.studentName, sx + 8, sy + 22);

      ctx.restore();
    });

    // Draw temporary box while user is dragging
    if (isDrawing && currentBox) {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.fillRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
      ctx.restore();
    }
  }, [seats, selectedSeatId, isDrawing, currentBox]);

  // Canvas Mouse Events for Interactive Drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check if clicked inside existing seat
    const clickedSeat = seats.find((seat) => {
      const sx = (seat.x / 100) * canvas.width;
      const sy = (seat.y / 100) * canvas.height;
      const sw = (seat.width / 100) * canvas.width;
      const sh = (seat.height / 100) * canvas.height;
      return x >= sx && x <= sx + sw && y >= sy && y <= sy + sh;
    });

    if (clickedSeat) {
      setSelectedSeatId(clickedSeat.id);
    } else {
      // Start drawing new zone
      setIsDrawing(true);
      setDragStart({ x, y });
      setCurrentBox({ x, y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const currentY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const w = currentX - dragStart.x;
    const h = currentY - dragStart.y;

    setCurrentBox({
      x: w >= 0 ? dragStart.x : currentX,
      y: h >= 0 ? dragStart.y : currentY,
      w: Math.abs(w),
      h: Math.abs(h),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox || !canvasRef.current) {
      setIsDrawing(false);
      setDragStart(null);
      setCurrentBox(null);
      return;
    }

    const canvas = canvasRef.current;
    if (currentBox.w > 30 && currentBox.h > 30) {
      const pctX = (currentBox.x / canvas.width) * 100;
      const pctY = (currentBox.y / canvas.height) * 100;
      const pctW = (currentBox.w / canvas.width) * 100;
      const pctH = (currentBox.h / canvas.height) * 100;

      const newId = `seat-${Date.now().toString().slice(-4)}`;
      const nextNum = seats.length + 1;
      const newSeat: SeatZone = {
        id: newId,
        label: `Seat ${String.fromCharCode(65 + Math.floor(nextNum / 4))}${(nextNum % 3) + 1}`,
        row: String.fromCharCode(65 + Math.floor(nextNum / 4)),
        col: (nextNum % 3) + 1,
        rollNo: `CS-240${String(nextNum).padStart(2, '0')}`,
        studentName: `Candidate ${nextNum}`,
        x: Math.round(pctX),
        y: Math.round(pctY),
        width: Math.round(pctW),
        height: Math.round(pctH),
        suspicionScore: 0,
        status: 'normal',
        lastBehavior: 'Mapped',
        headYaw: 0,
        phoneDetected: false,
        handHiddenSec: 0,
      };

      setSeats([...seats, newSeat]);
      setSelectedSeatId(newSeat.id);
    }

    setIsDrawing(false);
    setDragStart(null);
    setCurrentBox(null);
  };

  const handleAddQuickGrid = (rows: number, cols: number) => {
    const newSeatsList: SeatZone[] = [];
    const cellW = Math.floor(75 / cols);
    const cellH = Math.floor(65 / rows);

    let counter = 1;
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      for (let c = 0; c < cols; c++) {
        const x = 10 + c * (cellW + 4);
        const y = 15 + r * (cellH + 8);
        newSeatsList.push({
          id: `seat-${rowLetter.toLowerCase()}${c + 1}`,
          label: `Seat ${rowLetter}${c + 1}`,
          row: rowLetter,
          col: c + 1,
          rollNo: `CS-240${String(counter).padStart(2, '0')}`,
          studentName: `Candidate ${rowLetter}${c + 1}`,
          x,
          y,
          width: cellW,
          height: cellH,
          suspicionScore: 0,
          status: 'normal',
          lastBehavior: 'Stationary',
          headYaw: 0,
          phoneDetected: false,
          handHiddenSec: 0,
        });
        counter++;
      }
    }
    setSeats(newSeatsList);
    if (newSeatsList.length > 0) setSelectedSeatId(newSeatsList[0].id);
  };

  const handleDeleteSeat = (id: string) => {
    const updated = seats.filter((s) => s.id !== id);
    setSeats(updated);
    if (selectedSeatId === id) {
      setSelectedSeatId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleUpdateSelected = (field: keyof SeatZone, val: any) => {
    if (!selectedSeatId) return;
    setSeats(
      seats.map((s) => (s.id === selectedSeatId ? { ...s, [field]: val } : s))
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveSeats(seats);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save seat zones to server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const exportData = {
      exam_id: examId,
      exported_at: new Date().toISOString(),
      hall: 'Hall 104 - Main Auditorium',
      seats: seats.map((s) => ({
        seat_id: s.id,
        label: s.label,
        row: s.row,
        col: s.col,
        coordinates_percent: { x: s.x, y: s.y, width: s.width, height: s.height },
        assigned_student: {
          roll_no: s.rollNo,
          name: s.studentName,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seats_${examId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Visual Canvas Calibration Studio */}
      <div className="lg:col-span-2 space-y-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Grid3X3 className="h-4 w-4 text-cyan-400" /> Interactive Desk Calibration
            </span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              (Click &amp; drag on canvas to draw new seat zone)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Quick Templates:</span>
            <button
              onClick={() => handleAddQuickGrid(2, 3)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium border border-slate-700 transition cursor-pointer"
            >
              2x3 Grid (6)
            </button>
            <button
              onClick={() => handleAddQuickGrid(3, 4)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium border border-slate-700 transition cursor-pointer"
            >
              3x4 Grid (12)
            </button>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl aspect-video w-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full object-contain cursor-crosshair select-none"
          />

          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-2">
            <Move className="h-3 w-3 text-cyan-400" />
            <span>Click any seat box to inspect &amp; reconfigure</span>
          </div>

          <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300">
            Total Seats Mapped: <strong className="text-cyan-400">{seats.length}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Deploy Seat Map to AI Pipeline'}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span>Export seats.json</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>Seat layout successfully applied and active!</span>
            </div>
          )}
        </div>
      </div>

      {/* Seat Inspector & Edit Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-400" />
              Seat Zone Inspector
            </h3>
            {selectedSeat && (
              <button
                onClick={() => handleDeleteSeat(selectedSeat.id)}
                className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/40 rounded transition"
                title="Delete this seat zone"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {selectedSeat ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Seat Identifier / Label</label>
                <input
                  type="text"
                  value={selectedSeat.label}
                  onChange={(e) => handleUpdateSelected('label', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Candidate Roll No</label>
                  <input
                    type="text"
                    value={selectedSeat.rollNo}
                    onChange={(e) => handleUpdateSelected('rollNo', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Row / Col</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedSeat.row}
                      onChange={(e) => handleUpdateSelected('row', e.target.value)}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-white font-mono focus:outline-none"
                    />
                    <input
                      type="number"
                      value={selectedSeat.col}
                      onChange={(e) => handleUpdateSelected('col', parseInt(e.target.value, 10))}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  value={selectedSeat.studentName}
                  onChange={(e) => handleUpdateSelected('studentName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="block text-slate-400 font-medium mb-2">Zone Coordinates (% of frame)</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-500">X Position (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedSeat.x}
                      onChange={(e) => handleUpdateSelected('x', parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500">Y Position (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedSeat.y}
                      onChange={(e) => handleUpdateSelected('y', parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500">Width (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={selectedSeat.width}
                      onChange={(e) => handleUpdateSelected('width', parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500">Height (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={selectedSeat.height}
                      onChange={(e) => handleUpdateSelected('height', parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              <Info className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p>No seat zone selected.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Click on any seat on the canvas or drag to create a new zone.
              </p>
            </div>
          )}
        </div>

        {/* Seat zone list table */}
        <div className="border-t border-slate-800 pt-3">
          <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-2 block">
            Defined Hall Seats ({seats.length})
          </span>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {seats.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSeatId(s.id)}
                className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs transition ${
                  s.id === selectedSeatId
                    ? 'bg-indigo-600/30 text-white font-medium border border-indigo-500/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{s.label} ({s.rollNo})</span>
                <span className="text-[11px] text-slate-500 truncate max-w-[100px]">{s.studentName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
