/**
 * Charging Stations Hook
 * 
 * This hook provides access to nearby charging stations data
 * based on vehicle location or specified coordinates.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { fetchChargingStations, generateSimulatedChargingStations } from '../api';

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 300000; // 5 minutes

/**
 * Hook for accessing charging stations data
 * @param {Object} options - Configuration options
 * @param {number} options.latitude - Latitude to search around
 * @param {number} options.longitude - Longitude to search around
 * @param {number} options.radius - Search radius in miles
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @returns {Object} Charging stations data, loading state, and error
 */
export const useChargingStations = (options = {}) => {
  const {
    latitude = null,
    longitude = null,
    radius = 50,
    pollInterval = DEFAULT_POLL_INTERVAL
  } = options;
  
  // State for charging stations data
  const [stationsData, setStationsData] = useState(null);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState(null);
  
  // Function to fetch charging stations data from API
  const getChargingStations = useCallback(async () => {
    // Skip if no location provided
    if (latitude === null || longitude === null) {
      setStationsData(null);
      setStationsLoading(false);
      return;
    }
    
    setStationsLoading(true);
    
    try {
      // Call our API function
      const data = await fetchChargingStations(latitude, longitude, radius);
      setStationsData(data);
      setStationsError(null);
    } catch (error) {
      console.error('Error fetching charging stations:', error);
      setStationsError(error.message);
      
      // If we don't have data yet, use simulated data
      if (!stationsData) {
        setStationsData(generateSimulatedChargingStations(latitude, longitude, radius));
      }
    } finally {
      setStationsLoading(false);
    }
  }, [latitude, longitude, radius]);
  
  // Refresh data when location or radius changes
  useEffect(() => {
    getChargingStations();
  }, [getChargingStations]);
  
  // Set up polling for periodic updates
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      const pollTimer = setInterval(getChargingStations, pollInterval);
      
      return () => {
        clearInterval(pollTimer);
      };
    }
  }, [getChargingStations, pollInterval, latitude, longitude]);
  
  // Computed values
  const availableStations = stationsData?.stations?.filter(station => station.available) || [];
  const unavailableStations = stationsData?.stations?.filter(station => !station.available) || [];
  
  return {
    stationsData,
    stationsLoading,
    stationsError,
    refreshStationsData: getChargingStations,
    // Computed properties
    availableStations,
    unavailableStations,
    totalStations: stationsData?.stations?.length || 0
  };
};
