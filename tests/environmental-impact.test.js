import { calculateEmissionsSaved, analyzeEnergyConsumption, calculateChargingEfficiency } from '../48Continental_Starter/public-site/src/modules/environmental-impact/calculations';

describe('Environmental Impact Calculations', () => {
  test('calculateEmissionsSaved returns correct values', () => {
    const miles = 1000;
    const kwhUsed = 280;
    const region = 'california';

    const result = calculateEmissionsSaved(miles, kwhUsed, region);

    expect(result.gasCO2).toBeCloseTo(404000);
    expect(result.evCO2).toBeCloseTo(280 * 217);
    expect(result.savedCO2).toBeCloseTo(404000 - 280 * 217);
    expect(result.percentageReduction).toBeGreaterThan(0);
  });

  test('analyzeEnergyConsumption calculates averages correctly', () => {
    const tripData = [
      { date: '2025-06-05', kwh: 50, miles: 180 },
      { date: '2025-06-06', kwh: 45, miles: 160 },
    ];

    const result = analyzeEnergyConsumption(tripData);

    expect(result.totalKwh).toBe(95);
    expect(result.totalMiles).toBe(340);
    expect(result.avgKwhPerMile).toBeCloseTo(95 / 340);
  });

  test('calculateChargingEfficiency computes efficiency by region', () => {
    const chargingData = [
      { region: 'california', kwhIn: 60, kwhOut: 55 },
      { region: 'california', kwhIn: 40, kwhOut: 38 },
    ];

    const result = calculateChargingEfficiency(chargingData);

    expect(result.california.efficiency).toBeCloseTo((55 + 38) / (60 + 40));
  });
});
