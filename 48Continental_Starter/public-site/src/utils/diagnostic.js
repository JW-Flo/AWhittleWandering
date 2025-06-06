
/* eslint-env browser */
/**
 * Map Coordinate Diagnostic Utility
 * This script runs diagnostics on map coordinates to help troubleshoot rendering issues
 */

(function() {
  console.log('🔍 Starting map coordinate diagnostics...');
  
  // Check if MapBox is loaded
  if (!window.mapboxgl) {
    console.error('❌ MapBox GL not loaded!');
    return;
  }
  
  console.log('✅ MapBox GL version:', window.mapboxgl.version);
  console.log('✅ MapBox access token:', window.mapboxgl.accessToken ? 'Present' : 'Missing');
  
  // Check trip data
  async function checkTripData() {
    try {
      const response = await fetch('/src/data/trip-data.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch trip data: ${response.status}`);
      }
      
      const tripData = await response.json();
      console.log('✅ Trip data loaded with', tripData.stops.length, 'stops');
      
      // Validate coordinates
      let validCoords = 0;
      let invalidCoords = 0;
      
      tripData.stops.forEach((stop, index) => {
        // Check for latitude/longitude properties
        const hasLatLng = stop.latitude !== undefined && stop.longitude !== undefined;
        
        // Check for coordinates array
        const hasCoords = Array.isArray(stop.coordinates) && stop.coordinates.length === 2;
        
        // Check values are valid numbers in proper ranges
        let validLatLng = false;
        let validCoords = false;
        
        if (hasLatLng) {
          validLatLng = 
            typeof stop.latitude === 'number' && !isNaN(stop.latitude) &&
            typeof stop.longitude === 'number' && !isNaN(stop.longitude) &&
            Math.abs(stop.latitude) <= 90 &&
            Math.abs(stop.longitude) <= 180;
        }
        
        if (hasCoords) {
          validCoords = 
            typeof stop.coordinates[0] === 'number' && !isNaN(stop.coordinates[0]) &&
            typeof stop.coordinates[1] === 'number' && !isNaN(stop.coordinates[1]) &&
            Math.abs(stop.coordinates[0]) <= 180 && // Longitude first in GeoJSON
            Math.abs(stop.coordinates[1]) <= 90;  // Latitude second in GeoJSON
        }
        
        if (validLatLng && validCoords) {
          validCoords++;
          
          // Cross-check if the values are consistent
          const coordsMatch = stop.longitude === stop.coordinates[0] && stop.latitude === stop.coordinates[1];
          if (!coordsMatch) {
            console.warn(`⚠️ Stop ${index} (${stop.location}) has inconsistent coordinates:
              latitude/longitude: [${stop.latitude}, ${stop.longitude}]
              coordinates: [${stop.coordinates[0]}, ${stop.coordinates[1]}]
            `);
          }
        } else {
          invalidCoords++;
          console.error(`❌ Stop ${index} (${stop.location}) has invalid coordinates:
            hasLatLng: ${hasLatLng}, validLatLng: ${validLatLng}
            hasCoords: ${hasCoords}, validCoords: ${validCoords}
            Data: `, stop);
        }
      });
      
      console.log(`Coordinate validation: ${validCoords} valid, ${invalidCoords} invalid`);
      
      // Also check GeoJSON format
      const geoResponse = await fetch('/src/data/trip-data.geojson');
      if (!geoResponse.ok) {
        throw new Error(`Failed to fetch GeoJSON data: ${geoResponse.status}`);
      }
      
      const geoData = await geoResponse.json();
      console.log('✅ GeoJSON data loaded with', geoData.features.length, 'features');
      
      // Identify feature types
      const featureTypes = {};
      geoData.features.forEach(feature => {
        const type = feature.geometry.type;
        featureTypes[type] = (featureTypes[type] || 0) + 1;
      });
      
      console.log('Feature types:', featureTypes);
      
      // Check LineString coordinates for route
      const routeFeature = geoData.features.find(f => f.geometry.type === 'LineString');
      if (routeFeature) {
        console.log(`Route has ${routeFeature.geometry.coordinates.length} points`);
        
        // Check first few and last few coordinates
        const firstFew = routeFeature.geometry.coordinates.slice(0, 3);
        const lastFew = routeFeature.geometry.coordinates.slice(-3);
        
        console.log('First few route coordinates:', firstFew);
        console.log('Last few route coordinates:', lastFew);
        
        // Check for valid longitude/latitude order in GeoJSON
        let invalidRoutePoints = 0;
        routeFeature.geometry.coordinates.forEach((coord, i) => {
          if (Math.abs(coord[0]) > 180 || Math.abs(coord[1]) > 90) {
            console.error(`❌ Invalid route coordinate at index ${i}:`, coord);
            invalidRoutePoints++;
          }
        });
        
        if (invalidRoutePoints === 0) {
          console.log('✅ All route coordinates are valid');
        } else {
          console.error(`❌ Found ${invalidRoutePoints} invalid route coordinates`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking trip data:', error);
    }
  }
  
  checkTripData();
  
  console.log('🔍 Map coordinate diagnostics complete');
})();
