import { CanonicalEvent, TessieRawEvent } from '../types/events';

export function mapTessieEventToCanonical(rawEvent: TessieRawEvent): CanonicalEvent {
  if (!rawEvent) {
    throw new Error('Invalid Tessie raw event: null or undefined');
  }

  return {
    timestamp: parseTimestamp(rawEvent.timestamp),
    type: rawEvent.event_type || 'unknown',
    source: 'tessie',
    data: rawEvent.payload || {}
  };
}

function parseTimestamp(timestamp?: string | number): number {
  if (timestamp == null) {
    return Date.now();
  }

  if (typeof timestamp === 'number') {
    return timestamp;
  }

  const parsedTimestamp = Date.parse(timestamp);
  
  return isNaN(parsedTimestamp) 
    ? Date.now() 
    : parsedTimestamp;
}

export function mapTessieEventsToCanonical(rawEvents: TessieRawEvent[]): CanonicalEvent[] {
  if (!Array.isArray(rawEvents)) {
    throw new Error('Invalid input: expected array of Tessie events');
  }

  return rawEvents.map(mapTessieEventToCanonical);
}