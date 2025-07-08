import mapboxgl from 'mapbox-gl';

// Initialize Mapbox public token
mapboxgl.accessToken = process.env.VITE_MAPBOX_PUBLIC_TOKEN || 'HARDCODED_FALLBACK_TOKEN';

export default mapboxgl;