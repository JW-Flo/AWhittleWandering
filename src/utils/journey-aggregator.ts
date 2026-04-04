import { z } from 'zod';

// Journey data type definition
export const JourneyDataSchema = z.object({
  id: z.string(),
  distance: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  startDate: z.date(),
  endDate: z.date(),
  locations: z.array(z.object({
    name: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
  })),
});

export type JourneyData = z.infer<typeof JourneyDataSchema>;

// Journey aggregation result type
export interface JourneyTotals {
  totalDistance: number;
  totalDuration: number;
  journeyCount: number;
  earliestStartDate: Date | null;
  latestEndDate: Date | null;
}

/**
 * Aggregates journey data into summary totals
 * @param journeys Array of journey data to aggregate
 * @returns Comprehensive journey totals
 */
export function aggregateJourneyTotals(journeys: JourneyData[]): JourneyTotals {
  // Validate input
  if (!Array.isArray(journeys)) {
    throw new Error('Input must be an array of journey data');
  }

  // TODO: Add more robust input validation
  const validJourneys = journeys.filter(journey => {
    try {
      JourneyDataSchema.parse(journey);
      return true;
    } catch {
      return false;
    }
  });

  // Compute aggregations
  const totals: JourneyTotals = {
    totalDistance: validJourneys.reduce((sum, journey) => sum + journey.distance, 0),
    totalDuration: validJourneys.reduce((sum, journey) => sum + journey.duration, 0),
    journeyCount: validJourneys.length,
    earliestStartDate: validJourneys.length > 0 
      ? validJourneys.reduce((earliest, journey) => 
          journey.startDate < earliest ? journey.startDate : earliest, 
          validJourneys[0].startDate
        )
      : null,
    latestEndDate: validJourneys.length > 0
      ? validJourneys.reduce((latest, journey) => 
          journey.endDate > latest ? journey.endDate : latest, 
          validJourneys[0].endDate
        )
      : null,
  };

  return totals;
}
