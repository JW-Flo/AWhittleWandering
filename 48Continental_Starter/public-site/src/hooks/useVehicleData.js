/**
 * Custom hook for real-time vehicle data
 * 
 * This hook provides real-time Tesla vehicle data through the Tessie API,
 * handling connection management, data transformation, and error states.
 * Now with robust fallback to mock data to ensure display even when APIs fail.
 */

/* eslint-env browser */

import { useState, useEffect } from 'react';
import { fetchVehicleData, createVehicleDataStream } from '../api/vehicleApi';
import { mockVehicleData } from '../mockData';

/**
 * Hook for real-time vehicle data with WebSocket streaming
 * @param {string} vehicleId - The vehicle ID to get data for
 * @returns {Object} Vehicle data, loading state, error state, and connection status
 */
export const useVehicleData = (vehicleId) => {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [useMockData, setUseMockData] = useState(false);
  
  useEffect(() => {
    let dataStream = null;
    let mockDataTimeout = null;
    
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const data = await fetchVehicleData();
        setVehicleData(data);
        setError(null);
        setUseMockData(false);
      } catch (err) {
        console.error('Error fetching initial vehicle data:', err);
        setError(err.message);
        
        // Fallback to mock data when real data fails
        console.log('Falling back to mock vehicle data');
        setVehicleData(mockVehicleData);
        setUseMockData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Set a timeout to fallback to mock data if data loading takes too long
    mockDataTimeout = setTimeout(() => {
      if (loading && !vehicleData) {
        console.log('Data loading timeout, using mock vehicle data');
        setVehicleData(mockVehicleData);
        setUseMockData(true);
        setLoading(false);
        setConnectionStatus('offline');
      }
    }, 5000); // 5 second timeout
    
    // Only attempt real-time data stream if not using mock data
    if (!useMockData) {
      dataStream = createVehicleDataStream(
        vehicleId,
        (data) => {
          setVehicleData(data);
          setLoading(false);
          setUseMockData(false);
        },
        (err) => {
          console.error('WebSocket error:', err);
          setError(err.message);
          
          // Fallback to mock data on WebSocket error if we don't already have data
          if (!vehicleData) {
            console.log('WebSocket error, using mock vehicle data');
            setVehicleData(mockVehicleData);
            setUseMockData(true);
          }
        },
        (status) => {
          setConnectionStatus(status);
          
          // If disconnected and we don't have data, use mock data
          if (status === 'disconnected' && !vehicleData) {
            console.log('Connection disconnected, using mock vehicle data');
            setVehicleData(mockVehicleData);
            setUseMockData(true);
          }
        }
      );
    }
    
    // Cleanup
    return () => {
      if (dataStream) {
        dataStream.close();
      }
      if (mockDataTimeout) {
        clearTimeout(mockDataTimeout);
      }
    };
  }, [vehicleId, useMockData]);
  
  return {
    vehicleData,
    loading,
    error,
    connectionStatus: useMockData ? 'offline' : connectionStatus,
    isConnected: connectionStatus === 'connected' && !useMockData,
    isMockData: useMockData
  };
};

export default useVehicleData;
