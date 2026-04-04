import { prisma } from '@/lib/prisma';

export type TessieChargeEvent = {
  id: string;
  user_id: string;
  vehicle_id: string;
  timestamp: string;
  end_timestamp?: string;
  energy_added?: number;
  charger_power?: number;
  charger_voltage?: number;
  charger_actual_current?: number;
  battery_level?: number;
  battery_range?: number;
  charge_limit_soc?: number;
  charge_rate?: number;
};

export async function importCharges(rawEvents: TessieChargeEvent[]): Promise<void> {
  for (const event of rawEvents) {
    try {
      const startedAt = new Date(event.timestamp);
      const endedAt = event.end_timestamp ? new Date(event.end_timestamp) : null;
      const energyAddedKwh = (event.energy_added ?? 0) / 1000; // Wh to kWh
      const averagePowerKw = (event.charger_power ?? 0) / 1000; // W to kW

      await prisma.charge.upsert({
        where: { id: event.id },
        update: {
          userId: event.user_id,
          vehicleId: event.vehicle_id,
          startedAt,
          endedAt,
          energyAddedKwh,
          averagePowerKw,
          cost: null,
          location: null,
          chargingState: 'completed',
        },
        create: {
          id: event.id,
          userId: event.user_id,
          vehicleId: event.vehicle_id,
          startedAt,
          endedAt,
          energyAddedKwh,
          averagePowerKw,
          cost: null,
          location: null,
          chargingState: 'completed',
        },
      });
    } catch (error) {
      console.error(`Failed to import charge event ${event.id}:`, error);
    }
  }
}
