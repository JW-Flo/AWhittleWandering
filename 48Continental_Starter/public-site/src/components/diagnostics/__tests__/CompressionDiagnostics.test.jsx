/* eslint-env jest */
import React from 'react';
import { render, screen } from '@testing-library/react';
import CompressionDiagnostics from '../CompressionDiagnostics';

jest.mock('react-leaflet', () => {
  return {
    MapContainer: (props) => React.createElement('div', props, props.children),
    TileLayer: () => React.createElement('div'),
    Polyline: () => React.createElement('div'),
  };
});

describe('CompressionDiagnostics Component', () => {
  test('renders without crashing', () => {
    render(<CompressionDiagnostics />);
    expect(screen.getByText(/Compression Diagnostics/i)).toBeInTheDocument();
  });
});
