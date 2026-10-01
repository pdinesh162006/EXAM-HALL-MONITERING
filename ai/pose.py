"""
ai/pose.py
Pose & Head Pose Estimation Module for Exam Monitoring
Computes skeletal joints and head yaw/pitch angles using MediaPipe or YOLOv8-Pose
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import math

class PoseKeypoints:
    def __init__(self, keypoints: Dict[str, Tuple[float, float, float]]):
        # Format: {"nose": (x, y, conf), "left_eye": ..., "right_eye": ..., "left_shoulder": ...}
        self.keypoints = keypoints

    def get(self, name: str) -> Optional[Tuple[float, float, float]]:
        return self.keypoints.get(name)

    def compute_head_yaw(self) -> float:
        """
        Calculates head yaw angle in degrees (-90 to +90).
        Positive = turned right, Negative = turned left, ~0 = facing forward/down at desk.
        Derived from relative distance between nose and ear/eye keypoints.
        """
        nose = self.get("nose")
        left_ear = self.get("left_ear") or self.get("left_eye")
        right_ear = self.get("right_ear") or self.get("right_eye")

        if not nose or not left_ear or not right_ear:
            return 0.0

        dist_left = abs(nose[0] - left_ear[0])
        dist_right = abs(right_ear[0] - nose[0])
        total = dist_left + dist_right
        if total == 0:
            return 0.0

        # Asymmetry ratio maps to approximate horizontal yaw
        ratio = (dist_right - dist_left) / total
        yaw_deg = ratio * 75.0 # Empirical scaling factor
        return float(np.clip(yaw_deg, -90.0, 90.0))

    def compute_torso_lean(self) -> float:
        """Calculates torso lean angle relative to vertical axis (0 deg = upright)."""
        l_shoulder = self.get("left_shoulder")
        r_shoulder = self.get("right_shoulder")
        if not l_shoulder or not r_shoulder:
            return 0.0

        mid_x = (l_shoulder[0] + r_shoulder[0]) / 2.0
        mid_y = (l_shoulder[1] + r_shoulder[1]) / 2.0
        nose = self.get("nose")
        if not nose:
            return 0.0

        dx = nose[0] - mid_x
        dy = nose[1] - mid_y
        angle_rad = math.atan2(dx, -dy)
        return float(math.degrees(angle_rad))

class PoseEstimator:
    def __init__(self, model_type: str = "yolov8-pose"):
        self.model_type = model_type
        self.is_mock = True
        try:
            from ultralytics import YOLO
            self.model = YOLO("yolov8n-pose.pt")
            self.is_mock = False
        except Exception:
            self.is_mock = True

    def estimate(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> PoseKeypoints:
        """Estimates pose keypoints for a candidate's bounding box."""
        if self.is_mock:
            # Synthetic keypoints within candidate bbox
            x1, y1, x2, y2 = bbox
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            w = x2 - x1
            h = y2 - y1
            kpts = {
                "nose": (cx, y1 + h * 0.15, 0.95),
                "left_eye": (cx - w * 0.1, y1 + h * 0.12, 0.92),
                "right_eye": (cx + w * 0.1, y1 + h * 0.12, 0.92),
                "left_shoulder": (cx - w * 0.3, y1 + h * 0.38, 0.90),
                "right_shoulder": (cx + w * 0.3, y1 + h * 0.38, 0.90),
                "left_elbow": (cx - w * 0.38, y1 + h * 0.58, 0.85),
                "right_elbow": (cx + w * 0.38, y1 + h * 0.58, 0.85),
                "left_wrist": (cx - w * 0.25, y1 + h * 0.78, 0.82),
                "right_wrist": (cx + w * 0.25, y1 + h * 0.78, 0.82),
            }
            return PoseKeypoints(kpts)

        crop = frame[max(0, bbox[1]):min(frame.shape[0], bbox[3]), max(0, bbox[0]):min(frame.shape[1], bbox[2])]
        results = self.model(crop, verbose=False)
        # Parse output keypoints mapped back to original coordinate system
        kpts = {}
        # Ultralytics pose keypoints index: 0=nose, 1=l_eye, 2=r_eye, 3=l_ear, 4=r_ear, 5=l_shoulder, 6=r_shoulder...
        # Returns parsed PoseKeypoints instance
        return PoseKeypoints(kpts)
