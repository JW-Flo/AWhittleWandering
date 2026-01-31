import { z } from 'zod';
import {
  CanonicalEventSchema,
  ProviderEnvelopeSchema,
  ProviderSchemaVersion,
} from '../schemas/canonical/event-types';

export const ProviderParseResultSchema = z.object({
  envelope: ProviderEnvelopeSchema,
  rawPayload: z.unknown(),
  providerSchemaVersion: ProviderSchemaVersion,
});

export const ProviderAdapterResultSchema = z.object({
  canonicalEvents: z.array(CanonicalEventSchema),
  droppedCount: z.number().int().nonnegative().default(0),
  warnings: z.array(z.string()).default([]),
});

export type ProviderParseResult = z.infer<typeof ProviderParseResultSchema>;
export type ProviderAdapterResult = z.infer<typeof ProviderAdapterResultSchema>;

export interface ProviderAdapter {
  readonly providerName: string;
  readonly adapterVersion: string;

  parse(rawPayload: unknown, schemaVersion: string): ProviderParseResult;
  mapToCanonical(parsed: ProviderParseResult): ProviderAdapterResult;
}