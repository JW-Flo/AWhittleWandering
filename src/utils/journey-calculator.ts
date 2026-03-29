import { Journey, JourneyTotals } from '../types/journey';

export class JourneyCalculator {
  static calculateTotals(journeys: Journey[]): JourneyTotals {
    if (!journeys || journeys.length === 0) {
      return {
        totalDistance: 0,
        totalDuration: 0,
        averageDistance: 0,
        averageDuration: 0,
        journeyCount: 0
      };
    }

    const totalDistance = journeys.reduce((sum, journey) => sum + journey.distance, 0);
    const totalDuration = journeys.reduce((sum, journey) => sum + journey.duration, 0);
    const journeyCount = journeys.length;

    return {
      totalDistance: Number(totalDistance.toFixed(2)),
      totalDuration: Number(totalDuration.toFixed(2)),
      averageDistance: Number((totalDistance / journeyCount).toFixed(2)),
      averageDuration: Number((totalDuration / journeyCount).toFixed(2)),
      journeyCount
    };
  }

  static updateJourneyTotals(existingTotals: JourneyTotals, newJourney: Journey): JourneyTotals {
    const updatedTotals: JourneyTotals = {
      totalDistance: Number((existingTotals.totalDistance + newJourney.distance).toFixed(2)),
      totalDuration: Number((existingTotals.totalDuration + newJourney.duration).toFixed(2)),
      journeyCount: existingTotals.journeyCount + 1,
      averageDistance: 0,
      averageDuration: 0
    };

    updatedTotals.averageDistance = Number((updatedTotals.totalDistance / updatedTotals.journeyCount).toFixed(2));
    updatedTotals.averageDuration = Number((updatedTotals.totalDuration / updatedTotals.journeyCount).toFixed(2));

    return updatedTotals;
  }
}