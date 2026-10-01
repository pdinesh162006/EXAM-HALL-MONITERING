import React, { useRef, useEffect, useState } from 'react';
import {
  Video,
  Camera,
  Play,
  Pause,
  AlertTriangle,
  Layers,
  Sparkles,
  Maximize2,
  RefreshCw,
  Eye,
  Smartphone,
  FileSpreadsheet,
  UserX,
  Volume2
} from 'lucide-react';
import { SeatZone, AlertIncident } from '../types';

interface CameraStreamProps {
  seats: SeatZone[];
  onTriggerAlert: (alert: Partial<AlertIncident>) => void;
  onSelectAlert: (alertId: string) => void;
  audioEnabled: boolean;
}

export const CameraStream: React.FC<CameraStreamProps> = ({
  seats,
  onTriggerAlert,
  audioEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stream source state
  const [streamSource, setStreamSource] = useState<'simulated' | 'webcam' | 'file'>('simulated');
  const [selectedScenario, setSelectedScenario] = useState<string>('phone_concealment');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);

  // Overlay toggles
  const [showKeypoints, setShowKeypoints] = useState<boolean>(true);
  const [showSeatZones, setShowSeatZones] = useState<boolean>(true);
  const [showObjectBoxes, setShowObjectBoxes] = useState<boolean>(true);
  const [showGazeVectors, setShowGazeVectors] = useState<boolean>(true);

  // Live telemetry metrics
  const [fps, setFps] = useState<number>(24.8);
  const [frameTick, setFrameTick] = useState<number>(0);
  const [selectedSeatId, setSelectedSeatId] = useState<string>('seat-a2');

  // Webcam stream handler
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (streamSource === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setWebcamActive(true);
          }
        })
        .catch((err) => {
          console.warn('[Webcam Access]:', err);
          alert('Could not access webcam. Falling back to synthetic simulation mode.');
          setStreamSource('simulated');
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        setWebcamActive(false);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [streamSource]);

  // Main Canvas Rendering Engine (surveillance HUD + bounding boxes + pose skeletons)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (!isPlaying) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw base frame
      if (streamSource === 'webcam' && videoRef.current && webcamActive) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
      } else {
        // Draw synthetic high-tech surveillance exam hall environment
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw hall perspective lines and desks
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 80) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i * 1.2 - w * 0.1, h);
          ctx.stroke();
        }
      }

      const t = Date.now() / 1000;

      // 2. Render Seat Zones & Students
      seats.forEach((seat) => {
        const sx = (seat.x / 100) * w;
        const sy = (seat.y / 100) * h;
        const sw = (seat.width / 100) * w;
        const sh = (seat.height / 100) * h;

        // Seat color status
        let strokeColor = '#10b981'; // Green normal
        let fillColor = 'rgba(16, 185, 129, 0.05)';
        let badgeColor = '#059669';

        if (seat.status === 'flagged' || seat.suspicionScore >= 65) {
          strokeColor = '#ef4444'; // Red flagged
          fillColor = 'rgba(239, 68, 68, 0.12)';
          badgeColor = '#dc2626';
        } else if (seat.status === 'caution' || seat.suspicionScore >= 35) {
          strokeColor = '#f59e0b'; // Amber caution
          fillColor = 'rgba(245, 158, 11, 0.08)';
          badgeColor = '#d97706';
        }

        // Draw Seat Boundary Box
        if (showSeatZones) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = seat.id === selectedSeatId ? 2.5 : 1.5;
          ctx.fillStyle = fillColor;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(sx, sy, sw, sh);
          ctx.fillRect(sx, sy, sw, sh);
          ctx.setLineDash([]);

          // Corner bracket accents
          const cornerLen = 12;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2.5;

          // Top-left
          ctx.beginPath();
          ctx.moveTo(sx, sy + cornerLen);
          ctx.lineTo(sx, sy);
          ctx.lineTo(sx + cornerLen, sy);
          ctx.stroke();

          // Top-right
          ctx.beginPath();
          ctx.moveTo(sx + sw - cornerLen, sy);
          ctx.lineTo(sx + sw, sy);
          ctx.lineTo(sx + sw, sy + cornerLen);
          ctx.stroke();

          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(sx, sy + sh - cornerLen);
          ctx.lineTo(sx, sy + sh);
          ctx.lineTo(sx + cornerLen, sy + sh);
          ctx.stroke();

          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(sx + sw - cornerLen, sy + sh);
          ctx.lineTo(sx + sw, sy + sh);
          ctx.lineTo(sx + sw, sy + sh - cornerLen);
          ctx.stroke();

          // Label badge on top
          ctx.fillStyle = badgeColor;
          ctx.fillRect(sx, sy - 18, 110, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`${seat.label} [${seat.rollNo}]`, sx + 4, sy - 5);

          // Suspicion indicator badge
          const scoreText = `SCORE: ${seat.suspicionScore}%`;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(sx + sw - 75, sy - 18, 75, 18);
          ctx.fillStyle = strokeColor;
          ctx.font = 'bold 9px monospace';
          ctx.fillText(scoreText, sx + sw - 70, sy - 5);
          ctx.restore();
        }

        // Draw Simulated Student Body & Keypoints
        const candidateCenterX = sx + sw * 0.5;
        const candidateCenterY = sy + sh * 0.45;
        const candidateW = sw * 0.55;
        const candidateH = sh * 0.7;

        // Dynamic behavior oscillation based on seat ID & scenario
        let currentHeadYaw = seat.headYaw;
        if (seat.id === 'seat-a2' && selectedScenario === 'phone_concealment') {
          currentHeadYaw = 35 + Math.sin(t * 2) * 12;
        } else if (seat.id === 'seat-b1' && selectedScenario === 'chit_passing') {
          currentHeadYaw = 40 + Math.sin(t * 1.5) * 8;
        } else if (seat.id === 'seat-c1' || (seat.id === 'seat-a1' && selectedScenario === 'looking_away')) {
          currentHeadYaw = 38 + Math.sin(t * 3) * 10;
        }

        // Head coordinates
        const headX = candidateCenterX + (currentHeadYaw / 90) * 15;
        const headY = candidateCenterY - candidateH * 0.28;
        const headRadius = candidateW * 0.22;

        // Body torso
        const shoulderL_X = candidateCenterX - candidateW * 0.38;
        const shoulderR_X = candidateCenterX + candidateW * 0.38;
        const shoulderY = candidateCenterY - candidateH * 0.08;

        const elbowL_X = shoulderL_X - 14;
        const elbowR_X = shoulderR_X + 14;
        const elbowY = shoulderY + candidateH * 0.25;

        // Wrist positions (adjust for passing in chit passing scenario)
        let wristL_X = shoulderL_X + 8;
        let wristL_Y = shoulderY + candidateH * 0.45;
        let wristR_X = shoulderR_X - 8;
        let wristR_Y = shoulderY + candidateH * 0.45;

        if (seat.id === 'seat-b1' && selectedScenario === 'chit_passing') {
          wristR_X = sx + sw * 0.95; // Reaching out right towards B2
          wristR_Y = sy + sh * 0.6;
        } else if (seat.id === 'seat-b2' && selectedScenario === 'chit_passing') {
          wristL_X = sx + sw * 0.05; // Reaching out left towards B1
          wristL_Y = sy + sh * 0.6;
        }

        // Render Candidate Avatar
        ctx.save();
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;

        // Torso fill
        ctx.beginPath();
        ctx.moveTo(shoulderL_X, shoulderY);
        ctx.lineTo(shoulderR_X, shoulderY);
        ctx.lineTo(candidateCenterX + candidateW * 0.3, sy + sh * 0.85);
        ctx.lineTo(candidateCenterX - candidateW * 0.3, sy + sh * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Head fill
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.stroke();

        // Draw Skeletal Keypoints & Bones
        if (showKeypoints) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;

          // Arms skeleton
          ctx.beginPath();
          ctx.moveTo(shoulderL_X, shoulderY);
          ctx.lineTo(elbowL_X, elbowY);
          ctx.lineTo(wristL_X, wristL_Y);
          ctx.moveTo(shoulderR_X, shoulderY);
          ctx.lineTo(elbowR_X, elbowY);
          ctx.lineTo(wristR_X, wristR_Y);
          ctx.stroke();

          // Keypoints joints circles
          const joints = [
            [headX, headY],
            [shoulderL_X, shoulderY],
            [shoulderR_X, shoulderY],
            [elbowL_X, elbowY],
            [elbowR_X, elbowY],
            [wristL_X, wristL_Y],
            [wristR_X, wristR_Y],
          ];

          joints.forEach(([jx, jy]) => {
            ctx.beginPath();
            ctx.arc(jx, jy, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        }

        // Draw Gaze Vector Ray
        if (showGazeVectors) {
          const gazeLength = 32;
          const gazeRad = ((currentHeadYaw - 90) * Math.PI) / 180;
          const gx = headX + Math.cos(gazeRad) * gazeLength;
          const gy = headY + Math.sin(gazeRad) * gazeLength;

          ctx.beginPath();
          ctx.moveTo(headX, headY);
          ctx.lineTo(gx, gy);
          ctx.strokeStyle = Math.abs(currentHeadYaw) > 30 ? '#ef4444' : '#34d399';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Gaze arrow head
          ctx.beginPath();
          ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = Math.abs(currentHeadYaw) > 30 ? '#ef4444' : '#34d399';
          ctx.fill();
        }

        // Draw Contraband Object Bounding Box
        if (showObjectBoxes) {
          if (seat.id === 'seat-a2' && (seat.phoneDetected || selectedScenario === 'phone_concealment')) {
            const phoneX = sx + sw * 0.42;
            const phoneY = sy + sh * 0.68;
            const phoneW = 28;
            const phoneH = 44;

            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.fillRect(phoneX, phoneY, phoneW, phoneH);
            ctx.strokeRect(phoneX, phoneY, phoneW, phoneH);

            // Label
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(phoneX, phoneY - 14, 88, 14);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('PHONE (94%)', phoneX + 3, phoneY - 4);
            ctx.restore();
          }

          if (seat.id === 'seat-b1' && selectedScenario === 'chit_passing') {
            const chitX = wristR_X - 10;
            const chitY = wristR_Y - 8;
            ctx.save();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
            ctx.fillRect(chitX, chitY, 20, 16);
            ctx.strokeRect(chitX, chitY, 20, 16);

            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(chitX, chitY - 12, 65, 12);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('CHIT (89%)', chitX + 2, chitY - 3);
            ctx.restore();
          }
        }

        ctx.restore();
      });

      // 3. Render Surveillance HUD Overlay (Crosshairs, Timestamp, Grid)
      ctx.save();
      // Hall Camera Tag & Status
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(12, 12, 220, 48);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(12, 12, 220, 48);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(26, 26, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('CAM 01: HALL 104 [LIVE]', 38, 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      const timeStr = new Date().toLocaleTimeString();
      ctx.fillText(`${timeStr} • AI VISION ACTIVE`, 26, 48);

      // Target Crosshair at center
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 20, h / 2);
      ctx.lineTo(w / 2 + 20, h / 2);
      ctx.moveTo(w / 2, h / 2 - 20);
      ctx.lineTo(w / 2, h / 2 + 20);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    seats,
    isPlaying,
    streamSource,
    webcamActive,
    selectedScenario,
    showKeypoints,
    showSeatZones,
    showObjectBoxes,
    showGazeVectors,
    selectedSeatId,
  ]);

  // Trigger sound effect when alert is raised
  const triggerAudioChime = () => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      // AudioContext policy
    }
  };

  const handleSimulateAlert = (type: string) => {
    triggerAudioChime();
    let newAlert: Partial<AlertIncident> = {
      examId: 'EXAM-2026-CS401',
      timestamp: new Date().toLocaleTimeString(),
      confidence: 0.92,
      reviewStatus: 'unreviewed',
    };

    if (type === 'phone') {
      newAlert = {
        ...newAlert,
        seatId: 'seat-a2',
        seatLabel: 'Seat A2',
        studentName: 'Marcus Holloway',
        rollNo: 'CS-24014',
        behaviorType: 'phone_detected',
        behaviorTitle: 'Mobile Smart Device Detected Under Desk',
        suspicionDelta: 35,
        confidence: 0.95,
        metrics: { durationSec: 5.8, objectType: 'Smartphone' },
      };
    } else if (type === 'passing') {
      newAlert = {
        ...newAlert,
        seatId: 'seat-b1',
        seatLabel: 'Seat B1',
        studentName: 'Tariq Al-Mansoor',
        rollNo: 'CS-24035',
        behaviorType: 'object_passing',
        behaviorTitle: 'Passing Unauthorized Paper Chit to Seat B2',
        suspicionDelta: 30,
        confidence: 0.89,
        metrics: { neighborSeat: 'Seat B2' },
      };
    } else if (type === 'looking') {
      newAlert = {
        ...newAlert,
        seatId: 'seat-a1',
        seatLabel: 'Seat A1',
        studentName: 'Alex Mercer',
        rollNo: 'CS-24001',
        behaviorType: 'looking_neighbor',
        behaviorTitle: 'Repeated Head Turning Towards Neighbor (Yaw: 42°)',
        suspicionDelta: 22,
        confidence: 0.84,
        metrics: { headAngle: 42, durationSec: 4.5 },
      };
    } else if (type === 'leaving') {
      newAlert = {
        ...newAlert,
        seatId: 'seat-a3',
        seatLabel: 'Seat A3',
        studentName: 'Clara Oswald',
        rollNo: 'CS-24029',
        behaviorType: 'leaving_seat',
        behaviorTitle: 'Candidate Left Desk Unattended Without Invigilator Hall Pass',
        suspicionDelta: 45,
        confidence: 0.98,
        metrics: { durationSec: 6.5 },
      };
    }

    onTriggerAlert(newAlert);
  };

  return (
    <div className="space-y-4">
      {/* Cockpit Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Source Switcher */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-indigo-400" /> Video Feed:
          </span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setStreamSource('simulated')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                streamSource === 'simulated'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulated Hall Camera
            </button>
            <button
              onClick={() => setStreamSource('webcam')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer flex items-center gap-1 ${
                streamSource === 'webcam'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="h-3 w-3" /> Live Webcam
            </button>
          </div>

          {streamSource === 'simulated' && (
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="phone_concealment">Scenario 1: Phone Concealment (Seat A2)</option>
              <option value="chit_passing">Scenario 2: Chit Passing (Seat B1 to B2)</option>
              <option value="looking_away">Scenario 3: Repeated Looking at Neighbor (Seat A1)</option>
              <option value="clean_session">Scenario 4: Baseline Clean Exam Session</option>
            </select>
          )}
        </div>

        {/* Video Overlay Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setShowKeypoints(!showKeypoints)}
            className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
              showKeypoints ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500'
            }`}
          >
            Keypoints
          </button>
          <button
            onClick={() => setShowSeatZones(!showSeatZones)}
            className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
              showSeatZones ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500'
            }`}
          >
            Seat Zones
          </button>
          <button
            onClick={() => setShowObjectBoxes(!showObjectBoxes)}
            className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
              showObjectBoxes ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500'
            }`}
          >
            Object Detect
          </button>
          <button
            onClick={() => setShowGazeVectors(!showGazeVectors)}
            className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
              showGazeVectors ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500'
            }`}
          >
            Head Yaw Gaze
          </button>
        </div>

        {/* Play / Pause & Quick Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
            title={isPlaying ? 'Pause feed' : 'Play feed'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-emerald-400" />}
          </button>

          {/* Quick Simulation Injectors for Live Testing */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Inject Event:</span>
            <button
              onClick={() => handleSimulateAlert('phone')}
              className="bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
              title="Inject Phone Detection Violation"
            >
              <Smartphone className="h-3 w-3" /> Phone
            </button>
            <button
              onClick={() => handleSimulateAlert('passing')}
              className="bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-300 px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
              title="Inject Chit Passing Violation"
            >
              <FileSpreadsheet className="h-3 w-3" /> Chit
            </button>
            <button
              onClick={() => handleSimulateAlert('looking')}
              className="bg-sky-950/70 hover:bg-sky-900 border border-sky-800 text-sky-300 px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
              title="Inject Repeated Head Turn Violation"
            >
              <Eye className="h-3 w-3" /> Head Yaw
            </button>
            <button
              onClick={() => handleSimulateAlert('leaving')}
              className="bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-300 px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
              title="Inject Seat Leaving Violation"
            >
              <UserX className="h-3 w-3" /> Leaving
            </button>
          </div>
        </div>
      </div>

      {/* Main Surveillance Viewport Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl aspect-video w-full max-h-[640px] flex items-center justify-center">
        {/* Hidden video element used when webcam is active */}
        <video ref={videoRef} className="hidden" playsInline muted autoPlay />

        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 100;
            const clickY = ((e.clientY - rect.top) / rect.height) * 100;

            const found = seats.find(
              (s) =>
                clickX >= s.x &&
                clickX <= s.x + s.width &&
                clickY >= s.y &&
                clickY <= s.y + s.height
            );
            if (found) {
              setSelectedSeatId(found.id);
            }
          }}
        />

        {/* Live Surveillance Status Overlay Badges */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AI Tracker: <strong className="text-white">ByteTrack v8</strong></span>
          </div>
          <span className="text-slate-600">|</span>
          <div>Candidates Monitored: <strong className="text-indigo-400">{seats.length}</strong></div>
          <span className="text-slate-600">|</span>
          <div>Model Confidence: <strong className="text-emerald-400">94.6%</strong></div>
        </div>

        <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-400 flex items-center gap-2">
          <span>Target FPS: 25.0</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-400 font-mono">1280x720 (16:9)</span>
        </div>
      </div>

      {/* Real-time Candidate Seating Grid Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            Live Candidate Seat Telemetry &amp; Suspicion Risk Index
          </h3>
          <span className="text-[11px] text-slate-500">
            Click any seat to highlight on camera frame
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {seats.map((seat) => {
            const isSelected = seat.id === selectedSeatId;
            const isFlagged = seat.suspicionScore >= 65;
            const isCaution = seat.suspicionScore >= 35 && !isFlagged;

            return (
              <div
                key={seat.id}
                onClick={() => setSelectedSeatId(seat.id)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-400 bg-slate-900 shadow-md'
                    : isFlagged
                    ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-700'
                    : isCaution
                    ? 'bg-amber-950/20 border-amber-800/60 hover:border-amber-700'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">{seat.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isFlagged
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isCaution
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {seat.suspicionScore}%
                  </span>
                </div>

                <p className="text-[11px] font-medium text-slate-300 truncate">{seat.studentName}</p>
                <p className="text-[10px] text-slate-500 font-mono mb-2">{seat.rollNo}</p>

                {/* Suspicion Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isFlagged ? 'bg-rose-500' : isCaution ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, seat.suspicionScore)}%` }}
                  ></div>
                </div>

                <p className="text-[10px] text-slate-400 truncate">
                  {seat.status === 'flagged' ? (
                    <span className="text-rose-400 font-medium">⚠️ Flagged</span>
                  ) : seat.status === 'caution' ? (
                    <span className="text-amber-400 font-medium">Glancing</span>
                  ) : (
                    <span className="text-emerald-400">Normal</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
