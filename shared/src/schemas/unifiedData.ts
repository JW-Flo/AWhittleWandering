import { z } from 'zod';

export const journeyMetadataSchema = z.object({
  journeyId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  waypoints: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string().optional(),
  })).optional(),
});

export const timestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastSynced: z.string().datetime().optional(),
});

export const unifiedDataSchema = z.object({
  journeyMetadata: journeyMetadataSchema,
  timestamps: timestampsSchema,
  cachedPayload: z.unknown(),
});

export type UnifiedData = z.infer<typeof unifiedDataSchema>;
