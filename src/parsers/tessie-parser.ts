import { CanonicalEvent, TessieApiResponse } from '../types/events';

export class TessieEventParser {
  static parseResponse(response: TessieApiResponse): CanonicalEvent[] {
    if (!response || !response.events) {
      throw new Error('Invalid Tessie API response');
    }

    return response.events.map(event => ({
      id: event.id,
      type: event.event_type,
      timestamp: event.timestamp,
      data: event.payload,
      source: 'tessie'
    }));
  }
}