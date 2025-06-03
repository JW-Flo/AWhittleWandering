import React, { useEffect } from 'react';
import { StatesProgress } from './StatesProgress';
import { DistanceChart } from './DistanceChart';
import { EnergyChart } from './EnergyChart';
import { SpeedStats } from './SpeedStats';
import { useStatisticsState } from './useStatisticsState';

const Dashboard = () => {
  const { 
    stats, 
    updateStats,
    loadStats,
    clearStats 
  } = useStatisticsState();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* States Progress Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">States Progress</h3>
        <StatesProgress 
          visitedStates={stats.visitedStates} 
          totalStates={48} 
        />
      </div>

      {/* Distance Chart Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Distance Traveled</h3>
        <DistanceChart 
          dailyDistance={stats.dailyDistance}
          totalDistance={stats.totalDistance}
        />
      </div>

      {/* Energy Consumption Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Energy Consumption</h3>
        <EnergyChart 
          energyData={stats.energyConsumption}
          averageConsumption={stats.averageConsumption}
        />
      </div>

      {/* Speed Stats Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Speed & Time</h3>
        <SpeedStats 
          averageSpeed={stats.averageSpeed}
          drivingTimes={stats.drivingTimes}
        />
      </div>
    </div>
  );
};

export default Dashboard;
