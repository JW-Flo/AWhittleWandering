/**
 * Frontend Unit Tests
 * Integrates with vitest and the recursive QA pipeline
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '../src/pages/Index';
import { TeslaDataProvider } from '../src/context/TeslaDataContext';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Tesla Dashboard', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TeslaDataProvider>
          {component}
        </TeslaDataProvider>
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render main dashboard without crashing', () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ config: { teslaApiKey: 'test' } }),
      });

      renderWithProviders(<Index />);
      expect(screen.getByText(/Tesla/i)).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      fetch.mockImplementation(() => new Promise(() => { })); // Never resolves

      renderWithProviders(<Index />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      renderWithProviders(<Index />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Integration', () => {
    it('should fetch and display Tesla data', async () => {
      const mockTeslaData = {
        battery_level: 85,
        range: 250,
        odometer: 15000,
        location: { lat: 40.7128, lng: -74.0060 }
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ config: { teslaApiKey: 'test' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTeslaData,
        });

      renderWithProviders(<Index />);

      await waitFor(() => {
        expect(screen.getByText(/85%/)).toBeInTheDocument();
        expect(screen.getByText(/250/)).toBeInTheDocument();
      });
    });

    it('should auto-refresh data every 30 seconds', async () => {
      vi.useFakeTimers();

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ battery_level: 85 }),
      });

      renderWithProviders(<Index />);

      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });

  describe('User Interactions', () => {
    it('should handle refresh button clicks', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ battery_level: 85 }),
      });

      renderWithProviders(<Index />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should toggle between map views', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ location: { lat: 40.7128, lng: -74.0060 } }),
      });

      renderWithProviders(<Index />);

      const mapToggle = screen.getByRole('button', { name: /map/i });
      fireEvent.click(mapToggle);

      expect(screen.getByTestId('tesla-map')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<Index />);

      const container = screen.getByTestId('dashboard-container');
      expect(container).toHaveClass('mobile-layout');
    });

    it('should adapt to desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderWithProviders(<Index />);

      const container = screen.getByTestId('dashboard-container');
      expect(container).toHaveClass('desktop-layout');
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks', async () => {
      const { unmount } = renderWithProviders(<Index />);

      // Simulate component lifecycle
      unmount();

      // Check that timers are cleaned up
      expect(vi.getTimerCount()).toBe(0);
    });

    it('should handle rapid API calls efficiently', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ battery_level: 85 }),
      });

      renderWithProviders(<Index />);

      // Simulate rapid refresh clicks
      const refreshButton = screen.getByRole('button', { name: /refresh/i });

      for (let i = 0; i < 10; i++) {
        fireEvent.click(refreshButton);
      }

      // Should debounce API calls
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2); // Initial + 1 debounced call
      });
    });
  });

  describe('Error Handling', () => {
    it('should display user-friendly error messages', async () => {
      fetch.mockRejectedValueOnce(new Error('Network Error'));

      renderWithProviders(<Index />);

      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
      });
    });

    it('should provide retry mechanism on errors', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ battery_level: 85 }),
        });

      renderWithProviders(<Index />);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/85%/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<Index />);

      expect(screen.getByLabelText(/battery level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vehicle range/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<Index />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      refreshButton.focus();

      expect(document.activeElement).toBe(refreshButton);
    });

    it('should have proper heading hierarchy', () => {
      renderWithProviders(<Index />);

      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveAttribute('aria-level', '1');
    });
  });
});

describe('TeslaDataContext', () => {
  it('should provide Tesla data to child components', async () => {
    const TestComponent = () => {
      const { teslaData } = useTeslaData();
      return <div>{teslaData?.battery_level || 'No data'}</div>;
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ battery_level: 90 }),
    });

    render(
      <TeslaDataProvider>
        <TestComponent />
      </TeslaDataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('90')).toBeInTheDocument();
    });
  });

  it('should handle context errors gracefully', async () => {
    const TestComponent = () => {
      const { error } = useTeslaData();
      return <div>{error ? 'Error occurred' : 'No error'}</div>;
    };

    fetch.mockRejectedValue(new Error('API Error'));

    render(
      <TeslaDataProvider>
        <TestComponent />
      </TeslaDataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });
  });
});

// Integration test helpers
export const testHelpers = {
  async waitForDataLoad() {
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  },

  mockSuccessfulAPI(data = {}) {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => data,
    });
  },

  mockFailedAPI(error = 'API Error') {
    fetch.mockRejectedValue(new Error(error));
  },

  expectErrorState() {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  },

  expectLoadingState() {
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  }
};
