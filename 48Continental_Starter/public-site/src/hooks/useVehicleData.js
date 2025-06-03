/**
 * Tesla Vehicle Data Hook
 * 
 * This hook provides access to real-time Tesla vehicle data
 * including location, battery status, and driving statistics.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds

/**
 * Hook for accessing Tesla vehicle data
 * @param {Object} options - Configuration options
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @param {boolean} options.enableStreaming - Whether to use streaming API
 * @returns {Object} Vehicle data, loading state, and error
 */
export const useVehicleData = (options = {}) => {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    enableStreaming = true
  } = options;
  
  // State for vehicle data
  const [vehicleData, setVehicleData] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState(null);
  const [streamConnection, setStreamConnection] = useState(null);
  
  // Function to fetch vehicle data from API
  const fetchVehicleData = useCallback(async () => {
    setVehicleLoading(true);
    
    try {
      // In a real implementation, this would call your Tesla API service
      // For now, using simulated data for the prototype
      const response = await fetch('/api/vehicle');
      
      if (!response.ok) {
        throw new Error(`Vehicle API error: ${response.status}`);
      }
      
      const data = await response.json();
      setVehicleData(data);
      setVehicleError(null);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      setVehicleError(error.message);
      
      // If we don't have data yet, use simulated data
      if (!vehicleData) {
        setVehicleData(generateSimulatedVehicleData());
      }
    } finally {
      setVehicleLoading(false);
    }
  }, [vehicleData]);
  
  // Function to set up streaming connection
  const setupStreamConnection = useCallback(() => {
    // In a real implementation, this would set up a WebSocket or EventSource
    // For the prototype, we'll simulate real-time updates with setInterval
    
    if (streamConnection) {
      clearInterval(streamConnection);
    }
    
    const streamTimer = setInterval(() => {
      // Update vehicle data with simulated changes
      setVehicleData(prevData => {
        if (!prevData) return generateSimulatedVehicleData();
        
        // Simulate vehicle movement
        const latChange = (Math.random() - 0.5) * 0.01;
        const lngChange = (Math.random() - 0.5) * 0.01;
        
        // Simulate battery discharge
        const batteryChange = Math.random() * 0.1;
        
        // Simulate speed changes
        const speedChange = (Math.random() - 0.5) * 5;
        
        return {
          ...prevData,
          latitude: prevData.latitude + latChange,
          longitude: prevData.longitude + lngChange,
          batteryLevel: Math.max(0, Math.min(100, prevData.batteryLevel - batteryChange)),
          range: Math.max(0, prevData.range - (batteryChange * 3)),
          speed: Math.max(0, prevData.speed + speedChange)
        };
      });
    }, 5000); // Update every 5 seconds
    
    setStreamConnection(streamTimer);
    
    // Clean up function
    return () => {
      if (streamTimer) {
        clearInterval(streamTimer);
      }
    };
  }, [streamConnection]);
  
  // Initial data fetch
  useEffect(() => {
    fetchVehicleData();
    
    // Set up polling or streaming
    if (enableStreaming) {
      const cleanup = setupStreamConnection();
      return cleanup;
    } else {
      // Set up polling as fallback
      const pollTimer = setInterval(fetchVehicleData, pollInterval);
      
      return () => {
        clearInterval(pollTimer);
      };
    }
  }, [fetchVehicleData, setupStreamConnection, pollInterval, enableStreaming]);
  
  return { 
    vehicleData, 
    vehicleLoading, 
    vehicleError,
    refreshVehicleData: fetchVehicleData
  };
};

/**
 * Generate simulated vehicle data for testing
 * @returns {Object} Simulated vehicle data
 */
function generateSimulatedVehicleData() {
  return {
    id: 'tesla_model_3_2025',
    name: 'Tesla Model 3',
    model: 'model3',
    year: 2025,
    latitude: 39.8283 + (Math.random() - 0.5) * 0.1,
    longitude: -98.5795 + (Math.random() - 0.5) * 0.1,
    batteryLevel: 70 + (Math.random() * 20),
    range: 250 + (Math.random() * 50),
    speed: Math.random() * 70,
    power: Math.random() * 40,
    temperature: {
      inside: 68 + (Math.random() * 10),
      outside: 65 + (Math.random() * 15)
    },
    charging: false,
    climate: {
      enabled: true,
      temperature: 72
    },
    locked: true,
    sentry_mode: true,
    windows_open: false,
    doors_open: false,
    tire_pressure: {
      front_left: 45 + (Math.random() * 3),
      front_right: 45 + (Math.random() * 3),
      rear_left: 45 + (Math.random() * 3),
      rear_right: 45 + (Math.random() * 3)
    },
    last_updated: new Date().toISOString()
  };
}
