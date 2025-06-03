/**
 * Tesla Vehicle Data Hook
 * 
 * This hook provides access to real-time Tesla vehicle data
 * including location, battery status, and driving statistics.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchVehicleData, createVehicleDataStream } from '../api/vehicleApi';

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds

/**
 * Hook for accessing Tesla vehicle data with real-time updates
 * @param {Object} options - Configuration options
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @param {boolean} options.enableStreaming - Whether to use streaming WebSocket API
 * @returns {Object} Vehicle data, loading state, error, connection status
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
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const pollTimerRef = useRef(null);
  
  // Function to fetch vehicle data from API
  const getVehicleData = useCallback(async () => {
    setVehicleLoading(true);
    
    try {
      // Call our API function
      const data = await fetchVehicleData();
      setVehicleData(data);
      setVehicleError(null);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      setVehicleError(`API Error: ${error.message}. Please check network connection and API keys.`);
    } finally {
      setVehicleLoading(false);
    }
  }, []);
  
  // Function to set up WebSocket streaming connection
  const setupStreamConnection = useCallback(() => {
    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Only set up streaming if we have vehicle data with an ID
    if (!vehicleData || !vehicleData.id) {
      console.log('No vehicle ID available for streaming setup');
      return () => {};
    }
    
    // Create a real WebSocket connection
    wsRef.current = createVehicleDataStream(
      vehicleData.id,
      // On data callback
      (streamData) => {
        setVehicleData(streamData);
        setVehicleError(null);
      },
      // On error callback
      (error) => {
        console.error('Vehicle stream error:', error);
        setVehicleError(`Stream Error: ${error.message}`);
      },
      // On status change callback
      (status) => {
        setConnectionStatus(status);
        // Clear error when reconnecting or connected
        if (status === 'connected') {
          setVehicleError(null);
        }
      }
    );
    
    // Clean up function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [vehicleData]);
  
  // Initial data fetch and connection setup
  useEffect(() => {
    // First get initial data
    getVehicleData();
    
    // Set up either WebSocket streaming or polling
    if (enableStreaming) {
      // Only set up streaming after we have initial data
      if (vehicleData) {
        const cleanup = setupStreamConnection();
        return cleanup;
      }
    } else {
      // Set up polling as fallback
      pollTimerRef.current = setInterval(getVehicleData, pollInterval);
      
      return () => {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      };
    }
  }, [getVehicleData, setupStreamConnection, pollInterval, enableStreaming, vehicleData?.id]);
  
  return { 
    vehicleData, 
    vehicleLoading, 
    vehicleError,
    connectionStatus,
    refreshVehicleData: getVehicleData,
    reconnect: useCallback(() => {
      if (enableStreaming && vehicleData?.id) {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        setupStreamConnection();
      } else {
        getVehicleData();
      }
    }, [enableStreaming, vehicleData, getVehicleData, setupStreamConnection])
  };
};
