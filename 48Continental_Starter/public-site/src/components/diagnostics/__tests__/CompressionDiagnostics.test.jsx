import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompressionDiagnostics } from '../CompressionDiagnostics';
import { COMPRESSION_TIERS, encodeTelemetry, decodeTelemetry } from '../../../../../edge-worker/src/telemetryCompression';
import '@testing-library/jest-dom';

// Mock leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polyline: ({ positions }) => <div data-testid="polyline" data-positions={JSON.stringify(positions)} />
}));

describe('CompressionDiagnostics', () => {
  const sampleTelemetryData = [
    { timestamp: 1625097600000, latitude: 37.7749, longitude: -122.4194 },
    { timestamp: 1625097660000, latitude: 37.7746, longitude: -122.4189 },
    { timestamp: 1625097720000, latitude: 37.7742, longitude: -122.4184 },
    { timestamp: 1625097780000, latitude: 37.7737, longitude: -122.4179 },
    { timestamp: 1625097840000, latitude: 37.7733, longitude: -122.4174 }
  ];

  beforeEach(() => {
    // Reset performance.now mock before each test
    jest.spyOn(performance, 'now').mockImplementation(() => 0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<CompressionDiagnostics telemetryData={sampleTelemetryData} />);
    expect(screen.getByText('Telemetry Compression Diagnostics')).toBeInTheDocument();
  });

  it('displays correct compression stats', async () => {
    render(<CompressionDiagnostics telemetryData={sampleTelemetryData} />);

    // Wait for stats to be calculated
    await waitFor(() => {
      const compressionRatio = screen.getByText(/\d+\.\d+%/);
      expect(compressionRatio).toBeInTheDocument();
      expect(parseFloat(compressionRatio.textContent)).toBeGreaterThanOrEqual(35.0); // Near-lossless tier
    });

    // Check processing times
    const processingTimes = screen.getByText(/\d+\.\d+ms \/ \d+\.\d+ms/);
    expect(processingTimes).toBeInTheDocument();

    // Check data points
    const dataPoints = screen.getByText(`${sampleTelemetryData.length} / ${sampleTelemetryData.length}`);
    expect(dataPoints).toBeInTheDocument();
  });

  it('handles compression tier changes', async () => {
    render(<CompressionDiagnostics telemetryData={sampleTelemetryData} />);

    // Select different compression tiers
    const tierSelect = screen.getByLabelText('Compression Tier');

    // Test Lossless tier
    fireEvent.change(tierSelect, { target: { value: COMPRESSION_TIERS.LOSSLESS } });
    await waitFor(() => {
      const ratio = parseFloat(screen.getByText(/\d+\.\d+%/).textContent);
      expect(ratio).toBeGreaterThanOrEqual(15.0);
    });

    // Test Lossy tier
    fireEvent.change(tierSelect, { target: { value: COMPRESSION_TIERS.LOSSY } });
    await waitFor(() => {
      const ratio = parseFloat(screen.getByText(/\d+\.\d+%/).textContent);
      expect(ratio).toBeGreaterThanOrEqual(50.0);
    });
  });

  it('renders map with both routes', () => {
    render(<CompressionDiagnostics telemetryData={sampleTelemetryData} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();

    const polylines = screen.getAllByTestId('polyline');
    expect(polylines).toHaveLength(2); // Original and compressed routes

    // Verify route data
    polylines.forEach(polyline => {
      const positions = JSON.parse(polyline.dataset.positions);
      expect(positions.length).toBeGreaterThan(0);
      positions.forEach(pos => {
        expect(pos).toHaveLength(2); // [lat, lng]
        expect(typeof pos[0]).toBe('number');
        expect(typeof pos[1]).toBe('number');
      });
    });
  });

  it('meets performance requirements', async () => {
    let startTime = performance.now();
    
    render(<CompressionDiagnostics telemetryData={sampleTelemetryData} />);
    
    await waitFor(() => {
      const processingTimes = screen.getByText(/\d+\.\d+ms \/ \d+\.\d+ms/);
      const [encodeTime, decodeTime] = processingTimes.textContent
        .split('/')
        .map(t => parseFloat(t));
      
      expect(encodeTime).toBeLessThan(10); // Sub-10ms encoding
      expect(decodeTime).toBeLessThan(50); // Sub-50ms decoding
    });
  });

  it('handles empty telemetry data gracefully', () => {
    render(<CompressionDiagnostics telemetryData={[]} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles invalid telemetry data', () => {
    const invalidData = [{ invalid: 'data' }];
    render(<CompressionDiagnostics telemetryData={invalidData} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
