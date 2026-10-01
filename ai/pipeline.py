"""
ai/pipeline.py
End-to-End Orchestration Pipeline for SentinelExam AI
Runs video capture -> detection -> tracking -> pose -> behavior scoring -> alert dispatch
"""

import time
import cv2
import numpy as np
import yaml
from typing import Dict, Any, Optional

from ai.detector import ExamHallDetector
from ai.tracker import CandidateTracker
from ai.pose import PoseEstimator
from ai.seat_mapper import SeatMapper
from ai.behavior import BehaviorEngine

class ExamMonitoringPipeline:
    def __init__(self, config_path: str = "config/config.yaml", seats_path: str = "config/seats.json"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.seat_mapper = SeatMapper(seats_path)
        self.detector = ExamHallDetector(
            device=self.config.get("models", {}).get("device", "cpu")
        )
        self.tracker = CandidateTracker()
        self.pose_estimator = PoseEstimator()
        self.behavior_engine = BehaviorEngine(self.config)

        self.frame_count = 0
        self.fps = 0.0
        self._last_fps_calc = time.time()

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """Processes a single video frame and produces structured telemetry."""
        start_time = time.time()
        self.frame_count += 1

        # 1. Detection
        persons = self.detector.detect_persons(frame)
        objects = self.detector.detect_exam_objects(frame)

        # 2. Tracking
        tracked_candidates = self.tracker.update(persons)

        # 3. Seat Assignment and Pose Analysis
        frame_alerts = []
        seat_telemetry = {}

        # Map active tracks to seats
        occupied_seats = set()
        track_wrist_points = {}

        for track in tracked_candidates:
            seat_id = self.seat_mapper.assign_candidate_to_seat(track.bbox)
            if seat_id:
                occupied_seats.add(seat_id)
                track.assigned_seat_id = seat_id

                # Estimate Pose
                pose_kpts = self.pose_estimator.estimate(frame, track.bbox)
                head_yaw = pose_kpts.compute_head_yaw()

                # Extract wrist coordinates for passing detection
                r_wrist = pose_kpts.get("right_wrist")
                l_wrist = pose_kpts.get("left_wrist")
                if r_wrist:
                    track_wrist_points[seat_id] = (r_wrist[0], r_wrist[1])
                elif l_wrist:
                    track_wrist_points[seat_id] = (l_wrist[0], l_wrist[1])

                # Objects inside or near this seat's desk
                seat_objects = [
                    o.to_dict() for o in objects
                    # Check if object center is inside or within proximity of candidate
                    if abs((o.bbox[0] + o.bbox[2])/2 - track.center[0]) < 180
                ]

                # Neighbor distance check for passing
                neighbor_distances = []
                for other_seat_id, other_pt in track_wrist_points.items():
                    if other_seat_id != seat_id and seat_id in track_wrist_points:
                        my_pt = track_wrist_points[seat_id]
                        dist = np.hypot(my_pt[0] - other_pt[0], my_pt[1] - other_pt[1])
                        neighbor_distances.append((other_seat_id, dist))

                # Evaluate behavior
                alert = self.behavior_engine.process_seat_frame(
                    seat_id=seat_id,
                    head_yaw=head_yaw,
                    detected_objects=seat_objects,
                    pose_keypoints=pose_kpts,
                    neighbor_wrist_distances=neighbor_distances,
                    is_seat_occupied=True,
                    current_time=time.time()
                )

                if alert:
                    frame_alerts.append(alert)

                seat_telemetry[seat_id] = {
                    "occupied": True,
                    "student": self.seat_mapper.seats[seat_id].assigned_student,
                    "head_yaw": round(head_yaw, 1),
                    "suspicion_score": self.behavior_engine.get_or_create_state(seat_id).suspicion_score,
                    "state": self.behavior_engine.get_or_create_state(seat_id).current_state,
                    "objects_detected": [o["class_name"] for o in seat_objects]
                }

        # Check vacant seats for unexplained absence
        for seat_id in self.seat_mapper.seats.keys():
            if seat_id not in occupied_seats:
                alert = self.behavior_engine.process_seat_frame(
                    seat_id=seat_id,
                    head_yaw=0.0,
                    detected_objects=[],
                    pose_keypoints=None,
                    neighbor_wrist_distances=[],
                    is_seat_occupied=False,
                    current_time=time.time()
                )
                if alert:
                    frame_alerts.append(alert)

                seat_telemetry[seat_id] = {
                    "occupied": False,
                    "student": self.seat_mapper.seats[seat_id].assigned_student,
                    "head_yaw": 0.0,
                    "suspicion_score": self.behavior_engine.get_or_create_state(seat_id).suspicion_score,
                    "state": self.behavior_engine.get_or_create_state(seat_id).current_state,
                    "objects_detected": []
                }

        processing_latency_ms = (time.time() - start_time) * 1000

        return {
            "frame_number": self.frame_count,
            "latency_ms": round(processing_latency_ms, 2),
            "candidates_count": len(tracked_candidates),
            "seat_telemetry": seat_telemetry,
            "alerts": frame_alerts
        }

    def run_live(self, camera_source: Optional[str] = None):
        """Runs the live capture loop."""
        src = camera_source or self.config.get("camera", {}).get("source", "0")
        cap = cv2.VideoCapture(int(src) if src.isdigit() else src)

        print(f"[Pipeline] Connected to source: {src}")
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("[Pipeline] Stream ended or disconnected.")
                break

            result = self.process_frame(frame)
            if result["alerts"]:
                for a in result["alerts"]:
                    print(f"🚨 [ALERT RAISED] Seat {a['seat_id']}: {a['behavior_type']} (Score: {a['suspicion_score']})")

            # Press 'q' to break
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()
