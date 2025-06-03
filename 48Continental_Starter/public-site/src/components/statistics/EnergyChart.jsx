import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EnergyChart = ({ energyData = [], averageConsumption = 0 }) => {
  const chartData = {
    labels: energyData.map(d => d.date),
    datasets: [
      {
        label: 'kWh Used',
        data: energyData.map(d => d.consumption),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
  };

  // Calculate statistics
  const totalEnergy = energyData.reduce((acc, curr) => acc + curr.consumption, 0);
  const maxConsumption = Math.max(...energyData.map(d => d.consumption));
  const efficiency = energyData.length ? (totalEnergy / energyData.length).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <h4 className="text-sm text-gray-400">Total Energy</h4>
          <p className="text-xl font-semibold">{Math.round(totalEnergy)} kWh</p>
        </div>
        <div className="text-center">
          <h4 className="text-sm text-gray-400">Average/Day</h4>
          <p className="text-xl font-semibold">{efficiency} kWh</p>
        </div>
        <div className="text-center">
          <h4 className="text-sm text-gray-400">Peak Usage</h4>
          <p className="text-xl font-semibold">{Math.round(maxConsumption)} kWh</p>
        </div>
      </div>

      {/* Efficiency Indicator */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Efficiency Rating</span>
          <span className="text-sm font-semibold">
            {averageConsumption < 300 ? 'Excellent' : 
             averageConsumption < 400 ? 'Good' : 
             averageConsumption < 500 ? 'Average' : 'High Usage'}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min(100, (averageConsumption / 500) * 100)}%`,
              backgroundColor: averageConsumption < 300 ? '#22c55e' : 
                             averageConsumption < 400 ? '#eab308' : 
                             averageConsumption < 500 ? '#f97316' : '#ef4444'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnergyChart;
