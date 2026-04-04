import { Journey, Charge, CanonicalEntry } from '../types';

/**
 * Recalculates totals for each journey based on imported charges and canonical table entries.
 * @param journeys - Array of journey objects to update.
 * @param charges - Array of charge records imported for the journeys.
 * @param canonicalTable - Array of canonical adjustment entries.
 * @returns New array of journey objects with recalculated totals.
 * @throws Error if required fields are missing.
 */
export function recalculateJourneyTotals(
  journeys: Journey[],
  charges: Charge[],
  canonicalTable: CanonicalEntry[]
): Journey[] {
  // Validate inputs
  if (!Array.isArray(journeys)) {
    throw new Error('journeys must be an array');
  }
  if (!Array.isArray(charges)) {
    throw new Error('charges must be an array');
  }
  if (!Array.isArray(canonicalTable)) {
    throw new Error('canonicalTable must be an array');
  }

  // Pre‑aggregate charges and canonical entries by journeyId for O(n) lookup
  const chargeTotals: Record<string, number> = {};
  const canonicalTotals: Record<string, number> = {};

  charges.forEach(charge => {
    if (!charge.journeyId || typeof charge.amount !== 'number') {
      throw new Error(`Invalid charge entry: ${JSON.stringify(charge)}`);
    }
    chargeTotals[charge.journeyId] = (chargeTotals[charge.journeyId] || 0) + charge.amount;
  });

  canonicalTable.forEach(entry => {
    if (!entry.journeyId || typeof entry.amount !== 'number') {
      throw new Error(`Invalid canonical entry: ${JSON.stringify(entry)}`);
    }
    canonicalTotals[entry.journeyId] = (canonicalTotals[entry.journeyId] || 0) + entry.amount;
  });

  // Produce updated journeys
  return journeys.map(journey => {
    if (!journey.id) {
      throw new Error(`Journey missing id: ${JSON.stringify(journey)}`);
    }
    const chargeSum = chargeTotals[journey.id] ?? 0;
    const canonicalSum = canonicalTotals[journey.id] ?? 0;
    const total = chargeSum + canonicalSum;

    // Assuming journey objects are plain and we can spread; adjust if your model uses classes
    return {
      ...journey,
      total, // Add or overwrite a total field
      // Optionally keep separate sums for debugging
      chargeSum,
      canonicalSum
    };
  });
}
