/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Component with real data', () => {
  test('renders loading state and then dashboard with real data', async () => {
    render(<App />);
    expect(screen.getByText(/Loading journey data/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    }, { timeout: 10000 });

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });
});
