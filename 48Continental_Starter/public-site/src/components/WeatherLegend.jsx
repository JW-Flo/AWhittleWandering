import React from 'react';

const WeatherLegend = () => {
  return (
    <div className="weather-legend p-4 bg-white bg-opacity-80 rounded shadow-md max-w-xs">
      <h3 className="text-lg font-semibold mb-2">Weather Legend</h3>
      <ul className="list-disc list-inside text-sm">
        <li><span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span>Precipitation (Radar)</li>
        <li><span className="inline-block w-4 h-4 bg-red-500 mr-2"></span>High Temperature</li>
        <li><span className="inline-block w-4 h-4 bg-yellow-400 mr-2"></span>Moderate Temperature</li>
        <li><span className="inline-block w-4 h-4 bg-green-400 mr-2"></span>Low Temperature</li>
        <li><span className="inline-block w-4 h-4 bg-orange-600 mr-2"></span>Severe Weather Alert Zones</li>
      </ul>
    </div>
  );
};

export default WeatherLegend;
