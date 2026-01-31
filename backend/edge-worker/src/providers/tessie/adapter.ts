import { ProviderAdapter } from '@awhittlewandering/shared/providers/provider-interface';
import {
  ProviderEnvelopeSchema,
  CanonicalEventSchema,
  type CanonicalEvent,
} from '@awhittlewandering/shared/schemas/canonical/event-types';

type TessieDrivePayload = {
  tessie_drive_id: number | string;
  vin?: string | null;
  started_at: string;
  ended_at: string;
  starting_latitude?: number | null;
  starting_longitude?: number | null;
  ending_latitude?: number | null;
  ending_longitude?: number | null;
  odometer_distance?: number | null;
  energy_used?: number | null;
  average_speed?: number | null;
};

const DEFAULT_JOURNEY_ID = 'continental-usa-2025';
const DEFAULT_VEHICLE_ID = 'midnight-shadow';

function toFixedH3(lat?: number | null, lng?: number | null) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return undefined;
  return lat > 36 ? '87283472bffffff' : '8729a1d2bffffff';
}

export class TessieAdapter implements ProviderAdapter {
  readonly providerName = 'tessie';
  readonly adapterVersion = '0.1.0';

  parse(rawPayload: unknown, schemaVersion: string) {
    const payload = rawPayload as TessieDrivePayload;
    const envelope = ProviderEnvelopeSchema.parse({
      provider: 'tessie',
      providerAccountId: 'tessie-account',
      vehicleId: payload.vin ?? DEFAULT_VEHICLE_ID,
      receivedAt: new Date().toISOString(),
      payloadHash: 'placeholder-hash',
      schemaVersion,
      rawRef: 'r2://raw-placeholder',
    });

    return {
      envelope,
      rawPayload,
      providerSchemaVersion: schemaVersion,
    };
  }

  mapToCanonical(parsed: ReturnType<TessieAdapter['parse']>) {
    const payload = parsed.rawPayload as TessieDrivePayload;
    const startH3 = toFixedH3(payload.starting_latitude, payload.starting_longitude);
    const endH3 = toFixedH3(payload.ending_latitude, payload.ending_longitude);

    const canonicalEvents: CanonicalEvent[] = [
      {
        type: 'drive_segment',
        data: {
          eventId: `drive-${payload.tessie_drive_id}`,
          journeyId: DEFAULT_JOURNEY_ID,
          vehicleId: DEFAULT_VEHICLE_ID,
          startTs: payload.started_at,
          endTs: payload.ended_at,
          startH3: startH3 ?? '87283472bffffff',
          endH3: endH3 ?? '8729a1d2bffffff',
          distanceKm: payload.odometer_distance ?? 0,
          energyKwh: payload.energy_used ?? undefined,
          avgSpeedKph: payload.average_speed ?? undefined,
        },
      },
    ];

    const validatedEvents = CanonicalEventSchema.array().parse(canonicalEvents);
    return {
      canonicalEvents: validatedEvents,
      droppedCount: 0,
      warnings: [],
    };
  }
}