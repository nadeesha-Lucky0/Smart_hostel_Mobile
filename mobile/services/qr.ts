/**
 * QR Smart Access Service
 * Connects to the existing /api/qr backend endpoints.
 * No backend changes required — reuses the same REST API as the web frontend.
 */
import apiClient from './api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type QrStatus = 'INSIDE' | 'OUTSIDE';

export interface MyStatusResponse {
  success: boolean;
  status: QrStatus;
  lastAction: 'ENTRY' | 'EXIT' | null;
  lastTime: string | null;
  destination: string | null;
  goingHome: boolean;
}

export interface SecurityPinResponse {
  pin: string;
  expiresAt?: string;
}

export interface ScanPayload {
  studentId: string;     // student's text ID (e.g. "ST001")
  action: 'entry' | 'exit';
  securityPin: string;   // extracted from the Gate QR code
  destination?: string;  // required when action is 'exit'
  goingHome?: boolean;
}

export interface ScanResponse {
  message: string;
  late?: boolean;
}

export interface OutsideStudent {
  student: {
    name: string;
    email: string;
    studentId: string;
    wing: string;
    room: string;
  } | null;
  lastExitAt: string;
  destination: string;
  goingHome: boolean;
  isLate: boolean;
}

export interface OutsideResponse {
  outsideCount: number;
  outside: OutsideStudent[];
}

export interface LateStudent {
  name: string;
  email: string;
  studentId: string;
}

export interface LateResponse {
  lateCount: number;
  lateStudents: LateStudent[];
}

export interface ScanLog {
  _id: string;
  studentId: string;
  action: 'entry' | 'exit';
  destination?: string;
  goingHome?: boolean;
  timestamp: string;
  studentUserId?: {
    name: string;
    email: string;
    studentId: string;
  };
}

// ──────────────────────────────────────────────
// Student APIs
// ──────────────────────────────────────────────

/** GET /api/qr/my-status — requires student token (auto-injected by apiClient) */
export const fetchMyQrStatus = async (): Promise<MyStatusResponse> => {
  const res = await apiClient.get<MyStatusResponse>('/qr/my-status');
  return res.data;
};

/** POST /api/qr/scan — public endpoint, no auth needed */
export const submitQrScan = async (payload: ScanPayload): Promise<ScanResponse> => {
  const res = await apiClient.post<ScanResponse>('/qr/scan', payload);
  return res.data;
};

// ──────────────────────────────────────────────
// Security / Warden APIs
// ──────────────────────────────────────────────

/** GET /api/qr/security-pin — requires security role */
export const fetchSecurityPin = async (): Promise<SecurityPinResponse> => {
  const res = await apiClient.get<SecurityPinResponse>('/qr/security-pin');
  return res.data;
};

/** GET /api/qr/outside — requires security or warden role */
export const fetchOutsideStudents = async (): Promise<OutsideResponse> => {
  const res = await apiClient.get<OutsideResponse>('/qr/outside');
  return res.data;
};

/** GET /api/qr/late — requires security or warden role */
export const fetchLateStudents = async (): Promise<LateResponse> => {
  const res = await apiClient.get<LateResponse>('/qr/late');
  return res.data;
};

/** GET /api/qr/logs — requires security or warden role */
export const fetchAllLogs = async (): Promise<ScanLog[]> => {
  const res = await apiClient.get<ScanLog[]>('/qr/logs');
  return res.data;
};
