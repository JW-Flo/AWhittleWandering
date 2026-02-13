import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsolidatedRouteOptimizer from './ConsolidatedRouteOptimizer';
import * as backendApi from '@/services/backendApi';

vi.mock('@/services/backendApi', () => ({
  backendApi: {
    optimizeRoute: vi.fn(),
  },
}));

describe('ConsolidatedRouteOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates origin field is required', async () => {
    const user = userEvent.setup();
    render(<ConsolidatedRouteOptimizer />);

    const originInput = screen.getByLabelText('Origin');
    const optimizeButton = screen.getByRole('button', { name: /Optimize Route with AI/i });

    await user.click(originInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Origin is required')).toBeInTheDocument();
    });

    expect(optimizeButton).toBeDisabled();
  });

  it('validates destination field is required', async () => {
    const user = userEvent.setup();
    render(<ConsolidatedRouteOptimizer />);

    const destinationInput = screen.getByLabelText('Destination');
    const optimizeButton = screen.getByRole('button', { name: /Optimize Route with AI/i });

    await user.click(destinationInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Destination is required')).toBeInTheDocument();
    });

    expect(optimizeButton).toBeDisabled();
  });

  it('enables optimize button when both origin and destination are filled', async () => {
    const user = userEvent.setup();
    render(<ConsolidatedRouteOptimizer />);

    const originInput = screen.getByLabelText('Origin');
    const destinationInput = screen.getByLabelText('Destination');
    const optimizeButton = screen.getByRole('button', { name: /Optimize Route with AI/i });

    await user.type(originInput, 'San Francisco, CA');
    await user.type(destinationInput, 'Los Angeles, CA');

    expect(optimizeButton).not.toBeDisabled();
  });

  it('shows loading state during route optimization', async () => {
    const user = userEvent.setup();

    vi.mocked(backendApi.backendApi.optimizeRoute).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                result: {
                  route: {
                    totalDistance: '400 mi',
                    totalTime: '6 hours',
                    totalCost: '$45',
                    routeEfficiency: '95%',
                    weatherImpact: 'minimal',
                    tips: [],
                    alternativeRoutes: [],
                  },
                  environmental: {
                    carbonSaved: '120 lbs',
                    energyUsed: '100 kWh',
                    efficiency: '4.0 mi/kWh',
                  },
                },
              }),
            100
          )
        )
    );

    render(<ConsolidatedRouteOptimizer />);

    const originInput = screen.getByLabelText('Origin');
    const destinationInput = screen.getByLabelText('Destination');
    const optimizeButton = screen.getByRole('button', { name: /Optimize Route with AI/i });

    await user.type(originInput, 'San Francisco, CA');
    await user.type(destinationInput, 'Los Angeles, CA');
    await user.click(optimizeButton);

    expect(screen.getByText(/Generating optimized route/i)).toBeInTheDocument();
    expect(optimizeButton).toBeDisabled();
  });

  it('displays error when route optimization fails', async () => {
    const user = userEvent.setup();

    vi.mocked(backendApi.backendApi.optimizeRoute).mockResolvedValue({
      ok: false,
      error: 'API error',
    });

    render(<ConsolidatedRouteOptimizer />);

    const originInput = screen.getByLabelText('Origin');
    const destinationInput = screen.getByLabelText('Destination');
    const optimizeButton = screen.getByRole('button', { name: /Optimize Route with AI/i });

    await user.type(originInput, 'San Francisco, CA');
    await user.type(destinationInput, 'Los Angeles, CA');
    await user.click(optimizeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to optimize route/i)
      ).toBeInTheDocument();
    });
  });

  it('displays specific error for 503 service unavailable', async () => {
    const user = userEvent.setup();

    vi.mocked(backendApi.backendApi.optimizeRoute).mockRejectedValue(
      new Error('503 Service Unavailable')
    );

    render(<ConsolidatedRouteOptimizer />);

    const originInput = screen.getByLabelText('Origin');
    const destinationInput = screen.getByLabelText('Destination');
    const optimizeButton = screen.getByRole('button', { name: /Optimize Route with AI/i });

    await user.type(originInput, 'San Francisco, CA');
    await user.type(destinationInput, 'Los Angeles, CA');
    await user.click(optimizeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/AI service is not configured/i)
      ).toBeInTheDocument();
    });
  });

  it('displays specific error for timeout', async () => {
    const user = userEvent.setup();

    vi.mocked(backendApi.backendApi.optimizeRoute).mockRejectedValue(
      new Error('Request timeout')
    );

    render(<ConsolidatedRouteOptimizer />);

    const originInput = screen.getByLabelText('Origin');
    const destinationInput = screen.getByLabelText('Destination');
    const optimizeButton = screen.getByRole('button', { name: /Optimize Route with AI/i });

    await user.type(originInput, 'San Francisco, CA');
    await user.type(destinationInput, 'Los Angeles, CA');
    await user.click(optimizeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Route optimization timed out/i)
      ).toBeInTheDocument();
    });
  });

  it('displays optimized route results on success', async () => {
    const user = userEvent.setup();

    vi.mocked(backendApi.backendApi.optimizeRoute).mockResolvedValue({
      ok: true,
      result: {
        route: {
          totalDistance: '400 mi',
          totalTime: '6 hours',
          totalCost: '$45',
          routeEfficiency: '95%',
          weatherImpact: 'minimal',
          tips: ['Charge at Supercharger in Bakersfield'],
          alternativeRoutes: [],
          chargingStops: [
            {
              name: 'Tesla Supercharger - Bakersfield',
              location: 'Bakersfield, CA',
              arrivalBattery: '25%',
              chargingTime: '20 min',
              departureBattery: '80%',
              distanceFromOrigin: '200 mi',
            },
          ],
        },
        environmental: {
          carbonSaved: '120 lbs',
          energyUsed: '100 kWh',
          efficiency: '4.0 mi/kWh',
        },
      },
    });

    render(<ConsolidatedRouteOptimizer />);

    const originInput = screen.getByLabelText('Origin');
    const destinationInput = screen.getByLabelText('Destination');
    const optimizeButton = screen.getByRole('button', { name: /Optimize Route with AI/i });

    await user.type(originInput, 'San Francisco, CA');
    await user.type(destinationInput, 'Los Angeles, CA');

    // Navigate to results tab
    const resultsTab = screen.getByRole('tab', { name: /Optimization Results/i });
    await user.click(resultsTab);

    await user.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('400 mi')).toBeInTheDocument();
      expect(screen.getByText('6 hours')).toBeInTheDocument();
      expect(screen.getByText('$45')).toBeInTheDocument();
    });
  });

  it('allows adding and removing waypoints', async () => {
    const user = userEvent.setup();
    render(<ConsolidatedRouteOptimizer />);

    const addWaypointButton = screen.getByRole('button', { name: /Add Waypoint/i });
    await user.click(addWaypointButton);

    const waypointInputs = screen.getAllByPlaceholderText('Waypoint address');
    expect(waypointInputs).toHaveLength(1);

    await user.type(waypointInputs[0], 'Fresno, CA');
    expect(waypointInputs[0]).toHaveValue('Fresno, CA');

    const waypointContainer = waypointInputs[0].closest('div');
    const removeButton = waypointContainer?.querySelector('button');
    expect(removeButton).not.toBeNull();
    await user.click(removeButton as HTMLButtonElement);

    expect(screen.queryByPlaceholderText('Waypoint address')).not.toBeInTheDocument();
  });

  it('displays vehicle data when provided', () => {
    const vehicleData = {
      batteryLevel: 85,
      range: 250,
      efficiency: 4.2,
    };

    render(<ConsolidatedRouteOptimizer vehicleData={vehicleData} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('250 mi')).toBeInTheDocument();
    expect(screen.getByText('4.2 mi/kWh')).toBeInTheDocument();
  });
});
