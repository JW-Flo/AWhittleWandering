/**
 * Trip API Handler
 * 
 * This module handles interactions with the trip API.
 */

/* eslint-env browser */

/**
 * Fetch trip data
 * @returns {Promise<Object>} Trip data
 */
export const fetchTripData = async () => {
  try {
    const response = await fetch('/api/trip');
    
    if (!response.ok) {
      throw new Error(`Trip API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching trip data:', error);
    throw error;
  }
};

/**
 * Fetch trip progress data
 * @returns {Promise<Object>} Trip progress data
 */
export const fetchTripProgress = async () => {
  try {
    const response = await fetch('/api/trip-progress');
    
    if (!response.ok) {
      throw new Error(`Trip progress API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching trip progress:', error);
    throw error;
  }
};

/**
 * Fetch state collection data
 * @returns {Promise<Object>} State collection data
 */
export const fetchStateCollection = async () => {
  try {
    const response = await fetch('/api/state-collection');
    
    if (!response.ok) {
      throw new Error(`State collection API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching state collection data:', error);
    throw error;
  }
};

/**
 * Fetch optimized route
 * @param {string} origin - Origin coordinates (lat,lng)
 * @param {string} destination - Destination coordinates (lat,lng)
 * @param {boolean} includeCharging - Whether to include charging stops
 * @returns {Promise<Object>} Optimized route data
 */
export const fetchOptimizedRoute = async (origin, destination, includeCharging = true) => {
  try {
    const params = new URLSearchParams();
    params.append('origin', origin);
    params.append('destination', destination);
    params.append('charging', includeCharging);
    
    const response = await fetch(`/api/route/optimize?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Route optimization API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching optimized route:', error);
    throw error;
  }
};

/**
 * Fetch points of interest
 * @param {string} area - Area to search for POIs (lat,lng)
 * @param {number} radius - Radius to search in miles
 * @returns {Promise<Object>} Points of interest data
 */
export const fetchPointsOfInterest = async (area, radius = 50) => {
  try {
    const params = new URLSearchParams();
    if (area) {
      params.append('area', area);
    }
    params.append('radius', radius);
    
    const response = await fetch(`/api/points-of-interest?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Points of interest API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching points of interest:', error);
    throw error;
  }
};

/**
 * Generate simulated trip data for testing
 * @returns {Object} Simulated trip data
 */
export { generateSimulatedTripData } from './tripSimulation';
