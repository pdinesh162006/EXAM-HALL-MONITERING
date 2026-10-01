"""
backend/models.py
Database & Pydantic Schema Definitions for SentinelExam AI
Supports PostgreSQL and SQLite for local deployments
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    INVIGILATOR = "invigilator"
    AUDITOR = "auditor"

class ReviewStatus(str, Enum):
    UNREVIEWED = "unreviewed"
    CONFIRMED = "confirmed"
    FALSE_ALARM = "false_alarm"
    NEEDS_FOLLOW_UP = "needs_follow_up"

class BehaviorType(str, Enum):
    LOOKING_NEIGHBOR = "looking_neighbor"
    PHONE_DETECTED = "phone_detected"
    CHIT_MATERIAL = "chit_material"
    OBJECT_PASSING = "object_passing"
    TALKING_WHISPERING = "talking_whispering"
    LEAVING_SEAT = "leaving_seat"
    HAND_HIDDEN = "hand_hidden"

# Pydantic Schemas for API Requests & Responses
class UserSchema(BaseModel):
    id: str
    username: str
    full_name: str
    role: UserRole

class ExamCreateSchema(BaseModel):
    name: str
    course_code: str
    hall_name: str
    start_time: datetime
    end_time: datetime
    camera_source: str
    total_candidates: int

class SeatZoneSchema(BaseModel):
    seat_id: str
    label: str
    row: str
    col: int
    polygon: List[List[int]]
    assigned_roll_no: Optional[str] = None
    assigned_student_name: Optional[str] = None

class AlertReviewUpdate(BaseModel):
    review_status: ReviewStatus
    reviewed_by: str
    invigilator_notes: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    exam_id: str
    seat_id: str
    seat_label: str
    student_name: str
    roll_no: str
    timestamp: datetime
    behavior_type: BehaviorType
    behavior_title: str
    confidence: float
    suspicion_score: float
    evidence_snapshot_path: str
    evidence_clip_path: str
    review_status: ReviewStatus
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    invigilator_notes: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
