import { Journey, JourneyMetrics } from '../types/journey';
import { calculateMetrics } from '../utils/metricCalculator';
import { JourneyRepository } from '../repositories/journeyRepository';

export class JourneyService {
  private journeyRepository: JourneyRepository;

  constructor(journeyRepository: JourneyRepository) {
    this.journeyRepository = journeyRepository;
  }

  async createJourney(journey: Omit<Journey, 'id' | 'status'>): Promise<Journey> {
    const newJourney: Journey = {
      id: this.generateUniqueId(),
      status: 'in-progress',
      ...journey
    };
    return this.journeyRepository.save(newJourney);
  }

  async completeJourney(journeyId: string, endDetails: Partial<Journey>): Promise<Journey> {
    const journey = await this.journeyRepository.findById(journeyId);
    
    if (!journey) {
      throw new Error('Journey not found');
    }

    const completedJourney: Journey = {
      ...journey,
      ...endDetails,
      status: 'completed',
      endTime: new Date()
    };

    const metrics = calculateMetrics(completedJourney);
    await this.saveJourneyMetrics(metrics);

    return this.journeyRepository.update(completedJourney);
  }

  async saveJourneyMetrics(metrics: JourneyMetrics): Promise<JourneyMetrics> {
    return this.journeyRepository.saveMetrics(metrics);
  }

  private generateUniqueId(): string {
    return 'journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}';
  }
}