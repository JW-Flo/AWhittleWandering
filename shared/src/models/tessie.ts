import { z } from 'zod';

// Location Schema
export const LocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().optional(),
  timestamp: z.date()
});

// Location Type
export type Location = z.infer<typeof LocationSchema>;

// Journey Schema
export const JourneySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  locations: z.array(LocationSchema),
  description: z.string().optional()
});

// Journey Type
export type Journey = z.infer<typeof JourneySchema>;

// Narrative Moment Schema
export const NarrativeMomentSchema = z.object({
  id: z.string().uuid(),
  journeyId: z.string().uuid(),
  locationId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  mediaUrls: z.array(z.string().url()).optional(),
  timestamp: z.date()
});

// Narrative Moment Type
export type NarrativeMoment = z.infer<typeof NarrativeMomentSchema>;

// Presence Schema
export const PresenceSchema = z.object({
  id: z.string().uuid(),
  journeyId: z.string().uuid(),
  locationId: z.string().uuid(),
  status: z.enum(['active', 'paused', 'completed']),
  lastUpdated: z.date()
});

// Presence Type
export type Presence = z.infer<typeof PresenceSchema>;
