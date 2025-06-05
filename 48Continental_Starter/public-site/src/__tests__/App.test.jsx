import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

const mockVehicleData = {
  vehicleData: { latitude: 40, longitude: -74, speed: 65, batteryLevel: 85 },
  vehicleLoading: false,
  vehicleError: null,
  connectionStatus: 'connected',
  isMockData: false,
  refreshVehicleData: vi.fn(),
  usingMockData: false
};

const mockWeatherData = {
  weatherData: { temp: 72, description: 'Clear sky' },
  weatherLoading: false,
  weatherError: null,
  refreshWeatherData: vi.fn()
};

const mockTripData = {
  tripData: { currentStop: 'New York', visitedStates: ['NY', 'NJ'] },
  tripLoading: false,
  tripError: null,
  refreshTripData: vi.fn()
};

const mockStationsData = {
  stationsData: { stations: [] },
  stationsLoading: false,
  stationsError: null,
  refreshStationsData: vi.fn()
};

vi.mock('../hooks/useVehicleData', () => ({
  useVehicleData: () => mockVehicleData
}));

vi.mock('../hooks/useWeatherData', () => ({
  useWeatherData: () => mockWeatherData
}));

vi.mock('../hooks/useTripData', () => ({
  useTripData: () => mockTripData
}));

vi.mock('../hooks/useChargingStations', () => ({
  useChargingStations: () => mockStationsData
}));

describe('App Component', () => {
  test('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/Loading your journey/i)).toBeInTheDocument();
  });

  test('renders error message if any hook returns error', async () => {
    // Override mocks to return error state
    vi.mock('../hooks/useVehicleData', () => ({
      useVehicleData: () => ({
        vehicleData: null,
        vehicleLoading: false,
        vehicleError: new Error('Vehicle data error')
      })
    }));
    vi.mock('../hooks/useWeatherData', () => ({
      useWeatherData: () => ({
        weatherData: null,
        weatherLoading: false,
        weatherError: new Error('Weather data error')
      })
    }));
    vi.mock('../hooks/useTripData', () => ({
      useTripData: () => ({
        tripData: null,
        tripLoading: false,
        tripError: new Error('Trip data error')
      })
    }));
    vi.mock('../hooks/useChargingStations', () => ({
      useChargingStations: () => ({
        stationsData: null,
        stationsLoading: false,
        stationsError: new Error('Stations data error')
      })
    }));

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Unable to load journey data/i)).toBeInTheDocument();
    });
  });

  test('renders Dashboard with data when loading is false and no errors', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/The Wandering Whittle/i)).toBeInTheDocument();
    });
  });
});
