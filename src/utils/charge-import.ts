import { z } from 'zod';

const TessieChargeEventSchema = z.object({
  id: z.string(),
  vehicle_id: z.string(),
  start_time: z.number(),
  end_time: z.number().nullable(),
  energy_added: z.number(),
  charger_power: z.number().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

type TessieChargeEvent = z.infer<typeof TessieChargeEventSchema>;

/**
 * Import raw Tessie charge events into the canonical charges table.
 * Performs upserts based on tessie_event_id.
 * @param env - Cloudflare Workers environment with DB binding
 * @param rawEvents - Array of raw charge event objects from Tessie
 * @returns Object with counts of inserted/updated records and any validation errors
 */
export async function importCharges(
  env: Env,
  rawEvents: unknown[]
): Promise<{ inserted: number; updated: number; errors: Error[] }> {
  const validated: TessieChargeEvent[] = [];
  const errors: Error[] = [];

  for (const raw of rawEvents) {
    const result = TessieChargeEventSchema.safeParse(raw);
    if (!result.success) {
      errors.push(new Error(`Invalid charge event: ${result.error.message}`));
      continue;
    }
    validated.push(result.data);
  }

  const db = env.DB; // D1 binding named "DB"
  let inserted = 0;
  let updated = 0;

  for (const event of validated) {
    const start = new Date(event.start_time * 1000).toISOString();
    const end = event.end_time ? new Date(event.end_time * 1000).toISOString() : null;
    const location =
      event.latitude !== null && event.longitude !== null
        ? `${event.latitude},${event.longitude}`
        : null;

    // Check if record already exists
    const checkStmt = db.prepare('SELECT id FROM charges WHERE tessie_event_id = ?');
    const { results } = await checkStmt.bind(event.id).all<{ id: string }>();
    const exists = results.length > 0;

    if (exists) {
      const updateStmt = db.prepare(`
        UPDATE charges SET
          vehicle_id = ?,
          start_time = ?,
          end_time = ?,
          energy_added = ?,
          charger_power = ?,
          location = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE tessie_event_id = ?
      `);
      await updateStmt.bind(
        event.vehicle_id,
        start,
        end,
        event.energy_added,
        event.charger_power,
        location,
        event.id
      ).run();
      updated++;
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO charges (
          tessie_event_id,
          vehicle_id,
          start_time,
          end_time,
          energy_added,
          charger_power,
          location,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      await insertStmt.bind(
        event.id,
        event.vehicle_id,
        start,
        end,
        event.energy_added,
        event.charger_power,
        location
      ).run();
      inserted++;
    }
  }

  return { inserted, updated, errors };
}

/** Minimal env interface for type checking */
interface Env {
  DB: any; // D1Database binding
}
