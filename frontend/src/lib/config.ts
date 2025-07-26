// Environment configuration for secure API key storage
export const API_KEYS = {
  TESSIE_API_KEY: import.meta.env.VITE_TESSIE_API_KEY || '64rbSGkMgblAZ5TaivBzokOGKTy72fYw',
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA',
} as const;

// Store keys securely in localStorage on first use
export const secureKeyStorage = {
  storeKeys: (tessieKey?: string, mapboxToken?: string) => {
    if (tessieKey) {
      localStorage.setItem('tessie_api_key', tessieKey);
    }
    if (mapboxToken) {
      localStorage.setItem('mapbox_token', mapboxToken);
    }
  },
  
  getStoredKeys: () => {
    return {
      tessieKey: localStorage.getItem('tessie_api_key') || import.meta.env.VITE_TESSIE_API_KEY,
      mapboxToken: localStorage.getItem('mapbox_token') || import.meta.env.VITE_MAPBOX_TOKEN
    };
  },
  
  clearKeys: () => {
    localStorage.removeItem('tessie_api_key');
    localStorage.removeItem('mapbox_token');
  }
};
