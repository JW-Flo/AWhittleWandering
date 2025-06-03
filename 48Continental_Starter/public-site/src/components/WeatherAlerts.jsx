import React from 'react';

const WeatherAlerts = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="weather-alerts fixed bottom-4 right-4 max-w-sm bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
      <h4 className="font-bold mb-2">Weather Alerts</h4>
      <ul className="list-disc list-inside text-sm max-h-48 overflow-y-auto">
        {alerts.map((alert) => (
          <li key={alert.id}>
            <strong>{alert.properties.event}</strong>: {alert.properties.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WeatherAlerts;
