import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DistanceChart = ({ dailyDistance = [], totalDistance = 0 }) => {
  const chartData = {
    labels: dailyDistance.map(d => d.date),
    datasets: [
      {
        label: 'Miles Driven',
        data: dailyDistance.map(d => d.distance),
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
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
  const averageDistance = dailyDistance.length
    ? dailyDistance.reduce((acc, curr) => acc + curr.distance, 0) / dailyDistance.length
    : 0;

  const maxDistance = dailyDistance.length
    ? Math.max(...dailyDistance.map(d => d.distance))
    : 0;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <h4 className="text-sm text-gray-400">Total Distance</h4>
          <p className="text-xl font-semibold">{Math.round(totalDistance)} mi</p>
        </div>
        <div className="text-center">
          <h4 className="text-sm text-gray-400">Daily Average</h4>
          <p className="text-xl font-semibold">{Math.round(averageDistance)} mi</p>
        </div>
        <div className="text-center">
          <h4 className="text-sm text-gray-400">Longest Day</h4>
          <p className="text-xl font-semibold">{Math.round(maxDistance)} mi</p>
        </div>
      </div>
    </div>
  );
};

export default DistanceChart;
