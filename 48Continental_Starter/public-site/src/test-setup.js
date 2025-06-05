import { vi } from "vitest";

// Mock mapbox-gl
vi.mock("mapbox-gl", () => {
  const mockFn = vi.fn();

  return {
    default: {
      accessToken: "",
      Map: vi.fn().mockImplementation(() => ({
        addControl: mockFn,
        removeControl: mockFn,
        on: mockFn,
        off: mockFn,
        remove: mockFn,
        addSource: mockFn,
        removeSource: mockFn,
        addLayer: mockFn,
        removeLayer: mockFn,
        getSource: vi.fn(() => null),
        getLayer: vi.fn(() => null),
        setStyle: mockFn,
        flyTo: mockFn,
        getCanvas: vi.fn(() => ({ style: { cursor: "" } })),
      })),
      NavigationControl: vi.fn(),
      FullscreenControl: vi.fn(),
      GeolocateControl: vi.fn(),
      ScaleControl: vi.fn(),
      Marker: vi.fn().mockImplementation(() => ({
        setLngLat: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        setPopup: vi.fn().mockReturnThis(),
        getPopup: vi.fn(() => null),
      })),
      Popup: vi.fn().mockImplementation(() => ({
        setLngLat: vi.fn().mockReturnThis(),
        setHTML: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
      })),
    },
  };
});

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_MAPBOX_TOKEN: "pk.test-token",
  },
  writable: true,
});
