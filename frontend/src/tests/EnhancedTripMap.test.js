import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EnhancedTripMap from '../components/EnhancedTripMap';
import * as useVehicleData from '../hooks/useVehicleData';
import * as usePerformanceMonitor from '../utils/performanceMonitor';
// Mock mapbox-gl
const mockMap = {
    addControl: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    setTerrain: vi.fn(),
    setFog: vi.fn(),
    getSource: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    getLayer: vi.fn(),
    setPaintProperty: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    easeTo: vi.fn(),
    getZoom: vi.fn(() => 10),
    getCenter: vi.fn(() => ({ toArray: () => [-98.5795, 39.8283] })),
    getBearing: vi.fn(() => 0),
    getPitch: vi.fn(() => 0)
};
const mockMarker = {
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    getLngLat: vi.fn(() => ({ toArray: () => [-98.5795, 39.8283] })),
    getElement: vi.fn(() => ({ style: { transform: '' } }))
};
const mockLngLatBounds = {
    extend: vi.fn()
};
vi.mock('mapbox-gl', () => ({
    default: {
        accessToken: '',
        Map: vi.fn(() => mockMap),
        Marker: vi.fn(() => mockMarker),
        NavigationControl: vi.fn(),
        FullscreenControl: vi.fn(),
        ScaleControl: vi.fn(),
        LngLatBounds: vi.fn(() => mockLngLatBounds)
    }
}));
// Mock CSS import
vi.mock('../styles/EnhancedTripMap.css', () => ({}));
// Mock performance APIs
Object.defineProperty(window, 'performance', {
    value: {
        now: vi.fn(() => Date.now()),
        getEntriesByType: vi.fn(() => []),
        getEntriesByName: vi.fn(() => [])
    }
});
Object.defineProperty(window, 'PerformanceObserver', {
    value: vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn()
    }))
});
Object.defineProperty(window, 'requestAnimationFrame', {
    value: vi.fn((callback) => setTimeout(callback, 16))
});
Object.defineProperty(window, 'cancelAnimationFrame', {
    value: vi.fn()
});
describe('EnhancedTripMap', () => {
    const mockVehicleData = {
        currentLocation: {
            latitude: 40.7128,
            longitude: -74.0060,
            timestamp: Date.now(),
            state: 'NY',
            batteryLevel: 85,
            charging: false,
            speed: 65
        },
        routeHistory: [
            {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: Date.now() - 3600000,
                state: 'NY',
                batteryLevel: 90,
                charging: false,
                speed: 60
            },
            {
                latitude: 40.7580,
                longitude: -73.9855,
                timestamp: Date.now(),
                state: 'NY',
                batteryLevel: 85,
                charging: false,
                speed: 65
            }
        ],
        isLoading: false,
        error: null
    };
    const mockPerformanceMonitor = {
        startTiming: vi.fn(() => vi.fn()),
        trackMapMetrics: vi.fn(),
        trackApiRequest: vi.fn(),
        recordMetric: vi.fn(),
        getPerformanceSummary: vi.fn(),
        checkPerformanceTargets: vi.fn()
    };
    beforeEach(() => {
        vi.spyOn(useVehicleData, 'useVehicleData').mockReturnValue(mockVehicleData);
        vi.spyOn(usePerformanceMonitor, 'usePerformanceMonitor').mockReturnValue(mockPerformanceMonitor);
        // Reset all mocks
        vi.clearAllMocks();
        // Mock HTMLDivElement for map container
        Object.defineProperty(HTMLDivElement.prototype, 'clientWidth', {
            value: 800,
            configurable: true
        });
        Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', {
            value: 600,
            configurable: true
        });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('renders the map component with header and controls', () => {
        render(_jsx(EnhancedTripMap, {}));
        expect(screen.getByText('Live Tesla Journey')).toBeInTheDocument();
        expect(screen.getByText('Real-time tracking across the Continental United States')).toBeInTheDocument();
        expect(screen.getByText('📍 Follow Tesla')).toBeInTheDocument();
        expect(screen.getByText('🗺️ View Route')).toBeInTheDocument();
    });
    it('displays loading state when data is loading', () => {
        vi.spyOn(useVehicleData, 'useVehicleData').mockReturnValue({
            ...mockVehicleData,
            isLoading: true
        });
        render(_jsx(EnhancedTripMap, {}));
        expect(screen.getByText('Loading journey data...')).toBeInTheDocument();
        expect(screen.getByRole('progressbar', { name: /loading/i }) ||
            screen.querySelector('.loading-spinner')).toBeInTheDocument();
    });
    it('displays error message when there is an error', () => {
        vi.spyOn(useVehicleData, 'useVehicleData').mockReturnValue({
            ...mockVehicleData,
            error: new Error('Failed to fetch data')
        });
        render(_jsx(EnhancedTripMap, {}));
        expect(screen.getByText('Unable to load tracking data. Retrying...')).toBeInTheDocument();
        expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
    it('displays current location statistics when available', () => {
        render(_jsx(EnhancedTripMap, {}));
        expect(screen.getByText('Battery')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('Speed')).toBeInTheDocument();
        expect(screen.getByText('65 mph')).toBeInTheDocument();
        expect(screen.getByText('State')).toBeInTheDocument();
        expect(screen.getByText('NY')).toBeInTheDocument();
    });
    it('shows charging indicator when Tesla is charging', () => {
        vi.spyOn(useVehicleData, 'useVehicleData').mockReturnValue({
            ...mockVehicleData,
            currentLocation: {
                ...mockVehicleData.currentLocation,
                charging: true
            }
        });
        render(_jsx(EnhancedTripMap, {}));
        expect(screen.getByText('⚡ Charging')).toBeInTheDocument();
    });
    it('initializes map with performance tracking', async () => {
        render(_jsx(EnhancedTripMap, {}));
        await waitFor(() => {
            expect(mockPerformanceMonitor.startTiming).toHaveBeenCalledWith('mapInitialization');
            expect(mockPerformanceMonitor.trackMapMetrics).toHaveBeenCalled();
        });
    });
    it('handles Follow Tesla button click', async () => {
        render(_jsx(EnhancedTripMap, {}));
        const followButton = screen.getByText('📍 Follow Tesla');
        // Simulate map load
        act(() => {
            const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
            if (onLoadCallback)
                onLoadCallback();
        });
        fireEvent.click(followButton);
        await waitFor(() => {
            expect(mockMap.flyTo).toHaveBeenCalledWith({
                center: [-74.0060, 40.7128],
                zoom: 12,
                speed: 1.5
            });
        });
    });
    it('handles View Route button click', async () => {
        render(_jsx(EnhancedTripMap, {}));
        const viewRouteButton = screen.getByText('🗺️ View Route');
        // Simulate map load
        act(() => {
            const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
            if (onLoadCallback)
                onLoadCallback();
        });
        fireEvent.click(viewRouteButton);
        await waitFor(() => {
            expect(mockMap.fitBounds).toHaveBeenCalledWith(mockLngLatBounds, { padding: 50 });
        });
    });
    it('adds map sources and layers when map loads', async () => {
        render(_jsx(EnhancedTripMap, {}));
        // Simulate map load
        act(() => {
            const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
            if (onLoadCallback)
                onLoadCallback();
        });
        await waitFor(() => {
            expect(mockMap.addSource).toHaveBeenCalledWith('mapbox-dem', expect.any(Object));
            expect(mockMap.setTerrain).toHaveBeenCalled();
            expect(mockMap.setFog).toHaveBeenCalled();
            expect(mockMap.addLayer).toHaveBeenCalled();
        });
    });
    it('creates Tesla marker when current location is available', async () => {
        const { rerender } = render(_jsx(EnhancedTripMap, {}));
        // Simulate map load
        act(() => {
            const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
            if (onLoadCallback)
                onLoadCallback();
        });
        // Trigger re-render to simulate location data arriving
        rerender(_jsx(EnhancedTripMap, {}));
        await waitFor(() => {
            expect(mockMarker.setLngLat).toHaveBeenCalledWith([-74.0060, 40.7128]);
            expect(mockMarker.addTo).toHaveBeenCalled();
        });
    });
    it('adds route visualization when route history is available', async () => {
        render(_jsx(EnhancedTripMap, {}));
        // Simulate map load
        act(() => {
            const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
            if (onLoadCallback)
                onLoadCallback();
        });
        await waitFor(() => {
            expect(mockMap.addSource).toHaveBeenCalledWith('route', expect.objectContaining({
                type: 'geojson',
                data: expect.objectContaining({
                    type: 'Feature',
                    geometry: expect.objectContaining({
                        type: 'LineString'
                    })
                })
            }));
        });
    });
    it('handles map state changes', async () => {
        render(_jsx(EnhancedTripMap, {}));
        // Simulate map move event
        act(() => {
            const onMoveCallback = mockMap.on.mock.calls.find(call => call[0] === 'move')?.[1];
            if (onMoveCallback)
                onMoveCallback();
        });
        expect(mockMap.getZoom).toHaveBeenCalled();
        expect(mockMap.getCenter).toHaveBeenCalled();
        expect(mockMap.getBearing).toHaveBeenCalled();
        expect(mockMap.getPitch).toHaveBeenCalled();
    });
    it('cleans up resources on unmount', () => {
        const { unmount } = render(_jsx(EnhancedTripMap, {}));
        unmount();
        expect(mockMap.remove).toHaveBeenCalled();
    });
    it('displays legend with correct items', () => {
        render(_jsx(EnhancedTripMap, {}));
        expect(screen.getByText('Current Tesla Location')).toBeInTheDocument();
        expect(screen.getByText('Journey Route')).toBeInTheDocument();
        expect(screen.getByText('Major Highways')).toBeInTheDocument();
    });
    it('handles no current location gracefully', () => {
        vi.spyOn(useVehicleData, 'useVehicleData').mockReturnValue({
            ...mockVehicleData,
            currentLocation: null
        });
        render(_jsx(EnhancedTripMap, {}));
        // Should not crash and should not display stats
        expect(screen.queryByText('Battery')).not.toBeInTheDocument();
        expect(screen.queryByText('Speed')).not.toBeInTheDocument();
    });
    it('handles empty route history gracefully', () => {
        vi.spyOn(useVehicleData, 'useVehicleData').mockReturnValue({
            ...mockVehicleData,
            routeHistory: []
        });
        render(_jsx(EnhancedTripMap, {}));
        // Should not crash
        expect(screen.getByText('Live Tesla Journey')).toBeInTheDocument();
    });
    it('applies correct CSS classes for charging state', () => {
        vi.spyOn(useVehicleData, 'useVehicleData').mockReturnValue({
            ...mockVehicleData,
            currentLocation: {
                ...mockVehicleData.currentLocation,
                charging: true
            }
        });
        render(_jsx(EnhancedTripMap, {}));
        expect(screen.getByText('⚡ Charging')).toBeInTheDocument();
        const chargingElement = screen.getByText('⚡ Charging').closest('.stat-item');
        expect(chargingElement).toHaveClass('charging');
    });
    it('measures performance correctly', async () => {
        render(_jsx(EnhancedTripMap, {}));
        expect(mockPerformanceMonitor.startTiming).toHaveBeenCalledWith('mapInitialization');
        // Simulate map load completing
        act(() => {
            const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
            if (onLoadCallback)
                onLoadCallback();
        });
        // Verify timing was ended
        const endTimingFn = mockPerformanceMonitor.startTiming.mock.results[0].value;
        expect(typeof endTimingFn).toBe('function');
    });
    it('supports keyboard navigation for accessibility', () => {
        render(_jsx(EnhancedTripMap, {}));
        const followButton = screen.getByText('📍 Follow Tesla');
        const viewRouteButton = screen.getByText('🗺️ View Route');
        // Check that buttons are focusable
        followButton.focus();
        expect(document.activeElement).toBe(followButton);
        viewRouteButton.focus();
        expect(document.activeElement).toBe(viewRouteButton);
    });
    it('renders with proper ARIA attributes', () => {
        render(_jsx(EnhancedTripMap, {}));
        const followButton = screen.getByText('📍 Follow Tesla');
        const viewRouteButton = screen.getByText('🗺️ View Route');
        expect(followButton).toHaveAttribute('type', 'button');
        expect(viewRouteButton).toHaveAttribute('type', 'button');
    });
});
