import React, { useContext } from 'react';
import TeslaDataContext from '@/contexts/TeslaDataContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { VehicleStats } from './VehicleStats';
import { BatteryInfo } from './BatteryInfo';
import { LocationInfo } from './LocationInfo';

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

  return (
    <div className="dashboard-container">
      <h1>{overview.vehicle}</h1>
      <div className="dashboard-grid">
        <VehicleStats
          odometer={currentStatus.vehicle.odometer}
          speed={currentStatus.vehicle.speed}
          temperature={currentStatus.vehicle.temperature}
        />
        <BatteryInfo
          level={currentStatus.battery.level}
          range={currentStatus.battery.range}
          charging={currentStatus.battery.charging}
        />
        <LocationInfo
          coordinates={currentStatus.location.coordinates}
          state={currentStatus.location.state}
          city={currentStatus.location.city}
          lastUpdate={currentStatus.location.lastUpdate}
        />
      </div>
    </div>
  );
};

export default Dashboard;
