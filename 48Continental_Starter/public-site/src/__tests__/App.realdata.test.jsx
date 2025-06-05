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

describe('App Component with real data', () => {
  test('renders loading state and then dashboard with real data', async () => {
    render(<App />);
    expect(screen.getByText(/Loading your journey/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    });
  });
});
