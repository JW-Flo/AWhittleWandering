# Map Coordinate Format Fix

## Problem Solved

The 48 Continental map component was failing to display locations correctly due to coordinate format inconsistencies. Different data sources were providing coordinates in different formats:

- Some as `[longitude, latitude]` arrays (MapBox format)
- Some as `[latitude, longitude]` arrays (common in some libraries)
- Some as objects with `{latitude, longitude}` properties
- Some as objects with `{lat, lng}` properties
- Some as nested objects like `{location: {latitude, longitude}}`

This inconsistency caused markers to be placed incorrectly or not at all, routes to be drawn incorrectly, and destination markers to be missing or misplaced.

## Solution Implemented

### 1. Centralized Coordinate Normalization

Created a utility function `ensureMapboxFormat()` in `src/utils/mapUtils.js` that:
- Accepts any of the common coordinate formats
- Validates the coordinates are within valid ranges
- Detects and fixes swapped latitude/longitude values 
- Returns consistent `[longitude, latitude]` arrays (MapBox format)
- Returns `null` for invalid coordinates to prevent errors

### 2. Simplified Component Logic

- Removed duplicate coordinate handling code from components
- Updated all map components to use the centralized utility
- Improved error handling and logging for coordinate issues
- Added better UI error states to help diagnose issues

### 3. Integration Points

The coordinate normalization utility is now used in:
- `SimpleMapFix.jsx` component (new fixed implementation)
- `Map.jsx` component (main map component)
- Any new components that need to work with map coordinates

## Testing

The fix can be tested using the `/map-fix-test` route, which provides test cases with different coordinate formats.

### Test Cases Include:

1. **Standard Format**: Normal `[longitude, latitude]` arrays
2. **Reversed Format**: Swapped `[latitude, longitude]` arrays
3. **Object Format**: `{latitude, longitude}` objects
4. **GeoJSON Format**: `{lng, lat}` objects
5. **Mixed Formats**: Route with multiple coordinate formats

## Technical Details

### Key Files Modified:

- `src/utils/mapUtils.js` - Added the `ensureMapboxFormat()` utility
- `src/components/SimpleMapFix.jsx` - New component that properly handles coordinates
- `src/components/Map.jsx` - Updated to use the centralized coordinate utility
- `src/pages/MapFixTestPage.jsx` - Test page with various coordinate formats
- `src/pages/MapFixTestPage.css` - Improved styles for the test page

### Implementation Notes:

- The utility prioritizes longitude/latitude detection based on valid ranges
- Values outside the range of -180 to 180 for longitude and -90 to 90 for latitude are considered invalid
- The code handles object destructuring safely to prevent runtime errors
- Debug logging is included to trace coordinate transformations when needed

## Future Improvements

1. Add unit tests for the coordinate utility to ensure it handles all edge cases
2. Standardize all data sources to use a consistent coordinate format
3. Add visual indicators when coordinates are auto-corrected
4. Consider creating a custom MapBox layer for better performance with large datasets
