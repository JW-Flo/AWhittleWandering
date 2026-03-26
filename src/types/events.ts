export interface CanonicalEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, any>;
  source: string;
}

export interface TessieApiResponse {
  events: Array<{
    id: string;
    event_type: string;
    timestamp: number;
    payload: Record<string, any>;
  }>;
}