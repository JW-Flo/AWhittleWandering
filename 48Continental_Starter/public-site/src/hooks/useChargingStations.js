/**
 * Charging Stations Hook
 * 
 * This hook provides access to nearby Tesla Supercharger stations
 * for the 48 Continental USA journey.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { fetchChargingStations, generateSimulatedChargingStations } from '../api/chargingApi';

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 300000; // 5 minutes

// Default search radius in miles
const DEFAULT_RADIUS = 50;

/**
 * Hook for accessing charging stations data
 * @param {Object} options - Configuration options
 * @param {number} options.latitude - Center latitude for search
 * @param {number} options.longitude - Center longitude for search
 * @param {number} options.radius - Search radius in miles
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @returns {Object} Charging stations data, loading state, and error
 */
export const useChargingStations = (options = {}) => {
  const {
    latitude,
    longitude,
    radius = DEFAULT_RADIUS,
    pollInterval = DEFAULT_POLL_INTERVAL
  } = options;
  
  // State for charging stations data
  const [stationsData, setStationsData] = useState(null);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState(null);
  
  // Function to fetch charging stations data from API
  const getStationsData = useCallback(async () => {
    // If no location provided, can't fetch charging stations
    if (!latitude || !longitude) {
      // Use simulated data with default location
      setStationsData(generateSimulatedChargingStations());
      setStationsLoading(false);
      return;
    }
    
    setStationsLoading(true);
    
    try {
      // Call our API function with location and radius
      const data = await fetchChargingStations({
        latitude,
        longitude,
        radius
      });
      
      setStationsData(data);
      setStationsError(null);
    } catch (error) {
      console.error('Error fetching charging stations data:', error);
      setStationsError(error.message);
      
      // If we don't have data yet, use simulated data
      if (!stationsData) {
        setStationsData(generateSimulatedChargingStations(latitude, longitude, radius));
      }
    } finally {
      setStationsLoading(false);
    }
  }, [latitude, longitude, radius, stationsData]);
  
  // Fetch charging stations data when location changes or on initial load
  useEffect(() => {
    getStationsData();
    
    // Set up polling if location provided
    if (latitude && longitude) {
      const pollTimer = setInterval(getStationsData, pollInterval);
      
      return () => {
        clearInterval(pollTimer);
      };
    }
  }, [getStationsData, latitude, longitude, pollInterval]);
  
  // Get nearest charging station
  const nearestStation = stationsData?.stations?.length > 0 ? stationsData.stations[0] : null;
  
  // Get available stations count
  const availableStations = stationsData?.stations?.filter(station => station.available > 0).length || 0;
  
  return {
    stationsData,
    stationsLoading,
    stationsError,
    refreshStationsData: getStationsData,
    // Computed properties
    nearestStation,
    availableStations
  };
};
