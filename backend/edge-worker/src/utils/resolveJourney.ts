/**
 * Resolves a journey reference (opaque numeric public_id or legacy text slug)
 * to the internal text journey ID used as the primary key in the database.
 *
 * Resolution order:
 * 1. If ref is numeric, look up by public_id
 * 2. If ref is a non-empty string, look up by id (text PK)
 * 3. Fall back to DEFAULT_JOURNEY_ID
 */

export const DEFAULT_JOURNEY_ID = 'continental-usa-2025';
export const DEFAULT_VEHICLE_ID = 'midnight-shadow';

interface ResolvedJourney {
  journeyId: string;
  vehicleId: string;
}

export async function resolveJourneyRef(
  db: D1Database | undefined,
  ref: string | undefined
): Promise<ResolvedJourney> {
  const fallback: ResolvedJourney = {
    journeyId: DEFAULT_JOURNEY_ID,
    vehicleId: DEFAULT_VEHICLE_ID,
  };

  if (!ref || !db) return fallback;

  const trimmed = ref.trim();
  if (!trimmed) return fallback;

  // Numeric → look up by public_id
  const asNum = Number(trimmed);
  if (Number.isInteger(asNum) && asNum > 0) {
    try {
      const row = await db
        .prepare('SELECT id, vehicle_id FROM journeys WHERE public_id = ? LIMIT 1')
        .bind(asNum)
        .first();
      if (row) {
        return {
          journeyId: (row as any).id,
          vehicleId: (row as any).vehicle_id || fallback.vehicleId,
        };
      }
    } catch {
      // Fall through to text lookup
    }
  }

  // Text slug → look up by primary key
  try {
    const row = await db
      .prepare('SELECT id, vehicle_id FROM journeys WHERE id = ? LIMIT 1')
      .bind(trimmed)
      .first();
    if (row) {
      return {
        journeyId: (row as any).id,
        vehicleId: (row as any).vehicle_id || fallback.vehicleId,
      };
    }
  } catch {
    // Fall through to default
  }

  return fallback;
}
