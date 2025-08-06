import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for tests
import { vi } from 'vitest'

// Mock browser APIs that aren't available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Leaflet completely to avoid window access issues
vi.mock('leaflet', () => ({
  default: {},
  Map: vi.fn(),
  TileLayer: vi.fn(),
  Marker: vi.fn(),
  Popup: vi.fn(),
  Icon: vi.fn(),
  LatLng: vi.fn(),
  LatLngBounds: vi.fn(),
}))

// Mock react-leaflet with simple objects
vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(() => null),
  TileLayer: vi.fn(() => null),
  Marker: vi.fn(() => null),
  Popup: vi.fn(() => null),
  useMap: vi.fn(() => ({})),
  useMapEvents: vi.fn(() => ({})),
}))

// Mock mapbox-gl
vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(),
    Marker: vi.fn(),
    Popup: vi.fn(),
    NavigationControl: vi.fn(),
    supported: () => true,
  },
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Leaflet for testing
vi.mock('leaflet', () => ({
  map: vi.fn(),
  tileLayer: vi.fn(),
  marker: vi.fn(),
  icon: vi.fn(),
  Map: vi.fn(),
  TileLayer: vi.fn(),
  Marker: vi.fn(),
  Icon: vi.fn(),
}))

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(({ children }) => children),
  TileLayer: vi.fn(() => null),
  Marker: vi.fn(() => null),
  Popup: vi.fn(({ children }) => children),
  useMap: vi.fn(() => ({})),
  useMapEvents: vi.fn(() => ({})),
}))

// Mock mapbox-gl
vi.mock('mapbox-gl', () => ({
  Map: vi.fn(),
  NavigationControl: vi.fn(),
  GeolocateControl: vi.fn(),
  ScaleControl: vi.fn(),
}))
