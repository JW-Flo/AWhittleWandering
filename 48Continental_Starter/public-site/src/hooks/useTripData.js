/**
 * Trip Data Hook
 * 
 * This hook provides access to The Wandering Whittle trip data
 * including routes, stops, and state visit progress.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { fetchTripData, generateSimulatedTripData } from '../api';

// Default polling interval in milliseconds (how often we refresh trip data)
const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds (~30,000 ms)

/**
 * Hook for accessing trip data
 * @param {Object} options - Configuration options
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @returns {Object} Trip data, loading state, and error
 */
export const useTripData = (options = {}) => {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL
  } = options;
  
  // State for trip data
  const [tripData, setTripData] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripError, setTripError] = useState(null);
  
  // Function to fetch trip data from API
  const getTripData = useCallback(async () => {
    setTripLoading(true);
    
    try {
      // Call our API function
      const data = await fetchTripData();
      setTripData(data);
      setTripError(null);
    } catch (error) {
      console.error('Error fetching trip data:', error);
      setTripError(error.message);
      
      // If we don't have data yet, use simulated data
      if (!tripData) {
        setTripData(generateSimulatedTripData());
      }
    } finally {
      setTripLoading(false);
    }
  }, [tripData]);
  
  // Initial data fetch
  useEffect(() => {
    getTripData();
    
    // Set up polling for periodic updates
    const pollTimer = setInterval(getTripData, pollInterval);
    
    return () => {
      clearInterval(pollTimer);
    };
  }, [getTripData, pollInterval]);
  
  // Computed values
  const currentStop = tripData?.currentStop || null;
  const nextStop = tripData?.nextStop || null;
  const visitedStates = tripData?.visitedStates || [];
  const remainingStates = tripData ? 
    Object.keys(tripData.stateCoordinates).filter(state => !visitedStates.includes(state)) : 
    [];
  const completionPercentage = tripData ? 
    Math.round((visitedStates.length / 48) * 100) : 
    0;
  
  return {
    tripData,
    tripLoading,
    tripError,
    refreshTripData: getTripData,
    // Computed properties
    currentStop,
    nextStop,
    visitedStates,
    remainingStates,
    completionPercentage
  };
};
