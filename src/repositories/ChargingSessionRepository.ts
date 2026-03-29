import { ChargingSession } from '../models/ChargingSession';

export class ChargingSessionRepository {
    private sessions: ChargingSession[] = [];

    async saveSession(session: ChargingSession): Promise<ChargingSession> {
        const savedSession = { ...session, id: session.id || crypto.randomUUID() };
        this.sessions.push(savedSession);
        return savedSession;
    }

    async saveSessions(sessions: ChargingSession[]): Promise<ChargingSession[]> {
        return Promise.all(sessions.map(session => this.saveSession(session)));
    }

    async getSessionsByVehicle(vehicleId: string): Promise<ChargingSession[]> {
        return this.sessions.filter(session => session.vehicleId === vehicleId);
    }
}