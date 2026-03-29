import { Journey, JourneyMetrics } from '../types/journey';

export class JourneyRepository {
  private journeys: Map<string, Journey> = new Map();
  private journeyMetrics: Map<string, JourneyMetrics> = new Map();

  async save(journey: Journey): Promise<Journey> {
    this.journeys.set(journey.id, journey);
    return journey;
  }

  async findById(journeyId: string): Promise<Journey | undefined> {
    return this.journeys.get(journeyId);
  }

  async update(journey: Journey): Promise<Journey> {
    this.journeys.set(journey.id, journey);
    return journey;
  }

  async saveMetrics(metrics: JourneyMetrics): Promise<JourneyMetrics> {
    this.journeyMetrics.set(metrics.journeyId, metrics);
    return metrics;
  }

  async getMetricsByJourneyId(journeyId: string): Promise<JourneyMetrics | undefined> {
    return this.journeyMetrics.get(journeyId);
  }
}