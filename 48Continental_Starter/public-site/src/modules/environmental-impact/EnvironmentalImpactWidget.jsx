import React, { useState, useEffect } from 'react';
import { calculateEmissionsSaved, analyzeEnergyConsumption, calculateChargingEfficiency } from './calculations';

const EnvironmentalImpactWidget = ({ tripData, chargingData, region }) => {
  const [emissions, setEmissions] = useState(null);
  const [energyAnalysis, setEnergyAnalysis] = useState(null);
  const [chargingEfficiency, setChargingEfficiency] = useState(null);

  useEffect(() => {
    if (tripData && tripData.length > 0) {
      const totalMiles = tripData.reduce((sum, d) => sum + d.miles, 0);
      const totalKwh = tripData.reduce((sum, d) => sum + d.kwh, 0);
      setEmissions(calculateEmissionsSaved(totalMiles, totalKwh, region));
      setEnergyAnalysis(analyzeEnergyConsumption(tripData));
    }
    if (chargingData && chargingData.length > 0) {
      setChargingEfficiency(calculateChargingEfficiency(chargingData));
    }
  }, [tripData, chargingData, region]);

  if (!emissions || !energyAnalysis) {
    return <div>Loading environmental impact data...</div>;
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Environmental Impact</h3>

      <div className="mb-4">
        <h4 className="font-semibold">CO2 Emissions Saved</h4>
        <p>{(emissions.savedCO2 / 1000).toFixed(2)} kg CO2 saved compared to gas vehicle</p>
        <p>Equivalent to planting {emissions.treesEquivalent.toFixed(2)} trees</p>
        <p>Reduction: {emissions.percentageReduction.toFixed(1)}%</p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Energy Consumption</h4>
        <p>Total Energy Used: {energyAnalysis.totalKwh.toFixed(2)} kWh</p>
        <p>Average kWh per Mile: {energyAnalysis.avgKwhPerMile.toFixed(3)}</p>
      </div>

      {chargingEfficiency && (
        <div className="mb-4">
          <h4 className="font-semibold">Charging Efficiency by Region</h4>
          <ul>
            {Object.entries(chargingEfficiency).map(([regionKey, data]) => (
              <li key={regionKey}>
                {regionKey}: {(data.efficiency * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Placeholder for shareable report button */}
      <button
        className="mt-4 px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition"
        onClick={() => alert('Shareable impact report feature coming soon!')}
      >
        Share Impact Report
      </button>
    </div>
  );
};

export default EnvironmentalImpactWidget;
