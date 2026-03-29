import { z } from 'zod';

/**
 * Unified Data Schema represents a flexible, generic data structure
 * for capturing diverse information types with strong typing
 */
export const UnifiedDataSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['user', 'event', 'transaction', 'document']),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  data: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    attributes: z.record(z.string(), z.unknown()).optional()
  })
});

/**
 * Type inference for UnifiedData based on the schema
 */
export type UnifiedData = z.infer<typeof UnifiedDataSchema>;

/**
 * Validate and transform input into UnifiedData
 * @param input Raw input data
 * @returns Validated UnifiedData
 */
export function createUnifiedData(input: unknown): UnifiedData {
  // TODO: Add more complex validation and transformation logic
  return UnifiedDataSchema.parse(input);
}

/**
 * Safely parse input, returning null if invalid
 * @param input Raw input data
 * @returns UnifiedData or null
 */
export function safeParseUnifiedData(input: unknown): UnifiedData | null {
  try {
    return UnifiedDataSchema.parse(input);
  } catch {
    return null;
  }
}