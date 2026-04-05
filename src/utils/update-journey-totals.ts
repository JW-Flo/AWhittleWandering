import { z } from 'zod';

interface Env {
  DB: D1Database;
}

/**
 * Updates aggregate journey metrics (total distance, total energy) in journey_stats.
 * Reads sum of distance from trips and sum of energy_charged from charges.
 */
export async function updateJourneyTotals(env: Env): Promise<void> {
  const { DB } = env;

  // Total distance from trips
  const distanceResult = await DB.prepare(
    `SELECT COALESCE(SUM(distance), 0) AS total_distance FROM trips WHERE distance IS NOT NULL`
  ).first();

  // Total energy from charges
  const energyResult = await DB.prepare(
    `SELECT COALESCE(SUM(energy_charged), 0) AS total_energy FROM charges WHERE energy_charged IS NOT NULL`
  ).first();

  // Validate results
  const DistanceRow = z.object({ total_distance: z.number() });
  const EnergyRow = z.object({ total_energy: z.number() });
  const distanceRow = DistanceRow.parse(distanceResult);
  const energyRow = EnergyRow.parse(energyResult);

  const totalDistance = Number(distanceRow.total_distance);
  const totalEnergy = Number(energyRow.total_energy);

  // Upsert into journey_stats as a JSON object
  const stats = { total_distance: totalDistance, total_energy: totalEnergy };

  await DB.prepare(
    `
    INSERT INTO journey_stats (key, value, updated_at)
    VALUES ('journey_totals', ?, DATETIME('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
    `
  )
    .bind(JSON.stringify(stats))
    .run();
}
