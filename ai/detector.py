"""
ai/detector.py
Person and Object Detection Module for SentinelExam AI
Uses Ultralytics YOLOv8 with custom exam classes (phone, chit, book, calculator)
"""

from typing import List, Dict, Any, Tuple
import numpy as np

class ObjectDetectionResult:
    def __init__(self, class_name: str, confidence: float, bbox: Tuple[int, int, int, int]):
        self.class_name = class_name
        self.confidence = float(confidence)
        self.bbox = bbox # [x1, y1, x2, y2]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_name": self.class_name,
            "confidence": round(self.confidence, 3),
            "bbox": list(self.bbox)
        }

class ExamHallDetector:
    def __init__(self, person_model_path: str = "yolov8m.pt", object_model_path: str = "yolov8m_exam_objects.pt", device: str = "cpu"):
        self.device = device
        self.person_model_path = person_model_path
        self.object_model_path = object_model_path
        self._init_models()

    def _init_models(self):
        """Initializes YOLOv8 models. Falls back to lightweight simulation if torch/ultralytics is unavailable."""
        try:
            from ultralytics import YOLO
            self.person_model = YOLO(self.person_model_path)
            self.object_model = YOLO(self.object_model_path)
            self.is_mock = False
            print(f"[Detector] Loaded YOLOv8 models on device: {self.device}")
        except Exception as e:
            print(f"[Detector Note] Running in lightweight synthetic detection mode ({e})")
            self.is_mock = True

    def detect_persons(self, frame: np.ndarray, conf_thresh: float = 0.5) -> List[ObjectDetectionResult]:
        """Detects all human candidates in the exam hall frame."""
        if self.is_mock:
            # Deterministic mock detections based on frame dimensions
            h, w = frame.shape[:2]
            return [
                ObjectDetectionResult("person", 0.94, (int(w*0.1), int(h*0.2), int(w*0.35), int(h*0.6)),
                ObjectDetectionResult("person", 0.92, (int(w*0.4), int(h*0.2), int(w*0.65), int(h*0.6)),
                ObjectDetectionResult("person", 0.91, (int(w*0.7), int(h*0.2), int(w*0.95), int(h*0.6))
            ]

        results = self.person_model(frame, classes=[0], conf=conf_thresh, device=self.device, verbose=False)
        detections = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            detections.append(ObjectDetectionResult("person", conf, (x1, y1, x2, y2)))
        return detections

    def detect_exam_objects(self, frame: np.ndarray, conf_thresh: float = 0.65) -> List[ObjectDetectionResult]:
        """Detects contraband items: cell phones, folded paper chits, notebooks, unauthorized tech."""
        if self.is_mock:
            return []

        results = self.object_model(frame, conf=conf_thresh, device=self.device, verbose=False)
        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            cls_name = self.object_model.names.get(cls_id, "unknown_item")
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            detections.append(ObjectDetectionResult(cls_name, conf, (x1, y1, x2, y2)))
        return detections
