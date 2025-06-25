/**
 * CRITICAL TESTS - Core API Functionality
 * 
 * These tests verify essential API functionality that must pass before deployment.
 * Keep this test suite minimal and fast (< 30 seconds).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import apiWorker from '../../workers/api';
import { 
  mockEnv, 
  mockExecutionContext, 
  sampleCurrentDayData, 
  sampleTelemetryData 
} from '../api/setup';

describe('CRITICAL: Core API Functionality', () => {
  const env = mockEnv();
  const ctx = mockExecutionContext();

  beforeEach(() => {
    // Reset mocks before each test
    env.TRIP_DATA.get.mockReset();
  });

  it('should return current trip data successfully', async () => {
    // Set up mock data
    env.TRIP_DATA.get.mockImplementation((key, options) => {
      if (key === '.current_trip_day.json') {
        return Promise.resolve(sampleCurrentDayData);
      }
      if (key === 'day_1_telemetry.json') {
        return Promise.resolve([sampleTelemetryData]);
      }
      return Promise.resolve(null);
    });

    // Create a request to the endpoint
    const request = new Request('https://awhittlewandering.com/api/trip/current');
    
    // Call the API worker
    const response = await apiWorker.fetch(request, env, ctx);
    
    // Verify the response
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('day');
    expect(data).toHaveProperty('telemetry');
    expect(data.telemetry).toHaveProperty('latitude');
    expect(data.telemetry).toHaveProperty('longitude');
  });

  it('should handle missing data gracefully', async () => {
    // Mock that no data is available
    env.TRIP_DATA.get.mockResolvedValue(null);

    // Create a request to the endpoint
    const request = new Request('https://awhittlewandering.com/api/trip/current');
    
    // Call the API worker
    const response = await apiWorker.fetch(request, env, ctx);
    
    // Verify graceful error handling
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
