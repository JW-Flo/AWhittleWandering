# Map Rendering Fix Task

## Overview

The map component in the 48 Continental USA project is experiencing rendering issues. This document outlines the current status, identified problems, and suggested approaches for resolving the map functionality.

## Components Involved

### 1. Map.jsx
- Primary component responsible for rendering the MapBox GL map
- Handles initialization, layer management, and map interactions
- Contains event listeners for map loading and errors
- Implements vehicle and route visualizations

### 2. useTripData.js
- Custom React hook that fetches trip data from the API
- Processes and transforms data for map consumption
- Manages fallback to local data when API is unavailable
- Handles data format normalization

### 3. update-itinerary-with-coords.cjs
- Script for processing CSV itinerary data into JSON formats
- Responsible for generating GeoJSON for map visualization
- Manages coordinate formatting and trip data structure

### 4. MapDebug.jsx
- Debugging tool for inspecting map state and data
- Identifies coordinate format inconsistencies
- Monitors MapBox errors and layer issues
- Provides tools for refreshing map layers

## Identified Issues

### 1. Coordinate Format Inconsistencies
- **Problem**: MapBox requires coordinates in `[longitude, latitude]` format, but data sources may use inconsistent formats
- **Evidence**: Debug panel shows potential coordinate swapping in route and stop points
- **Impact**: Incorrectly formatted coordinates cause route lines and markers to render in wrong locations or not at all

### 2. Data Pipeline Problems
- **Problem**: Data transformation between API, local files, and map rendering has inconsistencies
- **Evidence**: Route data structure differs between API responses and MapBox expectations
- **Impact**: Map fails to initialize properly with the provided data

### 3. MapBox Integration Issues
- **Problem**: Map initialization and layer management may have configuration problems
- **Evidence**: Map container remains empty despite data being available
- **Impact**: No visual rendering of the map or trip data

### 4. API Connection and Authentication
- **Problem**: API endpoints may not be properly configured or accessible
- **Evidence**: Network requests fail or return incorrect formats
- **Impact**: Fallback to local data may not be working as expected

## Debugging Steps

### 1. Coordinate Format Validation
- Use the MapDebug component to identify any coordinate format issues
- Check for instances where latitude and longitude are swapped
- Verify that all GeoJSON features follow the `[longitude, latitude]` format
- Update coordinate handling in useTripData.js to ensure proper normalization

### 2. Data Pipeline Inspection
- Add console logging at key points in the data flow
- Verify API response formats against expected structures
- Confirm that local fallback data is properly formatted
- Ensure all transformations maintain correct coordinate ordering

### 3. MapBox Setup Verification
- Confirm MapBox token is valid and has necessary permissions
- Check for any console errors related to MapBox GL initialization
- Verify that container dimensions are properly set
- Test with a simplified map initialization (without custom layers)

### 4. Layer Management Debugging
- Isolate layer addition and removal logic
- Test with static GeoJSON data to eliminate API variables
- Add timeouts between layer operations to ensure proper sequencing
- Use the "Force Layer Refresh" option in MapDebug to test layer recreation

## Implementation Approach

### Short-term Fixes
1. **Coordinate Normalization Function**:
   ```javascript
   function normalizeCoordinates(point) {
     // Ensure coordinates are in [longitude, latitude] format
     if (typeof point.longitude !== 'undefined' && typeof point.latitude !== 'undefined') {
       return [point.longitude, point.latitude];
     } else if (Array.isArray(point.coordinates) && point.coordinates.length === 2) {
       // Verify ordering - longitude should typically be larger in absolute value
       // for continental US locations
       const [first, second] = point.coordinates;
       if (Math.abs(first) > Math.abs(second) || Math.abs(first) > 90) {
         return point.coordinates; // Likely already [long, lat]
       } else {
         return [second, first]; // Need to swap to [long, lat]
       }
     }
     // Fall back to defaults if no valid coordinates found
     return null;
   }
   ```

2. **Enhanced Error Handling**:
   ```javascript
   try {
     // Initialize map with more detailed error callbacks
     map.on('error', (e) => {
       console.error('MapBox Error:', e.error ? e.error : e);
       setMapError({
         message: e.error ? e.error.message : 'Unknown map error',
         details: JSON.stringify(e.error || {})
       });
     });
   } catch (error) {
     console.error('Map initialization error:', error);
     setMapError({
       message: 'Failed to initialize map',
       details: error.message
     });
   }
   ```

### Long-term Solutions
1. **Data Schema Standardization**:
   - Implement consistent data structures across all sources
   - Add runtime validation for coordinate formats
   - Create adapter functions for different data sources

2. **Map Component Refactoring**:
   - Split Map.jsx into smaller, focused components
   - Create separate components for route, stops, and vehicle
   - Implement progressive enhancement for map features

3. **Automated Testing**:
   - Add unit tests for coordinate handling
   - Create integration tests for map rendering
   - Add visual regression tests for map appearance

## Resources

- [MapBox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/api/)
- [GeoJSON Specification](https://geojson.org/)
- [React MapBox GL Examples](https://github.com/mapbox/mapbox-react-examples)
- [Coordinate Debugging Tools](https://geojson.io/)

## Next Steps

1. Implement the MapDebug component with coordinate checking
2. Add enhanced logging throughout the data pipeline
3. Create a simplified test map to verify basic MapBox integration
4. Systematically address each issue, starting with coordinate format handling
5. Document findings and solutions in the project wiki

By following this structured approach, we can systematically identify and fix the map rendering issues in the 48 Continental USA project.
