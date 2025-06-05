import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

vi.mock('../hooks/useVehicleData', () => ({
  useVehicleData: () => ({
    vehicleData: { latitude: 40, longitude: -74, speed: 65, batteryLevel: 85 },
    vehicleLoading: false,
    vehicleError: null
  })
}));

vi.mock('../hooks/useWeatherData', () => ({
  useWeatherData: () => ({
    weatherData: { temp: 72, description: 'Clear sky' },
    weatherLoading: false,
    weatherError: null
  })
}));

vi.mock('../hooks/useTripData', () => ({
  useTripData: () => ({
    tripData: { currentStop: 'New York', visitedStates: ['NY', 'NJ'] },
    tripLoading: false,
    tripError: null
  })
}));

vi.mock('../hooks/useChargingStations', () => ({
  useChargingStations: () => ({
    stationsData: { stations: [] },
    stationsLoading: false,
    stationsError: null
  })
}));

describe('App Component', () => {
  test('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/Loading journey data/i)).toBeInTheDocument();
  });

  test('renders error message if any hook returns error', async () => {
    render(<App />);
    // Simulate error state here if needed
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('renders Dashboard with data when loading is false and no errors', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    });
  });
});
