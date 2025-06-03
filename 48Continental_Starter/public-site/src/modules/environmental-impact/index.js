export { default as EnvironmentalImpactWidget } from './EnvironmentalImpactWidget';
export * from './calculations';

// Example usage:
/*
import { EnvironmentalImpactWidget } from './modules/environmental-impact';

function ImpactPage() {
  const tripData = [
    { date: '2024-01-01', kwh: 50, miles: 180 },
    { date: '2024-01-02', kwh: 45, miles: 160 },
    // ...
  ];

  const chargingData = [
    { region: 'california', kwhIn: 60, kwhOut: 55 },
    { region: 'california', kwhIn: 40, kwhOut: 38 },
    // ...
  ];

  return (
    <div>
      <h1>Environmental Impact</h1>
      <EnvironmentalImpactWidget 
        tripData={tripData} 
        chargingData={chargingData} 
        region="california" 
      />
    </div>
  );
}
*/
