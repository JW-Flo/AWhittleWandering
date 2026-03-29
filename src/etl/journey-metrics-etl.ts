import { Database } from '../config/database';
import { JourneyRepository } from '../repositories/journey-repository';
import { JourneyMetricsService } from '../services/journey-metrics-service';

export class JourneyMetricsETL {
  private db: Database;
  private journeyRepository: JourneyRepository;
  private metricsService: JourneyMetricsService;

  constructor(db: Database) {
    this.db = db;
    this.journeyRepository = new JourneyRepository(db);
    this.metricsService = new JourneyMetricsService(this.journeyRepository);
  }

  async processUserMetrics(userId: string): Promise<void> {
    try {
      const metrics = await this.metricsService.calculateUserMetrics(userId);
      
      await this.db.collection('user_metrics').updateOne(
        { userId: metrics.userId },
        { $set: metrics },
        { upsert: true }
      );

      console.log('Metrics processed for user ${userId}');
    } catch (error) {
      console.error('Metrics processing failed for user ${userId}', error);
    }
  }

  async runBatchETL(): Promise<void> {
    try {
      const users = await this.db.collection('users').distinct('_id');
      
      for (const userId of users) {
        await this.processUserMetrics(userId);
      }

      console.log('Batch ETL process completed');
    } catch (error) {
      console.error('Batch ETL process failed', error);
    }
  }
}