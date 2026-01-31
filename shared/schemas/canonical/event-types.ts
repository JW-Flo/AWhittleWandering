import { z } from 'zod';

export const ProviderSchemaVersion = z.string().min(1);
export const CanonicalSchemaVersion = z.string().min(1);

export const ProviderEnvelopeSchema = z.object({
  provider: z.string().min(1),
  providerAccountId: z.string().min(1),
  vehicleId: z.string().min(1),
  receivedAt: z.string().datetime(),
  payloadHash: z.string().min(1),
  schemaVersion: ProviderSchemaVersion,
  rawRef: z.string().min(1),
});

export const VehicleSchema = z.object({
  vehicleId: z.string().min(1),
  provider: z.string().min(1),
  vin: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  drivetrain: z.string().optional(),
  batteryKwh: z.number().optional(),
});

export const JourneySchema = z.object({
  journeyId: z.string().min(1),
  userId: z.string().optional(),
  title: z.string().optional(),
  privacyMode: z.enum(['private', 'redacted', 'public']).default('public'),
  start: z.string().datetime(),
  end: z.string().datetime().nullable().optional(),
});

export const LocationPingSchema = z.object({
  eventId: z.string().min(1),
  journeyId: z.string().min(1),
  vehicleId: z.string().min(1),
  ts: z.string().datetime(),
  lat: z.number(),
  lng: z.number(),
  h3Index: z.string().min(1),
  speed: z.number().optional(),
  heading: z.number().optional(),
  odometer: z.number().optional(),
});

export const DriveSegmentSchema = z.object({
  eventId: z.string().min(1),
  journeyId: z.string().min(1),
  vehicleId: z.string().min(1),
  startTs: z.string().datetime(),
  endTs: z.string().datetime(),
  startH3: z.string().min(1),
  endH3: z.string().min(1),
  distanceKm: z.number().nonnegative(),
  energyKwh: z.number().nonnegative().optional(),
  avgSpeedKph: z.number().nonnegative().optional(),
});

export const ChargeSessionSchema = z.object({
  eventId: z.string().min(1),
  journeyId: z.string().min(1),
  vehicleId: z.string().min(1),
  startTs: z.string().datetime(),
  endTs: z.string().datetime().optional(),
  locationH3: z.string().min(1),
  energyAddedKwh: z.number().nonnegative().optional(),
  costUsd: z.number().nonnegative().optional(),
  chargerType: z.string().optional(),
  providerStationId: z.string().optional(),
});

export const StateSnapshotSchema = z.object({
  eventId: z.string().min(1),
  journeyId: z.string().min(1),
  vehicleId: z.string().min(1),
  ts: z.string().datetime(),
  socPct: z.number().min(0).max(100).optional(),
  ratedRangeKm: z.number().nonnegative().optional(),
  outsideTempC: z.number().optional(),
  isPluggedIn: z.boolean().optional(),
  isCharging: z.boolean().optional(),
});

export const DiagnosticFaultSchema = z.object({
  eventId: z.string().min(1),
  journeyId: z.string().min(1),
  vehicleId: z.string().min(1),
  ts: z.string().datetime(),
  code: z.string().min(1),
  severity: z.enum(['info', 'warning', 'critical']),
  subsystem: z.string().optional(),
  rawDetailsRef: z.string().optional(),
});

export const CanonicalEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('location_ping'), data: LocationPingSchema }),
  z.object({ type: z.literal('drive_segment'), data: DriveSegmentSchema }),
  z.object({ type: z.literal('charge_session'), data: ChargeSessionSchema }),
  z.object({ type: z.literal('state_snapshot'), data: StateSnapshotSchema }),
  z.object({ type: z.literal('diagnostic_fault'), data: DiagnosticFaultSchema }),
]);

export type ProviderEnvelope = z.infer<typeof ProviderEnvelopeSchema>;
export type CanonicalEvent = z.infer<typeof CanonicalEventSchema>;
export type CanonicalSchemaVersions = z.infer<typeof CanonicalSchemaVersion>;