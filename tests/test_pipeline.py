"""
tests/test_pipeline.py
Unit and Integration Tests for SentinelExam AI Pipeline
"""

import unittest
import numpy as np
from ai.detector import ExamHallDetector, ObjectDetectionResult
from ai.tracker import CandidateTracker
from ai.seat_mapper import SeatMapper, SeatZone
from ai.behavior import BehaviorEngine

class TestExamPipeline(unittest.TestCase):

    def setUp(self):
        self.mock_config = {
            "behavior_rules": {
                "head_turn": {
                    "yaw_angle_threshold_degrees": 35.0,
                    "frequency_count_threshold": 3,
                    "window_duration_seconds": 120
                },
                "mobile_phone": {
                    "confidence_threshold": 0.75,
                    "consecutive_frames": 3,
                    "suspicion_score_increment": 40.0
                },
                "seat_leaving": {
                    "absence_duration_seconds": 5.0
                }
            },
            "scoring": {
                "suspicion_alert_threshold": 65.0,
                "min_alert_cooldown_seconds": 10.0
            }
        }
        self.behavior_engine = BehaviorEngine(self.mock_config)

    def test_seat_zone_containment(self):
        zone = SeatZone(
            seat_id="test-a1",
            label="Seat A1",
            row="A",
            col=1,
            polygon=[[10, 10], [100, 10], [100, 100], [10, 100]]
        )
        self.assertTrue(zone.contains_point((50, 50)))
        self.assertFalse(zone.contains_point((150, 150)))

    def test_tracker_association(self):
        tracker = CandidateTracker()
        det1 = [ObjectDetectionResult("person", 0.9, (10, 10, 50, 80))]
        tracks1 = tracker.update(det1)
        self.assertEqual(len(tracks1), 1)
        first_id = tracks1[0].track_id

        # Second frame: small movement
        det2 = [ObjectDetectionResult("person", 0.9, (12, 12, 52, 82))]
        tracks2 = tracker.update(det2)
        self.assertEqual(len(tracks2), 1)
        self.assertEqual(tracks2[0].track_id, first_id)

    def test_phone_detection_alert_trigger(self):
        phone_obj = {"class_name": "mobile_phone", "confidence": 0.88, "bbox": [20, 20, 40, 60]}

        # Frame 1
        a1 = self.behavior_engine.process_seat_frame(
            seat_id="seat-1", head_yaw=0.0, detected_objects=[phone_obj],
            pose_keypoints=None, neighbor_wrist_distances=[], is_seat_occupied=True, current_time=100.0
        )
        self.assertIsNone(a1)

        # Frame 2
        a2 = self.behavior_engine.process_seat_frame(
            seat_id="seat-1", head_yaw=0.0, detected_objects=[phone_obj],
            pose_keypoints=None, neighbor_wrist_distances=[], is_seat_occupied=True, current_time=100.1
        )
        self.assertIsNone(a2)

        # Frame 3 (reaches 3 consecutive frames threshold)
        a3 = self.behavior_engine.process_seat_frame(
            seat_id="seat-1", head_yaw=0.0, detected_objects=[phone_obj],
            pose_keypoints=None, neighbor_wrist_distances=[], is_seat_occupied=True, current_time=100.2
        )
        self.assertIsNotNone(a3)
        self.assertEqual(a3["behavior_type"], "phone_detected")
        self.assertGreaterEqual(a3["suspicion_score"], 40.0)

if __name__ == "__main__":
    unittest.main()
