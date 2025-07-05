import { z } from 'zod';

export const TelemetrySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.number(),
  batteryLevel: z.number().optional(),
  charging: z.boolean().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  altitude: z.number().optional(),
  temperature: z.number().optional(),
});

export type Telemetry = z.infer<typeof TelemetrySchema>;
