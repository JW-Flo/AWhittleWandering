import React, { useContext } from 'react';
import TeslaDataContext from '@/contexts/TeslaDataContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import VehicleStats from '@/components/VehicleStats';

export const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useContext(TeslaDataContext);

  if (isLoading) {
    return <LoadingSpinner message="Loading Tesla data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return <ErrorMessage message="No data available" />;
  }

  const { currentStatus, overview } = data;

  const chargingRaw = String(currentStatus.battery.charging || '').toLowerCase();
  const chargingState: 'charging' | 'complete' | 'disconnected' =
    chargingRaw.includes('charging') ? 'charging' :
    chargingRaw.includes('complete') ? 'complete' :
    'disconnected';

  const locationLabel = [currentStatus.location.city, currentStatus.location.state].filter(Boolean).join(', ');

  // NOTE: This dashboard intentionally only renders a subset of fields required for
  // the MVP demo. Additional panels (charging sessions, climate, route map) will be
  // mounted via lazy-loaded feature components to keep initial bundle small.
  // See contexts/TeslaDataContext for the unified data contract.

  return (
    <div className="dashboard-container">
      <h1>{overview.vehicle}</h1>
      <div className="dashboard-grid">
        <VehicleStats
          batteryLevel={currentStatus.battery.level}
          range={currentStatus.battery.range}
          chargingState={chargingState}
          odometer={currentStatus.vehicle.odometer}
          speed={currentStatus.vehicle.speed}
          temperature={currentStatus.vehicle.temperature?.outside}
          location={locationLabel}
          lastUpdate={currentStatus.location.lastUpdate}
        />
      </div>
    </div>
  );
};

export default Dashboard;
