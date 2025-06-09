// Environment-based configuration
export const CONFIG = {
  mapbox: {
    token:
      import.meta.env.VITE_MAPBOX_TOKEN ||
      "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA",
    styles: {
      streets: "mapbox://styles/mapbox/streets-v11",
      satellite: "mapbox://styles/mapbox/satellite-streets-v11",
    },
  },
  api: {
    baseUrl:
      import.meta.env.VITE_API_BASE_URL ||
      "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev",
    websocket:
      import.meta.env.VITE_WEBSOCKET_ENDPOINT ||
      "wss://thewanderingwhittle-edge.workers.dev/ws",
  },
  simulation: {
    enabled: import.meta.env.VITE_USE_SIMULATED_DATA === "true",
    updateInterval: 5000,
    cacheTimeout: 5000, // Centralized TTL for cache (ms)
  },
};
