/**
 * useVehicleData - Hook for real vehicle data streaming from Tessie API.
 * 
 * Connects to the Tessie API WebSocket endpoint to receive real-time telemetry data.
 * 
 * Usage:
 *   const { vehicleData, loading, error, connectionStatus } = useVehicleData(vehicleId);
 * 
 * Environment Variables:
 *   VITE_TESSIE_API_TOKEN - Tessie API token for authentication.
 * 
 * Example:
 *   const vin = "LRW3F7FR9NC123456";
 *   const { vehicleData } = useVehicleData(vin);
 */

/* eslint-env browser */
import { useState, useEffect } from 'react';

const useVehicleData = (vehicleId) => {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  // Since we use real data, mock flag is false
  const isMockData = false;

  useEffect(() => {
    if (!vehicleId) {
      setError('Vehicle ID is required');
      setLoading(false);
      return;
    }
    
    const token = import.meta.env.VITE_TESSIE_API_TOKEN;
    if (!token) {
      setError('Tessie API token is missing');
      setLoading(false);
      return;
    }
    
    // Construct the WebSocket URL for Tessie API real-time streaming.
    const wsUrl = `wss://streaming.tessie.com/${vehicleId}?access_token=${token}`;
    const ws = new WebSocket(wsUrl);
    setConnectionStatus('CONNECTING');

    ws.onopen = () => {
      setConnectionStatus('CONNECTED');
      setLoading(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.data) {
          // Process the telemetry data as needed, such as extracting:
          // - Soc (State of Charge)
          // - Location (latitude and longitude)
          // - Other metrics: PackVoltage, Odometer, etc.
          setVehicleData(data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
      setConnectionStatus('ERROR');
    };

    ws.onclose = () => {
      setConnectionStatus('DISCONNECTED');
    };

    return () => {
      ws.close();
    };
  }, [vehicleId]);

  return { vehicleData, loading, error, connectionStatus, isMockData };
};

export default useVehicleData;
