import { Journey, JourneyMetrics } from '../types/journey';

export function calculateMetrics(journey: Journey): JourneyMetrics {
  if (!journey.startTime || !journey.endTime) {
    throw new Error('Journey start and end times are required');
  }

  const durationInHours = (journey.endTime.getTime() - journey.startTime.getTime()) / (1000 * 60 * 60);
  
  const metrics: JourneyMetrics = {
    journeyId: journey.id,
    totalDuration: durationInHours,
    averageSpeed: journey.distance ? journey.distance / durationInHours : undefined,
    caloriesBurned: calculateCaloriesBurned(journey),
    carbonEmissionsSaved: calculateCarbonEmissionsSaved(journey)
  };

  return metrics;
}

function calculateCaloriesBurned(journey: Journey): number | undefined {
  const calorieFactors = {
    'walk': 3.5,
    'bike': 7,
    'car': 0.5,
    'transit': 1.5
  };

  if (!journey.distance) return undefined;

  return journey.distance * (calorieFactors[journey.mode] || 1);
}

function calculateCarbonEmissionsSaved(journey: Journey): number | undefined {
  const carbonEmissionFactors = {
    'walk': 0,
    'bike': 0,
    'car': 0.192,  // kg CO2 per km
    'transit': 0.089  // kg CO2 per km
  };

  if (!journey.distance) return undefined;

  return journey.distance * (carbonEmissionFactors[journey.mode] || 0);
}