/**
 * API Testing Setup
 * 
 * This file contains the setup for API tests, including mock data and utilities.
 */

import { afterEach, beforeEach, vi } from 'vitest';

// Mock KV namespace for testing
export const mockKVNamespace = () => {
  return {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  };
};

// Mock R2 bucket for testing
export const mockR2Bucket = () => {
  return {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  };
};

// Mock environment for testing
export const mockEnv = () => {
  return {
    TRIP_DATA: mockKVNamespace(),
    STATIC_ASSETS: mockR2Bucket(),
    MAPBOX_TOKEN: 'mock-mapbox-token',
    APP_NAME: 'A Whittle Wandering',
    MAP_STYLE: 'mapbox://styles/mapbox/streets-v12',
    ENABLE_STREAMING: 'true',
    ENABLE_MAP_PERFORMANCE_MONITORING: 'true',
    MAP_RETRY_ATTEMPTS: '3',
    MAP_RETRY_DELAY: '1000',
    MCP_API_KEY: 'mock-api-key',
    OPENWEATHER_API_KEY: 'mock-weather-key',
    AI_GATEWAY: vi.fn() as unknown as any
  };
};

// Mock execution context for testing
export const mockExecutionContext = () => {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn()
  };
};

// Sample telemetry data for testing
export const sampleTelemetryData = {
  timestamp: Date.now(),
  latitude: 37.7749,
  longitude: -122.4194,
  speed: 65,
  batteryLevel: 75,
  heading: 180,
  charging: false,
  temperature: 72,
  tripDay: 1,
  stateCode: 'CA'
};

// Sample itinerary data for testing
export const sampleItineraryData = {
  day: 1,
  date: '2025-06-01',
  startLocation: 'San Francisco, CA',
  endLocation: 'Sacramento, CA',
  plannedMiles: 88,
  actualMiles: 92,
  statesVisited: ['CA'],
  stops: [
    { 
      location: 'San Francisco, CA', 
      type: 'start', 
      lat: 37.7749, 
      lng: -122.4194 
    },
    { 
      location: 'Sacramento, CA', 
      type: 'end', 
      lat: 38.5816, 
      lng: -121.4944 
    }
  ],
  highlights: ['Golden Gate Bridge', 'California State Capitol']
};

// Sample current day data for testing
export const sampleCurrentDayData = {
  day: 1,
  updatedAt: Date.now()
};

// Reset all mocks after each test
afterEach(() => {
  vi.resetAllMocks();
});
