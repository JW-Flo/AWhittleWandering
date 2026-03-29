import { z } from 'zod';

// Raw data schema for Tessie input validation
const TessieRawDataSchema = z.object({
  timestamp: z.string().datetime(),
  vehicleId: z.string(),
  energyData: z.object({
    batteryLevel: z.number().min(0).max(100),
    chargingStatus: z.enum(['charging', 'idle', 'complete']),
    energyConsumed: z.number().nonnegative()
  })
});

// Type definition for validated Tessie raw data
export type TessieRawData = z.infer<typeof TessieRawDataSchema>;

// Transformer class for processing Tessie raw data
export class TessieDataTransformer {
  /**
   * Transform raw Tessie data into standardized format
   * @param rawData Unprocessed input data
   * @returns Validated and transformed data
   */
  transform(rawData: unknown): TessieRawData {
    try {
      // Validate input against schema
      const validatedData = TessieRawDataSchema.parse(rawData);

      // TODO: Add complex transformation logic if needed
      // Example: Normalize or enrich data

      return validatedData;
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        throw new Error('Invalid Tessie data: ${error.message}');
      }
      throw error;
    }
  }
}

// Optional: Export a convenience function for direct transformation
export function transformTessieData(rawData: unknown): TessieRawData {
  const transformer = new TessieDataTransformer();
  return transformer.transform(rawData);
}