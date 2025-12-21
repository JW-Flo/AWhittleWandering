import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/helpers/test-utils';
import { Dashboard } from './Dashboard';

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Clear any previous mock data
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders loading state initially', () => {
    // Keep the initial provider fetch pending so loading state is stable
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})) as any);
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders vehicle data after loading', async () => {
    const mockData = {
      overview: {
        tripName: 'Test Trip',
        vehicle: 'Model 3',
        startDate: '2025-01-01',
        daysElapsed: 1,
        totalMiles: 123,
        currentOdometer: 45678,
        statesVisited: 1,
        totalStates: 48,
      },
      currentStatus: {
        battery: {
          level: 80,
          range: 240,
          charging: 'charging',
        },
        location: {
          coordinates: { lat: 37.7749, lng: -122.4194 },
          state: 'CA',
          lastUpdate: '2025-01-01T00:00:00Z',
          city: 'San Francisco',
        },
        vehicle: {
          odometer: 45678,
          speed: 0,
          temperature: { inside: 21, outside: 18 },
        },
      },
      timeline: { drives: [], charges: [] },
      tessieStatus: { connected: true, lastUpdate: '2025-01-01T00:00:00Z', dataFreshness: 'fresh' },
    };

    // Mock the fetch response
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve(mockData),
        })
      ) as any
    );

    render(<Dashboard />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check if vehicle data is rendered
    expect(screen.getByText('Model 3')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Charging')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock a failed fetch
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Failed to fetch'))) as any);

    render(<Dashboard />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
