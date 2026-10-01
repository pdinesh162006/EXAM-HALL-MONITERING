export interface SeatZone {
  id: string;
  label: string;
  row: string;
  col: number;
  rollNo: string;
  studentName: string;
  x: number; // percentage coordinates 0-100
  y: number;
  width: number;
  height: number;
  suspicionScore: number; // 0 - 100
  status: 'normal' | 'caution' | 'flagged' | 'vacant';
  lastBehavior: string;
  headYaw: number;
  phoneDetected: boolean;
  handHiddenSec: number;
}

export interface AlertIncident {
  id: string;
  examId: string;
  seatId: string;
  seatLabel: string;
  studentName: string;
  rollNo: string;
  timestamp: string;
  behaviorType:
    | 'looking_neighbor'
    | 'phone_detected'
    | 'chit_material'
    | 'object_passing'
    | 'talking_whispering'
    | 'leaving_seat'
    | 'hand_hidden';
  behaviorTitle: string;
  confidence: number;
  suspicionDelta: number;
  evidenceSnapshot: string;
  videoClipUrl: string;
  reviewStatus: 'unreviewed' | 'confirmed' | 'false_alarm' | 'needs_follow_up';
  reviewedBy?: string;
  reviewedAt?: string;
  invigilatorNotes?: string;
  metrics: {
    durationSec?: number;
    headAngle?: number;
    neighborSeat?: string;
    objectType?: string;
  };
}

export interface ExamSession {
  id: string;
  name: string;
  courseCode: string;
  hallName: string;
  date: string;
  startTime: string;
  endTime: string;
  invigilator: string;
  cameraSource: string;
  totalCandidates: number;
  status: 'live' | 'completed' | 'scheduled';
}

export interface SystemConfig {
  lookAwayDurationSec: number;
  lookAwayFrequencyThreshold: number;
  phoneConfidenceThreshold: number;
  unauthorizedMaterialThreshold: number;
  handHiddenDurationSec: number;
  seatLeavingDurationSec: number;
  suspicionScoreAlertThreshold: number;
  evidenceRetentionDays: number;
  alertCooldownSec: number;
  cameraFpsTarget: number;
  audioChimeEnabled: boolean;
  institutionName: string;
  ethicsConsentNotice: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  groundingSources?: Array<{ title?: string; uri?: string }>;
}
