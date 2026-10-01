"""
ai/seat_mapper.py
Seat Zone Geometry & Candidate Association Module
Maps 2D frame coordinates to defined physical examination desks and seats
"""

import json
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

class SeatZone:
    def __init__(self, seat_id: str, label: str, row: str, col: int, polygon: List[List[int]], assigned_student: Optional[Dict[str, str]] = None):
        self.seat_id = seat_id
        self.label = label
        self.row = row
        self.col = col
        self.polygon = np.array(polygon, dtype=np.int32)
        self.assigned_student = assigned_student or {}
        # Bounding box of polygon [xmin, ymin, xmax, ymax]
        self.bbox = (
            int(np.min(self.polygon[:, 0])),
            int(np.min(self.polygon[:, 1])),
            int(np.max(self.polygon[:, 0])),
            int(np.max(self.polygon[:, 1]))
        )

    def contains_point(self, point: Tuple[int, int]) -> bool:
        """Determines if a 2D point (x, y) lies inside the seat zone boundary."""
        import cv2
        return cv2.pointPolygonTest(self.polygon, (float(point[0]), float(point[1])), False) >= 0

    def compute_overlap_iou(self, bbox: Tuple[int, int, int, int]) -> float:
        """Calculates IoU between candidate detection bbox and seat bounding box."""
        xA = max(self.bbox[0], bbox[0])
        yA = max(self.bbox[1], bbox[1])
        xB = min(self.bbox[2], bbox[2])
        yB = min(self.bbox[3], bbox[3])
        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (self.bbox[2] - self.bbox[0]) * (self.bbox[3] - self.bbox[1])
        boxBArea = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        denom = float(boxAArea + boxBArea - interArea)
        return interArea / denom if denom > 0 else 0.0

class SeatMapper:
    def __init__(self, seats_config_file: Optional[str] = None):
        self.seats: Dict[str, SeatZone] = {}
        if seats_config_file:
            self.load_from_json(seats_config_file)

    def load_from_json(self, filepath: str):
        with open(filepath, 'r') as f:
            data = json.load(f)
        for s in data.get("seats", []):
            zone = SeatZone(
                seat_id=s["seat_id"],
                label=s["label"],
                row=s.get("row", "A"),
                col=s.get("col", 1),
                polygon=s["polygon"],
                assigned_student=s.get("assigned_student")
            )
            self.seats[zone.seat_id] = zone

    def save_to_json(self, filepath: str, hall_name: str = "Hall 104", camera_id: str = "CAM-01"):
        data = {
            "exam_hall": hall_name,
            "camera_id": camera_id,
            "seats": [
                {
                    "seat_id": s.seat_id,
                    "label": s.label,
                    "row": s.row,
                    "col": s.col,
                    "polygon": s.polygon.tolist(),
                    "assigned_student": s.assigned_student
                }
                for s in self.seats.values()
            ]
        }
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    def assign_candidate_to_seat(self, candidate_bbox: Tuple[int, int, int, int]) -> Optional[str]:
        """Finds the best matching seat zone for a detected candidate bounding box."""
        center_x = (candidate_bbox[0] + candidate_bbox[2]) // 2
        center_y = (candidate_bbox[1] + candidate_bbox[3]) // 2

        # 1. Point in polygon test
        for seat_id, zone in self.seats.items():
            if zone.contains_point((center_x, center_y)):
                return seat_id

        # 2. Maximum overlap fallback
        best_seat = None
        best_iou = 0.25 # Threshold to avoid spurious assignments
        for seat_id, zone in self.seats.items():
            iou = zone.compute_overlap_iou(candidate_bbox)
            if iou > best_iou:
                best_iou = iou
                best_seat = seat_id

        return best_seat
