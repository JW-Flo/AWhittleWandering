// Constants for calculations specific to Tesla Model Y 2020
const GASOLINE_CO2_PER_MILE = 404; // grams CO2 per mile for average gas vehicle
const TESLA_MODEL_Y_KWH_PER_MILE = 0.28; // kWh per mile for Tesla Model Y 2020

// US grid average CO2 emissions per kWh by region (grams)
const US_GRID_CO2_PER_KWH = {
  northeast: 216,
  southeast: 408,
  midwest: 563,
  central: 497,
  northwest: 97,
  southwest: 350,
  california: 217,
  default: 417,
};

/**
 * Calculate CO2 emissions saved compared to gas vehicle
 * @param {number} miles - Total miles driven
 * @param {number} kwhUsed - Total kWh consumed
 * @param {string} region - US grid region
 * @returns {Object} Emissions data
 */
export function calculateEmissionsSaved(miles, kwhUsed, region = 'default') {
  const gasCO2 = miles * GASOLINE_CO2_PER_MILE; // grams
  const evCO2 = kwhUsed * (US_GRID_CO2_PER_KWH[region] || US_GRID_CO2_PER_KWH.default);
  const savedCO2 = gasCO2 - evCO2;

  return {
    gasCO2,
    evCO2,
    savedCO2,
    treesEquivalent: savedCO2 / 48000, // One tree absorbs ~48kg CO2 per year
    percentageReduction: ((gasCO2 - evCO2) / gasCO2) * 100,
  };
}

/**
 * Calculate energy consumption analysis
 * @param {Array<{date: string, kwh: number, miles: number}>} tripData
 * @returns {Object} Analysis results
 */
export function analyzeEnergyConsumption(tripData) {
  const totalKwh = tripData.reduce((sum, d) => sum + d.kwh, 0);
  const totalMiles = tripData.reduce((sum, d) => sum + d.miles, 0);
  const avgKwhPerMile = totalMiles > 0 ? totalKwh / totalMiles : 0;

  return {
    totalKwh,
    totalMiles,
    avgKwhPerMile,
  };
}

/**
 * Calculate charging efficiency by region
 * @param {Array<{region: string, kwhIn: number, kwhOut: number}>} chargingData
 * @returns {Object} Efficiency by region
 */
export function calculateChargingEfficiency(chargingData) {
  const efficiencyByRegion = {};

  chargingData.forEach(({ region, kwhIn, kwhOut }) => {
    if (!efficiencyByRegion[region]) {
      efficiencyByRegion[region] = { totalIn: 0, totalOut: 0 };
    }
    efficiencyByRegion[region].totalIn += kwhIn;
    efficiencyByRegion[region].totalOut += kwhOut;
  });

  Object.keys(efficiencyByRegion).forEach(region => {
    const data = efficiencyByRegion[region];
    data.efficiency = data.totalOut / data.totalIn;
  });

  return efficiencyByRegion;
}
