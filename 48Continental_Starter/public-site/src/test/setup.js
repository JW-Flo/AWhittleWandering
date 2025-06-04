import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock MapBox GL JS since it requires a browser environment
vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(),
    Marker: vi.fn(),
    NavigationControl: vi.fn(),
  },
}))

// Mock browser APIs that might not be available in test environment
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Intersection Observer
window.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock fetch
window.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
}
window.localStorage = localStorageMock

// Mock environment variables
vi.stubEnv('MAPBOX_TOKEN', 'test_mapbox_token')
vi.stubEnv('TESSIE_API_TOKEN', 'test_tessie_token')
vi.stubEnv('WEATHER_API_KEY', 'test_weather_key')
