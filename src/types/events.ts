export interface CanonicalEvent {
  timestamp: number;
  type: string;
  source: string;
  data: Record<string, any>;
}

export interface TessieRawEvent {
  timestamp?: string | number;
  event_type?: string;
  payload?: Record<string, any>;
}