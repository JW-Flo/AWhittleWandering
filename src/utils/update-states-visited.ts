import { z } from 'zod';

interface Env {
  DB: D1Database;
}

/**
 * Updates the list of visited states in the journey_stats table.
 * Reads distinct states from the trips table and persists them as JSON.
 */
export async function updateStatesVisited(env: Env): Promise<void> {
  const { DB } = env;

  // Fetch distinct non-null states from trips
  const statesResult = await DB.prepare(
    `SELECT DISTINCT state FROM trips WHERE state IS NOT NULL AND state <> ''`
  ).all();

  // Validate rows
  const StatesArray = z.array(z.object({ state: z.string().nullable() }));
  const statesRows = StatesArray.parse(statesResult.results);

  // Extract string values, filter out nulls/empty
  const states = statesRows
    .map((row) => row.state)
    .filter((s): s is string => s !== null && s !== '')
    .sort(); // optional: sort for consistency

  // Upsert into journey_stats
  await DB.prepare(
    `
    INSERT INTO journey_stats (key, value, updated_at)
    VALUES ('states_visited', ?, DATETIME('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
    `
  )
    .bind(JSON.stringify(states))
    .run();
}
