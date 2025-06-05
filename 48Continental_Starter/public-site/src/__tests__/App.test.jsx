import { describe, test, expect, vi, act } from 'vitest';
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
  default: () => mockVehicleData
}));

vi.mock('../hooks/useWeatherData', () => ({
  default: () => mockWeatherData
}));

vi.mock('../hooks/useTripData', () => ({
  default: () => mockTripData
}));

vi.mock('../hooks/useChargingStations', () => ({
  default: () => mockStationsData
}));

describe('App Component', () => {
  test('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/Loading journey data/i)).toBeInTheDocument();
  });

  test('renders error message if any hook returns error', async () => {
    // Override mocks to return error state
    vi.mock('../hooks/useVehicleData', () => ({
      default: () => ({
        vehicleData: null,
        vehicleLoading: false,
        vehicleError: new Error('Vehicle data error')
      })
    }));
    vi.mock('../hooks/useWeatherData', () => ({
      default: () => ({
        weatherData: null,
        weatherLoading: false,
        weatherError: new Error('Weather data error')
      })
    }));
    vi.mock('../hooks/useTripData', () => ({
      default: () => ({
        tripData: null,
        tripLoading: false,
        tripError: new Error('Trip data error')
      })
    }));
    vi.mock('../hooks/useChargingStations', () => ({
      default: () => ({
        stationsData: null,
        stationsLoading: false,
        stationsError: new Error('Stations data error')
      })
    }));

    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  test('renders Dashboard with data when loading is false and no errors', async () => {
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.getByText(/The Wandering Whittle/i)).toBeInTheDocument();
    });
  });
});
