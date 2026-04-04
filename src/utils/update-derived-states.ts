import { Knex } from 'knex';

/**
 * Updates derived tables `states_visited` and `journey_totals`
 * based on data from canonical tables.
 *
 * @param knex - Knex instance configured for the database.
 */
export async function updateDerivedStates(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    // --- Update states_visited ---
    const statesVisited = await trx('places')
      .select('user_id', 'state')
      .count('* as visits_count')
      .max('visited_at as last_visited')
      .groupBy('user_id', 'state');

    for (const row of statesVisited) {
      await trx('states_visited')
        .insert({
          user_id: row.user_id,
          state: row.state,
          visits_count: Number(row.visits_count) || 0,
          last_visited: row.last_visited ?? null,
        })
        .onConflict(['user_id', 'state'])
        .merge({
          visits_count: trx.raw('EXCLUDED.visits_count'),
          last_visited: trx.raw('EXCLUDED.last_visited'),
        });
    }

    // --- Update journey_totals ---
    const journeyTotals = await trx('trips')
      .select('user_id')
      .sum('distance as total_distance')
      .sum('duration as total_duration')
      .count('* as trip_count')
      .groupBy('user_id');

    for (const row of journeyTotals) {
      await trx('journey_totals')
        .insert({
          user_id: row.user_id,
          total_distance: Number(row.total_distance) || 0,
          total_duration: Number(row.total_duration) || 0,
          trip_count: Number(row.trip_count) || 0,
        })
        .onConflict(['user_id'])
        .merge({
          total_distance: trx.raw('EXCLUDED.total_distance'),
          total_duration: trx.raw('EXCLUDED.total_duration'),
          trip_count: trx.raw('EXCLUDED.trip_count'),
        });
    }
  });
}
