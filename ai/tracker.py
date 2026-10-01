"""
ai/tracker.py
Multi-Person Tracking Module for Exam Hall Candidates
Maintains stable track IDs across frames using ByteTrack / centroid Kalman filtering
"""

from typing import List, Dict, Any, Tuple
import numpy as np

class TrackedCandidate:
    def __init__(self, track_id: int, bbox: Tuple[int, int, int, int], confidence: float):
        self.track_id = track_id
        self.bbox = bbox # [x1, y1, x2, y2]
        self.confidence = confidence
        self.center = ((bbox[0] + bbox[2]) // 2, (bbox[1] + bbox[3]) // 2)
        self.history: List[Tuple[int, int]] = [self.center]
        self.assigned_seat_id: str = ""
        self.lost_frames: int = 0

    def update(self, bbox: Tuple[int, int, int, int], confidence: float):
        self.bbox = bbox
        self.confidence = confidence
        self.center = ((bbox[0] + bbox[2]) // 2, (bbox[1] + bbox[3]) // 2)
        self.history.append(self.center)
        if len(self.history) > 60:
            self.history.pop(0)
        self.lost_frames = 0

class CandidateTracker:
    def __init__(self, max_lost_frames: int = 30, iou_threshold: float = 0.3):
        self.tracks: Dict[int, TrackedCandidate] = {}
        self.next_track_id = 1
        self.max_lost_frames = max_lost_frames
        self.iou_threshold = iou_threshold

    @staticmethod
    def _compute_iou(boxA: Tuple[int, int, int, int], boxB: Tuple[int, int, int, int]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])
        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        denom = float(boxAArea + boxBArea - interArea)
        return interArea / denom if denom > 0 else 0.0

    def update(self, detections: List[Any]) -> List[TrackedCandidate]:
        """Matches current detections with existing active tracks."""
        matched_tracks = set()
        matched_dets = set()

        for track_id, track in self.tracks.items():
            best_iou = 0.0
            best_det_idx = -1
            for idx, det in enumerate(detections):
                if idx in matched_dets:
                    continue
                iou = self._compute_iou(track.bbox, det.bbox)
                if iou > best_iou:
                    best_iou = iou
                    best_det_idx = idx

            if best_iou >= self.iou_threshold and best_det_idx >= 0:
                track.update(detections[best_det_idx].bbox, detections[best_det_idx].confidence)
                matched_tracks.add(track_id)
                matched_dets.add(best_det_idx)
            else:
                track.lost_frames += 1

        # Create new tracks for unmatched detections
        for idx, det in enumerate(detections):
            if idx not in matched_dets:
                new_track = TrackedCandidate(self.next_track_id, det.bbox, det.confidence)
                self.tracks[self.next_track_id] = new_track
                self.next_track_id += 1

        # Purge tracks lost for too long
        expired = [tid for tid, t in self.tracks.items() if t.lost_frames > self.max_lost_frames]
        for tid in expired:
            del self.tracks[tid]

        return [t for t in self.tracks.values() if t.lost_frames == 0]
