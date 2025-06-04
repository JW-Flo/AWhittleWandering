import { describe, test, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the hooks to control their behavior
import * as useVehicleDataModule from '../hooks/useVehicleData';
import * as useWeatherDataModule from '../hooks/useWeatherData';
import * as useTripDataModule from '../hooks/useTripData';
import * as useChargingStationsModule from '../hooks/useChargingStations';

describe('App Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('renders loading state initially', () => {
    useVehicleDataModule.useVehicleData = vi.fn().mockReturnValue({
      vehicleData: null,
      vehicleLoading: true,
      vehicleError: null
    });
    useWeatherDataModule.useWeatherData = vi.fn().mockReturnValue({
      weatherData: null,
      weatherLoading: true,
      weatherError: null
    });
    useTripDataModule.useTripData = vi.fn().mockReturnValue({
      tripData: null,
      tripLoading: true,
      tripError: null
    });
    useChargingStationsModule.useChargingStations = vi.fn().mockReturnValue({
      stationsData: null,
      stationsLoading: true,
      stationsError: null
    });

    render(<App />);
    expect(screen.getByText(/Loading journey data/i)).toBeInTheDocument();
  });

  test('renders error message if any hook returns error', async () => {
    useVehicleDataModule.useVehicleData = vi.fn().mockReturnValue({
      vehicleData: null,
      vehicleLoading: false,
      vehicleError: 'Vehicle API error'
    });
    useWeatherDataModule.useWeatherData = vi.fn().mockReturnValue({
      weatherData: null,
      weatherLoading: false,
      weatherError: null
    });
    useTripDataModule.useTripData = vi.fn().mockReturnValue({
      tripData: null,
      tripLoading: false,
      tripError: null
    });
    useChargingStationsModule.useChargingStations = vi.fn().mockReturnValue({
      stationsData: null,
      stationsLoading: false,
      stationsError: null
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Vehicle API error/i)).toBeInTheDocument();
    });
  });

  test('renders Dashboard with data when loading is false and no errors', () => {
    useVehicleDataModule.useVehicleData = vi.fn().mockReturnValue({
      vehicleData: { latitude: 40, longitude: -74 },
      vehicleLoading: false,
      vehicleError: null
    });
    useWeatherDataModule.useWeatherData = vi.fn().mockReturnValue({
      weatherData: { temp: 70 },
      weatherLoading: false,
      weatherError: null
    });
    useTripDataModule.useTripData = vi.fn().mockReturnValue({
      tripData: { currentStop: 'NYC' },
      tripLoading: false,
      tripError: null
    });
    useChargingStationsModule.useChargingStations = vi.fn().mockReturnValue({
      stationsData: { stations: [] },
      stationsLoading: false,
      stationsError: null
    });

    render(<App />);
    expect(screen.queryByText(/Loading journey data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
  });
});
