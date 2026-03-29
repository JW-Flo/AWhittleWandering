import { Logger } from '../../utils/logger';

interface TessieChargeData {
  timestamp: Date;
  batteryLevel: number;
  chargingStatus: 'started' | 'in_progress' | 'completed';
  energyAdded: number;
  location?: string;
}

interface TessieChargeImportOptions {
  apiKey: string;
  vehicleId: string;
}

export class TessieChargeImporter {
  private logger: Logger;

  constructor(private options: TessieChargeImportOptions) {
    this.logger = new Logger('TessieChargeImporter');
  }

  async importCharges(): Promise<TessieChargeData[]> {
    try {
      // TODO: Implement actual API call to Tessie service
      this.logger.info('Starting Tessie charge import');

      // TODO: Fetch charge data from Tessie API
      const chargeData: TessieChargeData[] = [];

      // TODO: Validate and transform charge data
      return chargeData;
    } catch (error) {
      this.logger.error('Charge import failed', error);
      throw new Error('Failed to import Tessie charges');
    }
  }

  async getLatestCharge(): Promise<TessieChargeData | null> {
    try {
      const charges = await this.importCharges();
      return charges.length > 0 ? charges[charges.length - 1] : null;
    } catch (error) {
      this.logger.warn('Could not retrieve latest charge', error);
      return null;
    }
  }
}

export default TessieChargeImporter;
