"""
backend/main.py
FastAPI Server for SentinelExam AI Surveillance Backend
Handles REST endpoints, WebSocket live alerts stream, and evidence dispatch
"""

import os
import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.models import (
    ExamCreateSchema,
    SeatZoneSchema,
    AlertReviewUpdate,
    AlertResponse,
    ReviewStatus
)

app = FastAPI(
    title="SentinelExam AI - Central Surveillance API",
    description="Backend API for real-time exam hall monitoring, human-in-the-loop review, and evidence storage.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for rapid demo / testing
EXAMS_DB = []
SEATS_DB = {}
ALERTS_DB = []

# WebSocket Connection Manager for sub-second alert broadcasting
class AlertConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_alert(self, alert_data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(alert_data)
            except Exception:
                pass

manager = AlertConnectionManager()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SentinelExam AI Engine", "timestamp": datetime.utcnow().isoformat()}

@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive heartbeat
            data = await websocket.receive_text()
            await websocket.send_text(f"ACK: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/v1/exams")
def list_exams():
    return EXAMS_DB

@app.post("/api/v1/exams", status_code=201)
def create_exam(exam: ExamCreateSchema):
    new_exam = exam.dict()
    new_exam["id"] = f"EXAM-{int(datetime.utcnow().timestamp())}"
    new_exam["status"] = "live"
    EXAMS_DB.append(new_exam)
    return new_exam

@app.get("/api/v1/seats/{exam_id}")
def get_seats(exam_id: str):
    return SEATS_DB.get(exam_id, [])

@app.put("/api/v1/seats/{exam_id}")
def update_seats(exam_id: str, seats: List[SeatZoneSchema]):
    SEATS_DB[exam_id] = [s.dict() for s in seats]
    return {"success": True, "count": len(seats)}

@app.get("/api/v1/alerts")
def get_alerts(exam_id: Optional[str] = None):
    if exam_id:
        return [a for a in ALERTS_DB if a.get("exam_id") == exam_id]
    return ALERTS_DB

@app.patch("/api/v1/alerts/{alert_id}/review")
async def review_alert(alert_id: str, update: AlertReviewUpdate):
    for alert in ALERTS_DB:
        if alert["id"] == alert_id:
            alert["review_status"] = update.review_status.value
            alert["reviewed_by"] = update.reviewed_by
            alert["reviewed_at"] = datetime.utcnow().isoformat()
            alert["invigilator_notes"] = update.invigilator_notes
            return {"success": True, "alert": alert}
    raise HTTPException(status_code=404, detail="Alert incident not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
