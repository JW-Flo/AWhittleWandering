import { ChargeRecord, ChargeInput } from '../types/charge';
import { Database } from '../database/connection';

export class ChargeRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async createCharge(input: ChargeInput): Promise<ChargeRecord> {
    try {
      const charge: ChargeRecord = {
        id: this.generateUniqueId(),
        ...input,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.db.insert('charges', charge);
      return charge;
    } catch (error) {
      console.error('Failed to create charge:', error);
      throw new Error('Charge creation failed');
    }
  }

  async updateChargeStatus(
    chargeId: string, 
    status: 'pending' | 'completed' | 'failed'
  ): Promise<ChargeRecord | null> {
    try {
      const updatedCharge = await this.db.update('charges', {
        id: chargeId,
        status,
        updatedAt: new Date()
      });

      return updatedCharge;
    } catch (error) {
      console.error('Failed to update charge status:', error);
      return null;
    }
  }

  private generateUniqueId(): string {
    return 'chrg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}';
  }
}