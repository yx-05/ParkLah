export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TelemetryLocation extends Coordinates {
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

export interface Destination {
  name: string;
  placeId?: string;
  latitude: number;
  longitude: number;
}

export interface GatekeeperStatus {
  isUnlocked: boolean;
  distanceMeters: number;
  durationSeconds: number;
  polyline?: string;
  reason?: string;
}

export interface Vehicle {
  id: string;
  makeModel: string;
  color: string;
  plateSuffix: string;
  isDefault: boolean;
}

export interface MatchOffer {
  matchId: string;
  leaverId: string;
  spotCoords: Coordinates;
  countdownSeconds: number;
  vehicleSummary?: {
    makeModel: string;
    color: string;
    plateSuffix: string;
  };
  landmarkNote?: string;
  handshakeTimeoutSeconds: number;
}

export interface WalletTransaction {
  id: string;
  type: 'TOPUP' | 'CHARGE' | 'REWARD' | 'CASHOUT' | 'REFUND';
  amount: number;
  description: string;
  timestamp: string;
}

export type SearcherStateEnum =
  | 'IDLE'
  | 'DESTINATION_SET'
  | 'GATEKEEPER_LOCKED'
  | 'ACTIVE_RADAR_SEARCH'
  | 'MATCH_OFFERED'
  | 'NAVIGATING_TO_SPOT'
  | 'ARRIVED_PROMPT'
  | 'PARKED_SUCCESS'
  | 'SPOT_TAKEN_FALLBACK';

export type LeaverStateEnum =
  | 'IDLE'
  | 'BROADCASTING_COUNTDOWN'
  | 'SEARCHER_MATCHED'
  | 'HANDOFF_COMPLETED'
  | 'CANCELLED';
