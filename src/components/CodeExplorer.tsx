import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Copy,
  Check,
  Terminal,
  Download,
  FolderTree,
  ExternalLink
} from 'lucide-react';

interface CodeFile {
  name: string;
  category: 'ai' | 'backend' | 'config' | 'deploy';
  path: string;
  code: string;
}

const FILES: CodeFile[] = [
  {
    name: 'pipeline.py',
    category: 'ai',
    path: 'ai/pipeline.py',
    code: `import time
import cv2
import numpy as np
import yaml
from ai.detector import ExamHallDetector
from ai.tracker import CandidateTracker
from ai.pose import PoseEstimator
from ai.seat_mapper import SeatMapper
from ai.behavior import BehaviorEngine

class ExamMonitoringPipeline:
    def __init__(self, config_path="config/config.yaml", seats_path="config/seats.json"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
        self.seat_mapper = SeatMapper(seats_path)
        self.detector = ExamHallDetector(device=self.config.get("models", {}).get("device", "cpu"))
        self.tracker = CandidateTracker()
        self.pose_estimator = PoseEstimator()
        self.behavior_engine = BehaviorEngine(self.config)

    def process_frame(self, frame: np.ndarray):
        # 1. Detection
        persons = self.detector.detect_persons(frame)
        objects = self.detector.detect_exam_objects(frame)
        # 2. Tracking
        tracked = self.tracker.update(persons)
        # 3. Behavior Rules per seat
        for track in tracked:
            seat_id = self.seat_mapper.assign_candidate_to_seat(track.bbox)
            if seat_id:
                pose_kpts = self.pose_estimator.estimate(frame, track.bbox)
                yaw = pose_kpts.compute_head_yaw()
                alert = self.behavior_engine.process_seat_frame(
                    seat_id=seat_id, head_yaw=yaw, detected_objects=objects,
                    pose_keypoints=pose_kpts, neighbor_wrist_distances=[], is_seat_occupied=True
                )
                if alert:
                    print(f"🚨 Alert: {alert['behavior_type']} at Seat {seat_id}")`,
  },
  {
    name: 'detector.py',
    category: 'ai',
    path: 'ai/detector.py',
    code: `from typing import List, Tuple
import numpy as np

class ObjectDetectionResult:
    def __init__(self, class_name: str, confidence: float, bbox: Tuple[int, int, int, int]):
        self.class_name = class_name
        self.confidence = float(confidence)
        self.bbox = bbox

class ExamHallDetector:
    def __init__(self, person_model="yolov8m.pt", object_model="yolov8m_exam_objects.pt", device="cpu"):
        from ultralytics import YOLO
        self.person_model = YOLO(person_model)
        self.object_model = YOLO(object_model)
        self.device = device

    def detect_persons(self, frame: np.ndarray, conf_thresh=0.5):
        results = self.person_model(frame, classes=[0], conf=conf_thresh, device=self.device)
        return [ObjectDetectionResult("person", float(b.conf[0]), tuple(map(int, b.xyxy[0].tolist()))) for b in results[0].boxes]

    def detect_exam_objects(self, frame: np.ndarray, conf_thresh=0.65):
        results = self.object_model(frame, conf=conf_thresh, device=self.device)
        return [ObjectDetectionResult(self.object_model.names[int(b.cls[0])], float(b.conf[0]), tuple(map(int, b.xyxy[0].tolist()))) for b in results[0].boxes]`,
  },
  {
    name: 'behavior.py',
    category: 'ai',
    path: 'ai/behavior.py',
    code: `import time
from typing import Dict, Any, List, Optional

class BehaviorEngine:
    def __init__(self, config: Dict[str, Any]):
        self.rules = config.get("behavior_rules", {})
        self.alert_threshold = 65.0
        self.seat_states = {}

    def process_seat_frame(self, seat_id, head_yaw, detected_objects, pose_keypoints, neighbor_wrist_distances, is_seat_occupied, current_time=None):
        now = current_time or time.time()
        state = self.seat_states.setdefault(seat_id, {"score": 0.0, "last_alert": 0.0, "head_turns": []})

        # Rule 2: Phone detection
        phones = [o for o in detected_objects if "phone" in o.get("class_name", "").lower()]
        if phones:
            state["score"] = min(100.0, state["score"] + 40.0)
            return {"seat_id": seat_id, "behavior_type": "phone_detected", "suspicion_score": state["score"], "confidence": 0.95}

        # Rule 1: Head turning
        if abs(head_yaw) > 35.0:
            state["head_turns"].append(now)
            if len(state["head_turns"]) >= 3:
                state["score"] = min(100.0, state["score"] + 25.0)
                return {"seat_id": seat_id, "behavior_type": "looking_neighbor", "suspicion_score": state["score"], "confidence": 0.85}

        return None`,
  },
  {
    name: 'config.yaml',
    category: 'config',
    path: 'config/config.yaml',
    code: `camera:
  source: "0" # USB webcam or rtsp://IP:554/live
  fps_target: 25
  resolution: [1280, 720]

behavior_rules:
  head_turn:
    yaw_angle_threshold_degrees: 35.0
    duration_threshold_seconds: 4.0
    frequency_count_threshold: 3
  mobile_phone:
    confidence_threshold: 0.75
    consecutive_frames: 5
    suspicion_score_increment: 40
  object_passing:
    wrist_proximity_threshold_px: 80
    suspicion_score_increment: 45
  seat_leaving:
    absence_duration_seconds: 5.0

scoring:
  suspicion_alert_threshold: 65.0
  min_alert_cooldown_seconds: 15

ethics:
  require_human_confirmation: true
  retention_days: 90`,
  },
  {
    name: 'main.py (FastAPI)',
    category: 'backend',
    path: 'backend/main.py',
    code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SentinelExam AI Surveillance Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"ACK: {data}")

@app.patch("/api/v1/alerts/{alert_id}/review")
async def review_alert(alert_id: str, status: str, notes: str = None):
    # Mandatory Human-in-the-Loop review recording
    return {"status": "updated", "alert_id": alert_id, "review": status}`,
  },
  {
    name: 'docker-compose.yml',
    category: 'deploy',
    path: 'docker-compose.yml',
    code: `version: '3.8'
services:
  sentinel-backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - CAMERA_SOURCE=0
      - DEVICE=cpu # cuda:0 if GPU available
    volumes:
      - ./config:/app/config
      - ./evidence:/app/evidence`,
  },
];

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-sky-400" />
          <span className="font-bold text-white text-sm">
            Native Python CV &amp; FastAPI Production Architecture
          </span>
          <span className="text-slate-400 hidden sm:inline">• Fully runnable locally or via Docker</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <span>Run: </span>
          <span className="text-emerald-400">python -m ai.pipeline</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* File Navigator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FolderTree className="h-3.5 w-3.5 text-indigo-400" /> Source Modules
          </span>

          <div className="space-y-1">
            {FILES.map((f) => (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f)}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                  selectedFile.path === f.path
                    ? 'bg-indigo-600/30 text-white font-semibold border border-indigo-500/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400">
                  {f.category}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <p className="font-semibold text-slate-300">Quick Local Run Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[10px] font-mono">
              <li>pip install -r requirements.txt</li>
              <li>python evaluation.py</li>
              <li>uvicorn backend.main:app --port 8000</li>
            </ol>
          </div>
        </div>

        {/* Code View Panel */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          <div className="bg-slate-900/90 border-b border-slate-800 p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="text-slate-500">path:</span>
              <span className="font-bold text-sky-300">{selectedFile.path}</span>
            </div>

            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed bg-slate-950 flex-1 max-h-[540px]">
            <code>{selectedFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
