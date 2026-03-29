import { ChargingSessionImportService } from './services/ChargingSessionImportService';
import { ChargingSessionRepository } from './repositories/ChargingSessionRepository';
import { ChargingSessionImportRecord } from './models/ChargingSession';

async function importChargingData(importRecords: ChargingSessionImportRecord[]) {
    const importService = new ChargingSessionImportService();
    const repository = new ChargingSessionRepository();

    try {
        const validSessions = ChargingSessionImportService.importChargingSessions(importRecords);
        await repository.saveSessions(validSessions);
        console.log('Imported ${validSessions.length} charging sessions');
    } catch (error) {
        console.error('Error importing charging sessions:', error);
    }
}

export { importChargingData };