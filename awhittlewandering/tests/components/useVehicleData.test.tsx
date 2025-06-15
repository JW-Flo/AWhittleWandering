/**
 * Tests for the useVehicleData hook
 * 
 * These tests verify that the hook correctly fetches and processes vehicle telemetry data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useVehicleData } from '../../packages/frontend/src/hooks/useVehicleData';
import * as React from 'react';

// Test component that uses the hook
function TestComponent() {
  const { currentLocation, routeHistory, isLoading, error } = useVehicleData();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
      <div data-testid="current-location">{currentLocation ? JSON.stringify(currentLocation) : 'null'}</div>
      <div data-testid="route-history">{routeHistory ? JSON.stringify(routeHistory) : 'null'}</div>
    </div>
  );
}

// Mock fetch API
global.fetch = vi.fn();

// Mock sample data
const sampleCurrentTrip = {
  day: 1,
  updatedAt: Date.now(),
  telemetry: {
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: Date.now(),
    batteryLevel: 75,
    charging: false,
    speed: 65,
    stateCode: 'CA'
  }
};

const sampleTripDay = {
  day: 1,
  itinerary: {
    date: '2025-06-01',
    startLocation: 'San Francisco, CA',
    endLocation: 'Sacramento, CA'
  },
  telemetry: [
    {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now() - 3600000, // 1 hour ago
      batteryLevel: 85,
      charging: false,
      speed: 0,
      stateCode: 'CA'
    },
    {
      latitude: 38.1234,
      longitude: -121.9876,
      timestamp: Date.now() - 1800000, // 30 minutes ago
      batteryLevel: 80,
      charging: false,
      speed: 70,
      stateCode: 'CA'
    },
    {
      latitude: 38.5816,
      longitude: -121.4944,
      timestamp: Date.now(),
      batteryLevel: 75,
      charging: false,
      speed: 65,
      stateCode: 'CA'
    }
  ]
};

// Create a mock Response
const mockResponse = (data: any) => {
  return {
    ok: true,
    json: async () => data
  };
};

describe('useVehicleData hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear all mocks between tests
    (global.fetch as any).mockReset();
  });

  it('should load vehicle data correctly', async () => {
    // Set up the mock fetch implementations
    (global.fetch as any)
      .mockImplementationOnce(() => Promise.resolve(mockResponse(sampleCurrentTrip)))
      .mockImplementationOnce(() => Promise.resolve(mockResponse(sampleTripDay)));

    // Render the component that uses the hook
    render(<TestComponent />);

    // Initially, data should be loading
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('current-location').textContent).toBe('null');
    expect(screen.getByTestId('route-history').textContent).toBe('null');
    expect(screen.getByTestId('error').textContent).toBe('no-error');

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Verify that the data is loaded correctly
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('no-error');
    
    // Check current location data is displayed
    const currentLocationText = screen.getByTestId('current-location').textContent;
    const currentLocation = JSON.parse(currentLocationText || '{}');
    expect(currentLocation).not.toBe(null);
    expect(currentLocation.latitude).toBe(sampleCurrentTrip.telemetry.latitude);
    expect(currentLocation.longitude).toBe(sampleCurrentTrip.telemetry.longitude);
    expect(currentLocation.batteryLevel).toBe(sampleCurrentTrip.telemetry.batteryLevel);
    
    // Check route history data
    const routeHistoryText = screen.getByTestId('route-history').textContent;
    const routeHistory = JSON.parse(routeHistoryText || '[]');
    expect(routeHistory).not.toBe(null);
    expect(routeHistory.length).toBe(sampleTripDay.telemetry.length);
    
    // Verify that the API was called correctly
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith('/api/trip/current');
    expect(global.fetch).toHaveBeenCalledWith('/api/trip/day/1');
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed API call
    (global.fetch as any).mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );

    // Render the component that uses the hook
    render(<TestComponent />);

    // Initially, data should be loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for the error to be set
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Verify that the error is handled correctly
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toContain('Network error');
    expect(screen.getByTestId('current-location').textContent).toBe('null');
    expect(screen.getByTestId('route-history').textContent).toBe('null');
  });

  it('should handle API response errors', async () => {
    // Mock a bad response
    (global.fetch as any).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
    );

    // Render the component that uses the hook
    render(<TestComponent />);

    // Wait for the error to be set
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Verify that the error is handled correctly
    expect(screen.getByTestId('error').textContent).toContain('Failed to fetch current trip data');
    expect(screen.getByTestId('error').textContent).toContain('404');
  });
});
