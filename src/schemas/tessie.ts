import { z } from 'zod';

/**
 * Canonical Data Schema for Tessie ETL
 * Defines structured validation for trip and location data
 */
export const TessieSchema = z.object({
  // TODO: Implement comprehensive trip metadata schema
  tripId: z.string().uuid(),
  name: z.string().min(1).max(255),
  startDate: z.date(),
  endDate: z.date(),
  locations: z.array(z.object({
    // TODO: Add geospatial validation
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timestamp: z.date(),
    description: z.string().optional()
  }))
});

/**
 * Type inference for Tessie schema
 */
export type TessieData = z.infer<typeof TessieSchema>;

/**
 * Validate Tessie ETL data
 * @param data Raw input data to validate
 * @returns Validated Tessie data or throws validation error
 */
export function validateTessieData(data: unknown): TessieData {
  return TessieSchema.parse(data);
}
