import { Journey } from '../types/journey';
import { Database } from '../config/database';

export class JourneyRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async saveJourney(journey: Journey): Promise<void> {
    try {
      await this.db.collection('journeys').insertOne(journey);
    } catch (error) {
      console.error('Failed to save journey', error);
      throw new Error('Journey save failed');
    }
  }

  async getJourneysByUser(userId: string): Promise<Journey[]> {
    try {
      return await this.db.collection('journeys')
        .find({ userId })
        .toArray();
    } catch (error) {
      console.error('Failed to retrieve journeys', error);
      return [];
    }
  }
}