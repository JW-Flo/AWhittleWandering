import { JourneyRecord, JourneyMetrics } from '../types/journey';

export class JourneyAggregator {
  static aggregate(journeys: JourneyRecord[]): JourneyMetrics {
    if (!journeys || journeys.length === 0) {
      return {
        totalDistance: 0,
        totalDuration: 0,
        totalEnergyConsumed: 0,
        averageEfficiency: 0,
        journeyCount: 0
      };
    }

    const totalDistance = journeys.reduce((sum, journey) => sum + journey.distance, 0);
    const totalDuration = journeys.reduce((sum, journey) => sum + journey.duration, 0);
    const totalEnergyConsumed = journeys.reduce((sum, journey) => sum + journey.energyUsed, 0);
    const journeyCount = journeys.length;

    const averageEfficiency = journeyCount > 0 
      ? (totalDistance / totalEnergyConsumed) 
      : 0;

    return {
      totalDistance: Number(totalDistance.toFixed(2)),
      totalDuration: Number(totalDuration.toFixed(2)),
      totalEnergyConsumed: Number(totalEnergyConsumed.toFixed(2)),
      averageEfficiency: Number(averageEfficiency.toFixed(2)),
      journeyCount
    };
  }

  static filterJourneysByDateRange(
    journeys: JourneyRecord[], 
    startDate?: Date, 
    endDate?: Date
  ): JourneyRecord[] {
    return journeys.filter(journey => {
      const matchesStart = !startDate || journey.timestamp >= startDate;
      const matchesEnd = !endDate || journey.timestamp <= endDate;
      return matchesStart && matchesEnd;
    });
  }
}