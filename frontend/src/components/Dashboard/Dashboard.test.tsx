import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/helpers/test-utils';
import { Dashboard } from './Dashboard';

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Clear any previous mock data
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders vehicle data after loading', async () => {
    const mockData = {
      name: 'Model 3',
      batteryLevel: 80,
      chargeState: 'Charging',
    };

    // Mock the fetch response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    ) as any;

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
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch'))
    ) as any;

    render(<Dashboard />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
