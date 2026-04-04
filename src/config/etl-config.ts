import { z } from 'zod';

// ETL Pipeline Configuration Schema
const ETLConfigSchema = z.object({
  sources: z.array(z.object({
    type: z.enum(['csv', 'json', 'api']),
    path: z.string(),
    transformations: z.array(z.object({
      type: z.string(),
      config: z.record(z.string(), z.unknown()).optional()
    })).optional()
  })),
  destinations: z.array(z.object({
    type: z.enum(['database', 'storage', 'api']),
    endpoint: z.string(),
    credentials: z.object({
      key: z.string().optional(),
      secret: z.string().optional()
    }).optional()
  }))
});

// Type for ETL Configuration
export type ETLConfig = z.infer<typeof ETLConfigSchema>;

// Validate ETL Configuration
export function validateETLConfig(config: unknown): ETLConfig {
  try {
    return ETLConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw new Error(`ETL Configuration Validation Failed: ${JSON.stringify(formattedErrors)}`);
    }
    throw error;
  }
}

// Default ETL Configuration
export const defaultETLConfig: ETLConfig = {
  sources: [],
  destinations: []
};
