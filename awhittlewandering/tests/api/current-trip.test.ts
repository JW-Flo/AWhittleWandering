/**
 * Tests for the /api/trip/current endpoint
 * 
 * These tests verify that the current trip information is correctly returned
 * and that the API properly handles error cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import apiWorker from '../../workers/api';
import { 
  mockEnv, 
  mockExecutionContext, 
  sampleCurrentDayData, 
  sampleTelemetryData 
} from './setup';

describe('GET /api/trip/current', () => {
  const env = mockEnv();
  const ctx = mockExecutionContext();

  beforeEach(() => {
    // Reset mocks before each test
    env.TRIP_DATA.get.mockReset();
  });

  it('should return current trip data with latest telemetry when available', async () => {
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
    expect(data).toEqual({
      ...sampleCurrentDayData,
      telemetry: sampleTelemetryData
    });
    
    // Verify that the KV store was queried correctly
    expect(env.TRIP_DATA.get).toHaveBeenCalledWith('.current_trip_day.json', { type: 'json' });
    expect(env.TRIP_DATA.get).toHaveBeenCalledWith('day_1_telemetry.json', { type: 'json' });
  });

  it('should return a 404 error when no current trip data is available', async () => {
    // Mock that no data is available
    env.TRIP_DATA.get.mockResolvedValue(null);

    // Create a request to the endpoint
    const request = new Request('https://awhittlewandering.com/api/trip/current');
    
    // Call the API worker
    const response = await apiWorker.fetch(request, env, ctx);
    
    // Verify the response
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('No current trip data available');
  });

  it('should return a 500 error when there is an error fetching data', async () => {
    // Mock an error when fetching data
    env.TRIP_DATA.get.mockRejectedValue(new Error('Test error'));

    // Create a request to the endpoint
    const request = new Request('https://awhittlewandering.com/api/trip/current');
    
    // Call the API worker
    const response = await apiWorker.fetch(request, env, ctx);
    
    // Verify the response
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Failed to fetch current trip data');
  });
});
