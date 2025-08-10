import { z } from 'zod';

export const TelemetrySchema = z.object({
  vin: z.string(),
  timestamp: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  battery: z.object({
    level: z.number(),
    range: z.number(),
  }),
  charging: z.object({
    state: z.string(),
    power: z.number().optional(),
  }).optional(),
  vehicle: z.object({
    state: z.string(),
    odometer: z.number().optional(),
  }).optional(),
});

export type TelemetryData = z.infer<typeof TelemetrySchema>;

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  service: z.string(),
  resources: z.record(z.string()),
  ingestion: z.record(z.any()).optional(),
  performance: z.record(z.number()).optional(),
  warnings: z.array(z.string()).optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;