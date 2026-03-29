import { RawJourneyData, AggregatedJourneyMetrics } from '../types/journey';

export class JourneyAggregator {
  static aggregate(journeys: RawJourneyData[]): AggregatedJourneyMetrics {
    if (!journeys || journeys.length === 0) {
      return this.getEmptyMetrics();
    }

    const aggregatedMetrics: AggregatedJourneyMetrics = {
      totalDistance: this.calculateTotalDistance(journeys),
      totalDuration: this.calculateTotalDuration(journeys),
      averageSpeed: this.calculateAverageSpeed(journeys),
      totalElevationGain: this.calculateTotalElevationGain(journeys),
      totalCaloriesBurned: this.calculateTotalCaloriesBurned(journeys),
      journeyCount: journeys.length
    };

    return aggregatedMetrics;
  }

  private static calculateTotalDistance(journeys: RawJourneyData[]): number {
    return journeys.reduce((total, journey) => total + journey.distance, 0);
  }

  private static calculateTotalDuration(journeys: RawJourneyData[]): number {
    return journeys.reduce((total, journey) => total + journey.duration, 0);
  }

  private static calculateAverageSpeed(journeys: RawJourneyData[]): number {
    const totalDistance = this.calculateTotalDistance(journeys);
    const totalDuration = this.calculateTotalDuration(journeys);
    return totalDuration > 0 ? totalDistance / totalDuration : 0;
  }

  private static calculateTotalElevationGain(journeys: RawJourneyData[]): number {
    return journeys.reduce((total, journey) => total + journey.elevationGain, 0);
  }

  private static calculateTotalCaloriesBurned(journeys: RawJourneyData[]): number {
    return journeys.reduce((total, journey) => total + journey.caloriesBurned, 0);
  }

  private static getEmptyMetrics(): AggregatedJourneyMetrics {
    return {
      totalDistance: 0,
      totalDuration: 0,
      averageSpeed: 0,
      totalElevationGain: 0,
      totalCaloriesBurned: 0,
      journeyCount: 0
    };
  }
}