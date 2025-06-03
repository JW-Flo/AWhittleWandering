import React, { useEffect, useState } from 'react';
import { fetchRadarOverlay, fetchTemperatureGradient, fetchWeatherAlerts } from '../dataSources/weatherService';

const WeatherOverlay = ({ map, routeCoordinates }) => {
  const [radarLayer, setRadarLayer] = useState(null);
  const [temperatureLayer, setTemperatureLayer] = useState(null);
  const [alertZones, setAlertZones] = useState([]);

  useEffect(() => {
    if (!map) return;

    // Fetch and add radar overlay
    const addRadarLayer = async () => {
      const radarData = await fetchRadarOverlay(map.getBounds().toArray().flat());
      if (radarData) {
        if (map.getLayer('radar')) {
          map.removeLayer('radar');
          map.removeSource('radar');
        }
        map.addSource('radar', {
          type: 'raster',
          tiles: radarData.tiles,
          tileSize: 256,
        });
        map.addLayer({
          id: 'radar',
          type: 'raster',
          source: 'radar',
          paint: { 'raster-opacity': 0.6 },
        });
        setRadarLayer('radar');
      }
    };

    // Fetch and add temperature gradient overlay
    const addTemperatureLayer = async () => {
      const tempData = await fetchTemperatureGradient(map.getBounds().toArray().flat());
      if (tempData) {
        if (map.getLayer('temperature')) {
          map.removeLayer('temperature');
          map.removeSource('temperature');
        }
        map.addSource('temperature', {
          type: 'raster',
          tiles: tempData.tiles,
          tileSize: 256,
        });
        map.addLayer({
          id: 'temperature',
          type: 'raster',
          source: 'temperature',
          paint: { 'raster-opacity': 0.5 },
        });
        setTemperatureLayer('temperature');
      }
    };

    // Fetch weather alerts
    const loadAlerts = async () => {
      const alerts = await fetchWeatherAlerts();
      setAlertZones(alerts);
    };

    addRadarLayer();
    addTemperatureLayer();
    loadAlerts();

    // Update overlays on map move
    map.on('moveend', () => {
      addRadarLayer();
      addTemperatureLayer();
      loadAlerts();
    });

    return () => {
      if (radarLayer && map.getLayer(radarLayer)) {
        map.removeLayer(radarLayer);
        map.removeSource(radarLayer);
      }
      if (temperatureLayer && map.getLayer(temperatureLayer)) {
        map.removeLayer(temperatureLayer);
        map.removeSource(temperatureLayer);
      }
      map.off('moveend');
    };
  }, [map]);

  // Render alert markers and route-specific weather indicators here (simplified)
  return (
    <div className="weather-overlay">
      {/* Alert zones and route weather indicators can be implemented here */}
      {alertZones.length > 0 && (
        <div className="weather-alerts">
          {alertZones.map((alert) => (
            <div key={alert.id} className="alert-item">
              <strong>{alert.properties.event}</strong>: {alert.properties.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherOverlay;
