/**
 * useVehicleData - Hook for real vehicle data from Tessie API.
 * 
 * Fetches vehicle data from the backend API and optionally sets up WebSocket streaming.
 * Falls back to polling if WebSocket is not available.
 * 
 * Usage:
 *   const { vehicleData, loading, error, connectionStatus } = useVehicleData({ enableStreaming: true });
 */

/* eslint-env browser */
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchVehicleData, createVehicleDataStream, generateSimulatedVehicleData } from '../api/vehicleApi';

const useVehicleData = (options = {}) => {
  const { 
    enableStreaming = true, 
    pollInterval = 30000,
    useSimulated = false 
  } = options;
  
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const streamControllerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      if (useSimulated) {
        // Use simulated data for testing
        const simulatedData = generateSimulatedVehicleData();
        setVehicleData(simulatedData);
        setLoading(false);
        setConnectionStatus('connected');
        return;
      }
      
      // Fetch real data from API
      const data = await fetchVehicleData();
      setVehicleData(data);
      setLoading(false);
      
      // Update connection status based on data freshness
      if (data && data.last_updated) {
        const dataAge = Date.now() - new Date(data.last_updated).getTime();
        if (dataAge < 60000) { // Less than 1 minute old
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('degraded');
        }
      }
    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError(err.message || 'Failed to fetch vehicle data');
      setLoading(false);
      setConnectionStatus('failed');
      
      // If it's a configuration error, don't retry
      if (err.message && err.message.includes('Configuration error')) {
        return;
      }
      
      // Try simulated data as fallback
      if (!useSimulated) {
        console.log('Falling back to simulated data');
        const simulatedData = generateSimulatedVehicleData();
        setVehicleData(simulatedData);
        setConnectionStatus('simulated');
      }
    }
  }, [useSimulated]);

  // Set up WebSocket streaming if enabled
  useEffect(() => {
    if (!enableStreaming || useSimulated) return;
    
    const vehicleId = import.meta.env.VITE_TESSIE_VIN;
    if (!vehicleId) {
      console.warn('No vehicle ID configured for streaming');
      return;
    }
    
    // Set up WebSocket connection
    const setupStream = () => {
      try {
        streamControllerRef.current = createVehicleDataStream(
          vehicleId,
          // onData callback
          (data) => {
            setVehicleData(data);
            setError(null);
          },
          // onError callback
          (error) => {
            console.error('WebSocket error:', error);
            setError(error.message);
          },
          // onStatusChange callback
          (status) => {
            setConnectionStatus(status);
          }
        );
      } catch (err) {
        console.error('Failed to create WebSocket stream:', err);
        // Fall back to polling
      }
    };
    
    // Initial setup
    setupStream();
    
    // Cleanup
    return () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.close();
        streamControllerRef.current = null;
      }
    };
  }, [enableStreaming, useSimulated]);

  // Set up polling as fallback or primary method
  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Set up polling interval
    if (pollInterval > 0) {
      pollIntervalRef.current = setInterval(fetchData, pollInterval);
    }
    
    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [fetchData, pollInterval]);

  // Retry function for manual retry
  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchData();
    
    // If streaming, try to reconnect
    if (enableStreaming && streamControllerRef.current) {
      streamControllerRef.current.reconnect();
    }
  }, [fetchData, enableStreaming]);

  return { 
    vehicleData, 
    loading, 
    error, 
    connectionStatus,
    retry,
    isSimulated: connectionStatus === 'simulated'
  };
};

export default useVehicleData;
