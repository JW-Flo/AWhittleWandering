export { default as Dashboard } from './Dashboard';
export { default as StatesProgress } from './StatesProgress';
export { default as DistanceChart } from './DistanceChart';
export { default as EnergyChart } from './EnergyChart';
export { default as SpeedStats } from './SpeedStats';

// Example usage in the website:
/*
import { Dashboard } from './components/statistics';

function TripPage() {
  return (
    <div className="trip-page">
      <h1>Trip Statistics</h1>
      <Dashboard />
    </div>
  );
}

// To update statistics programmatically:
const { 
  addVisitedState, 
  addDailyDistance,
  addEnergyConsumption,
  addDrivingTime 
} = useStatisticsState();

// Add a new state visit
addVisitedState('California');

// Add today's distance
addDailyDistance(350);

// Add energy consumption
addEnergyConsumption(75);

// Add driving time (2 hours at 14:00)
addDrivingTime(2, 14);
*/
