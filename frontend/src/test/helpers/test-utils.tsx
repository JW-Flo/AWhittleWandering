import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TeslaDataProvider } from '../../contexts/TeslaDataContext';
import { vi } from 'vitest';

// Create a custom render function that includes providers
const customRender = (ui: React.ReactElement, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TeslaDataProvider>
            {children}
          </TeslaDataProvider>
        </BrowserRouter>
      </QueryClientProvider>
    ),
    ...options,
  });
};

// Mock fetch globally
const mockFetch = () => {
  const fetchMock = vi.fn();
  global.fetch = fetchMock;
  return fetchMock;
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, mockFetch };
