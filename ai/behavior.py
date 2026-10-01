"""
ai/behavior.py
Suspicion Rules Engine & Scoring Module
Evaluates spatiotemporal behavioral heuristics, computes rolling suspicion scores,
and generates alerts with strict human-in-the-loop review tagging.
"""

from typing import Dict, Any, List, Optional, Tuple
import time

class SeatBehaviorState:
    def __init__(self, seat_id: str):
        self.seat_id = seat_id
        self.suspicion_score: float = 0.0 # 0.0 to 100.0
        self.last_seen_timestamp: float = time.time()
        self.head_turn_timestamps: List[float] = []
        self.phone_detection_frames: int = 0
        self.hand_hidden_start_time: Optional[float] = None
        self.last_alert_timestamp: float = 0.0
        self.current_state: str = "normal" # "normal", "caution", "flagged"

    def decay_score(self, current_time: float, decay_rate_per_min: float = 5.0):
        dt_minutes = (current_time - self.last_seen_timestamp) / 60.0
        if dt_minutes > 0:
            self.suspicion_score = max(0.0, self.suspicion_score - dt_minutes * decay_rate_per_min)
            self.last_seen_timestamp = current_time

class BehaviorEngine:
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("behavior_rules", {})
        self.scoring_config = config.get("scoring", {})
        self.seat_states: Dict[str, SeatBehaviorState] = {}
        self.alert_threshold = self.scoring_config.get("suspicion_alert_threshold", 65.0)
        self.cooldown_sec = self.scoring_config.get("min_alert_cooldown_seconds", 15.0)

    def get_or_create_state(self, seat_id: str) -> SeatBehaviorState:
        if seat_id not in self.seat_states:
            self.seat_states[seat_id] = SeatBehaviorState(seat_id)
        return self.seat_states[seat_id]

    def process_seat_frame(
        self,
        seat_id: str,
        head_yaw: float,
        detected_objects: List[Dict[str, Any]],
        pose_keypoints: Optional[Any],
        neighbor_wrist_distances: List[Tuple[str, float]],
        is_seat_occupied: bool,
        current_time: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates rules for a given seat during one frame cycle.
        Returns an Alert dictionary if suspicion threshold or severe rule is triggered.
        """
        now = current_time or time.time()
        state = self.get_or_create_state(seat_id)
        state.decay_score(now)

        triggered_rule = None
        suspicion_increment = 0.0
        rule_details: Dict[str, Any] = {}

        # Rule 6: Seat leaving without authorization
        if not is_seat_occupied:
            time_absent = now - state.last_seen_timestamp
            if time_absent > self.config.get("seat_leaving", {}).get("absence_duration_seconds", 5.0):
                triggered_rule = "leaving_seat"
                suspicion_increment = 50.0
                rule_details = {"absence_duration_seconds": round(time_absent, 1)}
        else:
            state.last_seen_timestamp = now

            # Rule 2: Phone detection
            phone_dets = [d for d in detected_objects if "phone" in d.get("class_name", "").lower()]
            if phone_dets:
                state.phone_detection_frames += 1
                if state.phone_detection_frames >= self.config.get("mobile_phone", {}).get("consecutive_frames", 5):
                    triggered_rule = "phone_detected"
                    suspicion_increment = self.config.get("mobile_phone", {}).get("suspicion_score_increment", 40.0)
                    rule_details = {"confidence": phone_dets[0].get("confidence", 0.85), "object": "mobile_phone"}
            else:
                state.phone_detection_frames = max(0, state.phone_detection_frames - 1)

            # Rule 3: Unauthorized material (chits, cheat books)
            chit_dets = [d for d in detected_objects if any(w in d.get("class_name", "").lower() for w in ["chit", "book", "note", "paper_sheet"])]
            if chit_dets and not triggered_rule:
                triggered_rule = "chit_material"
                suspicion_increment = self.config.get("unauthorized_material", {}).get("suspicion_score_increment", 35.0)
                rule_details = {"confidence": chit_dets[0].get("confidence", 0.8), "object": chit_dets[0].get("class_name")}

            # Rule 1: Repeated or prolonged head turn
            yaw_thresh = self.config.get("head_turn", {}).get("yaw_angle_threshold_degrees", 35.0)
            if abs(head_yaw) >= yaw_thresh and not triggered_rule:
                state.head_turn_timestamps.append(now)
                # Keep within 2 minute rolling window
                cutoff = now - self.config.get("head_turn", {}).get("window_duration_seconds", 120)
                state.head_turn_timestamps = [t for t in state.head_turn_timestamps if t > cutoff]

                freq_thresh = self.config.get("head_turn", {}).get("frequency_count_threshold", 3)
                if len(state.head_turn_timestamps) >= freq_thresh:
                    triggered_rule = "looking_neighbor"
                    suspicion_increment = 25.0
                    rule_details = {
                        "yaw_angle": round(head_yaw, 1),
                        "count_in_window": len(state.head_turn_timestamps),
                        "direction": "right" if head_yaw > 0 else "left"
                    }

            # Rule 4: Object passing between adjacent seats (wrist proximity)
            pass_thresh = self.config.get("object_passing", {}).get("wrist_proximity_threshold_px", 80)
            for neighbor_seat_id, dist_px in neighbor_wrist_distances:
                if dist_px < pass_thresh and not triggered_rule:
                    triggered_rule = "object_passing"
                    suspicion_increment = self.config.get("object_passing", {}).get("suspicion_score_increment", 45.0)
                    rule_details = {"neighbor_seat": neighbor_seat_id, "distance_px": round(dist_px, 1)}
                    break

        # Apply score update
        state.suspicion_score = min(100.0, state.suspicion_score + suspicion_increment)

        # Update state classification
        if state.suspicion_score >= self.alert_threshold:
            state.current_state = "flagged"
        elif state.suspicion_score >= 35.0:
            state.current_state = "caution"
        else:
            state.current_state = "normal"

        # Check if an alert should be raised
        if triggered_rule and (state.suspicion_score >= self.alert_threshold or suspicion_increment >= 35.0):
            if (now - state.last_alert_timestamp) >= self.cooldown_sec:
                state.last_alert_timestamp = now
                return {
                    "seat_id": seat_id,
                    "behavior_type": triggered_rule,
                    "suspicion_score": round(state.suspicion_score, 1),
                    "suspicion_delta": round(suspicion_increment, 1),
                    "confidence": rule_details.get("confidence", 0.85),
                    "details": rule_details,
                    "timestamp": now,
                    "status": "unreviewed"
                }

        return None
