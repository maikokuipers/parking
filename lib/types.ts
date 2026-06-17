// ============================================
// Database models
// ============================================

export interface TimeShortcut {
  id: number;
  label: string;
  start_time: string; // "09:00" or "now"
  end_time: string; // "19:00", "10:00", etc.
  sort_order: number;
  created_at: string;
}

export interface FavoritePlate {
  id: number;
  plate: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface SessionLog {
  id: number;
  plate: string;
  start_time: string;
  end_time: string;
  zone: string | null;
  cost: number | null;
  egis_id: string | null;
  created_at: string;
}

// ============================================
// Egis API types
// ============================================

export interface EgisLoginResponse {
  token: string;
}

export interface EgisPermit {
  id: number;
  name: string;
  status: string;
  client_product_id: number;
  started_at: string;
  ended_at: string;
  zone?: string;
  [key: string]: unknown;
}

export interface EgisParkingZone {
  id: number;
  name: string;
  code: string;
  [key: string]: unknown;
}

export interface EgisParkingSession {
  id: number;
  vrn: string;
  started_at: string;
  ended_at: string;
  status: string;
  cost?: number;
  zone?: string;
  [key: string]: unknown;
}

export interface EgisCostCalculation {
  parking_session_balance: {
    calculated_time: {
      hours: number;
      minutes: number;
    };
    calculated_cost: number;
  };
}

export interface EgisFavoriteVrn {
  id: number;
  vrn: string;
  description: string;
}

// ============================================
// API request/response types
// ============================================

export interface StartSessionRequest {
  plate: string;
  start_time: string; // ISO datetime or "now"
  end_time: string; // ISO datetime
  zone_id?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
