export interface MockVehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  vin: string;
  connectionProvider: string;
  isConnected: boolean;
}

export interface SettingsConfig {
  maxVehicleSlots: number;
  usedSlots: number;
}

export const mockVehicles: MockVehicle[] = [
  {
    id: "v1",
    name: "Midnight Shadow",
    model: "Tesla Model Y",
    year: 2025,
    vin: "5YJ3E1EA1PF027324",
    connectionProvider: "Tessie",
    isConnected: true,
  },
];

export const mockSettingsConfig: SettingsConfig = {
  maxVehicleSlots: 5,
  usedSlots: 1,
};
