import { Journey } from '../../types/journey';

export interface JourneyTotals {
  totalDistance: number;
  totalDuration: number;
  averageEfficiency: number;
  energyConsumed: number;
}

export class TessieJourneyTotals {
  /**
   * Aggregates journey data into comprehensive totals
   * @param journeys Array of journey records
   * @returns Calculated journey totals
   */
  static calculateTotals(journeys: Journey[]): JourneyTotals {
    // TODO: Handle empty journey array
    if (journeys.length === 0) {
      return {
        totalDistance: 0,
        totalDuration: 0,
        averageEfficiency: 0,
        energyConsumed: 0
      };
    }

    // TODO: Implement robust aggregation with error handling
    const totals = journeys.reduce((acc, journey) => {
      acc.totalDistance += journey.distance || 0;
      acc.totalDuration += journey.duration || 0;
      acc.energyConsumed += journey.energyUsed || 0;
      return acc;
    }, {
      totalDistance: 0,
      totalDuration: 0,
      averageEfficiency: 0,
      energyConsumed: 0
    });

    // Calculate average efficiency
    totals.averageEfficiency = totals.totalDistance > 0 
      ? (totals.totalDistance / totals.energyConsumed) 
      : 0;

    return totals;
  }
}
