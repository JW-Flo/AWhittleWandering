/* eslint-env browser */
/**
 * Map Utilities
 *
 * Standardized functions for handling map coordinates and common MapBox operations
 */

/**
 * Ensures coordinates are in the [longitude, latitude] format required by MapBox
 *
 * @param {Array|Object} coords - Coordinates to format
 * @returns {Array|null} - [longitude, latitude] array or null if invalid
 */
export const ensureMapboxFormat = (coords) => {
  // Handle null or undefined
  if (!coords) return null;

  // Already an array [?, ?]
  if (Array.isArray(coords) && coords.length === 2) {
    const [first, second] = coords.map((v) =>
      typeof v === "string" ? parseFloat(v) : v
    );

    // Skip if invalid numbers
    if (isNaN(first) || isNaN(second)) return null;

    // Check if values are within valid ranges
    // Longitude: -180 to 180, Latitude: -90 to 90
    const firstIsValidLng = Math.abs(first) <= 180;
    const secondIsValidLat = Math.abs(second) <= 90;

    // If both are valid in their current positions, return as is
    if (firstIsValidLng && secondIsValidLat) {
      return [first, second]; // Already [longitude, latitude]
    }

    // If first looks like latitude and second like longitude (swapped)
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
      return [second, first]; // Swap to [longitude, latitude]
    }

    // If both are out of range, return null
    return null;
  }

  // Object with lat/lng or latitude/longitude properties
  if (typeof coords === "object") {
    let lng, lat;

    // Handle latitude/longitude properties
    if (coords.latitude !== undefined && coords.longitude !== undefined) {
      lat =
        typeof coords.latitude === "string"
          ? parseFloat(coords.latitude)
          : coords.latitude;
      lng =
        typeof coords.longitude === "string"
          ? parseFloat(coords.longitude)
          : coords.longitude;
    }
    // Handle lat/lng properties (GeoJSON style)
    else if (coords.lat !== undefined && coords.lng !== undefined) {
      lat =
        typeof coords.lat === "string" ? parseFloat(coords.lat) : coords.lat;
      lng =
        typeof coords.lng === "string" ? parseFloat(coords.lng) : coords.lng;
    }
    // Handle coordinates array property
    else if (
      coords.coordinates &&
      Array.isArray(coords.coordinates) &&
      coords.coordinates.length === 2
    ) {
      return ensureMapboxFormat(coords.coordinates);
    }

    // Skip if invalid numbers
    if (lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat))
      return null;

    // Check if values are within valid ranges
    if (Math.abs(lng) <= 180 && Math.abs(lat) <= 90) {
      return [lng, lat]; // [longitude, latitude]
    }

    // Check if they're swapped
    if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180) {
      return [lat, lng]; // [longitude, latitude] with swapped values
    }

    return null;
  }

  return null;
};

/**
 * Creates an SVG marker element for the map
 *
 * @param {string} type - Marker type (waypoint, lodging, charging-station, vehicle)
 * @param {string} color - Optional color override
 * @returns {HTMLElement} - DOM element for the marker
 */
export const createMarkerElement = (type, color) => {
  const el = document.createElement("div");
  el.className = `marker-icon marker-${type}`;

  const iconColor =
    color ||
    {
      waypoint: "#FFC107",
      lodging: "#2196F3",
      "charging-station": "#4CAF50",
      vehicle: "#FF5722",
    }[type] ||
    "#0066cc";

  // SVG icons for map markers
  const SVG_ICONS = {
    "charging-station": `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="${iconColor}" d="M14.5,11l-1.5,-3h2l3,7h-5v4l-6,-8h3l1.5,-3h3z"/>
            </svg>
        `,
    lodging: `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="${iconColor}" d="M19,7h-8v7H3V5H1v15h2v-3h18v3h2v-9C23,8.79,21.21,7,19,7z M15,13.5A1.5,1.5,0,1,1,16.5,12,1.5,1.5,0,0,1,15,13.5z"/>
            </svg>
        `,
    waypoint: `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="${iconColor}" d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z"/>
            </svg>
        `,
    vehicle: `
            <svg viewBox="0 0 24 24" width="36" height="36">
                <path fill="${iconColor}" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
        `,
  };

  el.innerHTML = SVG_ICONS[type] || SVG_ICONS["waypoint"];

  // Add pulse effect for vehicle
  if (type === "vehicle") {
    el.classList.add("vehicle-marker");
  }

  return el;
};

/**
 * Converts stops data to GeoJSON format
 *
 * @param {Array} stops - Array of stop objects
 * @returns {Object} - GeoJSON FeatureCollection
 */
export const stopsToGeoJSON = (stops) => {
  if (!stops || !Array.isArray(stops)) return null;

  const features = stops
    .map((stop) => {
      const coords = ensureMapboxFormat(stop);

      // Skip stops with invalid coordinates
      if (!coords) return null;

      return {
        type: "Feature",
        properties: {
          id: stop.id || `stop-${Math.random().toString(36).substring(2, 9)}`,
          name: stop.name || "Unknown",
          description: stop.description || "No description",
          type: stop.type || "waypoint",
          charging: !!stop.charging,
          overnight: !!stop.overnight,
          state: stop.state,
        },
        geometry: {
          type: "Point",
          coordinates: coords,
        },
      };
    })
    .filter(Boolean);

  return {
    type: "FeatureCollection",
    features,
  };
};

/**
 * Converts route data to GeoJSON format
 *
 * @param {Array} route - Array of route points
 * @returns {Object} - GeoJSON Feature with LineString geometry
 */
export const routeToGeoJSON = (route) => {
  if (!route || !Array.isArray(route) || route.length < 2) return null;

  const coordinates = route
    .map((point) => ensureMapboxFormat(point))
    .filter(Boolean);

  if (coordinates.length < 2) return null;

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
};
