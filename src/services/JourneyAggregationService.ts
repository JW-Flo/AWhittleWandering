import { Journey } from '../models/Journey';

export class JourneyAggregationService {
  static computeJourneyStatistics(journeys: Journey[]): JourneyStatistics {
    if (!journeys || journeys.length === 0) {
      throw new Error('No journeys provided for aggregation');
    }

    return {
      totalJourneys: journeys.length,
      totalDistance: this.calculateTotalDistance(journeys),
      averageJourneyDistance: this.calculateAverageDistance(journeys),
      longestJourney: this.findLongestJourney(journeys),
      shortestJourney: this.findShortestJourney(journeys)
    };
  }

  private static calculateTotalDistance(journeys: Journey[]): number {
    return journeys.reduce((total, journey) => total + journey.distance, 0);
  }

  private static calculateAverageDistance(journeys: Journey[]): number {
    const totalDistance = this.calculateTotalDistance(journeys);
    return totalDistance / journeys.length;
  }

  private static findLongestJourney(journeys: Journey[]): Journey {
    return journeys.reduce((longest, current) => 
      (current.distance > longest.distance) ? current : longest
    );
  }

  private static findShortestJourney(journeys: Journey[]): Journey {
    return journeys.reduce((shortest, current) => 
      (current.distance < shortest.distance) ? current : shortest
    );
  }
}

export interface JourneyStatistics {
  totalJourneys: number;
  totalDistance: number;
  averageJourneyDistance: number;
  longestJourney: Journey;
  shortestJourney: Journey;
}