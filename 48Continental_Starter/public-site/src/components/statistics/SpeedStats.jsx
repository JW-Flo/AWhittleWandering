import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const SpeedStats = ({ averageSpeed = 0, drivingTimes = [] }) => {
  // Calculate time distributions
  const totalHours = drivingTimes.reduce((acc, curr) => acc + curr.duration, 0);
  const timeDistribution = {
    morning: drivingTimes.filter(t => t.hour >= 6 && t.hour < 12).length,
    afternoon: drivingTimes.filter(t => t.hour >= 12 && t.hour < 18).length,
    evening: drivingTimes.filter(t => t.hour >= 18 && t.hour < 22).length,
    night: drivingTimes.filter(t => t.hour >= 22 || t.hour < 6).length,
  };

  const chartData = {
    labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
    datasets: [
      {
        data: [
          timeDistribution.morning,
          timeDistribution.afternoon,
          timeDistribution.evening,
          timeDistribution.night,
        ],
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)',  // yellow-400
          'rgba(59, 130, 246, 0.8)',   // blue-500
          'rgba(139, 92, 246, 0.8)',   // purple-500
          'rgba(55, 65, 81, 0.8)',     // gray-700
        ],
        borderColor: [
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(55, 65, 81)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Speed Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm text-gray-400">Average Speed</h4>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold">{Math.round(averageSpeed)}</span>
            <span className="text-sm text-gray-400">mph</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm text-gray-400">Total Drive Time</h4>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold">{Math.round(totalHours)}</span>
            <span className="text-sm text-gray-400">hours</span>
          </div>
        </div>
      </div>

      {/* Driving Time Distribution Chart */}
      <div className="h-64">
        <Doughnut data={chartData} options={options} />
      </div>

      {/* Time Distribution Legend */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
          <span>Morning (6AM-12PM)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>Afternoon (12PM-6PM)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
          <span>Evening (6PM-10PM)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-gray-700"></span>
          <span>Night (10PM-6AM)</span>
        </div>
      </div>
    </div>
  );
};

export default SpeedStats;
