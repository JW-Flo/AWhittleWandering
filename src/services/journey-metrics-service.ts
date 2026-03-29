import { Journey, JourneyMetrics } from '../types/journey';
import { JourneyRepository } from '../repositories/journey-repository';

export class JourneyMetricsService {
  private journeyRepository: JourneyRepository;

  constructor(journeyRepository: JourneyRepository) {
    this.journeyRepository = journeyRepository;
  }

  async calculateUserMetrics(userId: string): Promise<JourneyMetrics> {
    try {
      const journeys = await this.journeyRepository.getJourneysByUser(userId);
      
      if (journeys.length === 0) {
        return this.createEmptyMetrics(userId);
      }

      return {
        userId,
        totalJourneys: journeys.length,
        totalDistance: this.calculateTotalDistance(journeys),
        averageDistance: this.calculateAverageDistance(journeys),
        mostFrequentMode: this.calculateMostFrequentMode(journeys),
        totalCaloriesBurned: this.calculateTotalCalories(journeys),
        totalCarbonEmissionReduced: this.calculateTotalCarbonEmission(journeys),
        dateCalculated: new Date()
      };
    } catch (error) {
      console.error('Metrics calculation failed', error);
      return this.createEmptyMetrics(userId);
    }
  }

  private calculateTotalDistance(journeys: Journey[]): number {
    return journeys.reduce((total, journey) => total + journey.distance, 0);
  }

  private calculateAverageDistance(journeys: Journey[]): number {
    return this.calculateTotalDistance(journeys) / journeys.length;
  }

  private calculateMostFrequentMode(journeys: Journey[]): string {
    const modeCounts = journeys.reduce((counts, journey) => {
      counts[journey.mode] = (counts[journey.mode] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(modeCounts).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0];
  }

  private calculateTotalCalories(journeys: Journey[]): number {
    return journeys.reduce((total, journey) => total + journey.calories, 0);
  }

  private calculateTotalCarbonEmission(journeys: Journey[]): number {
    return journeys.reduce((total, journey) => total + journey.carbonEmission, 0);
  }

  private createEmptyMetrics(userId: string): JourneyMetrics {
    return {
      userId,
      totalJourneys: 0,
      totalDistance: 0,
      averageDistance: 0,
      mostFrequentMode: 'N/A',
      totalCaloriesBurned: 0,
      totalCarbonEmissionReduced: 0,
      dateCalculated: new Date()
    };
  }
}