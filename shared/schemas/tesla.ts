import { z } from 'zod';

export const TeslaTelemetrySchema = z.object({
  timestamp: z.number(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  battery: z.object({
    level: z.number().min(0).max(100),
    charging: z.boolean()
  }),
  vehicle: z.object({
    speed: z.number().optional(),
    heading: z.number().optional(),
    odometer: z.number().optional()
  })
});

export type TeslaTelemetry = z.infer<typeof TeslaTelemetrySchema>;

export const TripStopSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  arrival: z.string().optional(),
  departure: z.string().optional(),
  notes: z.string().optional()
});

export type TripStop = z.infer<typeof TripStopSchema>;
