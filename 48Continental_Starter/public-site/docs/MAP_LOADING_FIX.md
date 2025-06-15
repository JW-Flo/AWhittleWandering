# Map Loading State Fix

## Issue

The map was loading partially but would get stuck with a persistent "Loading map..." message overlay, making it difficult to interact with the map.

## Root Cause

The issue stemmed from the loading state management in the Map component:

1. The `loading` state was set to `true` initially, but there was no code path to set it back to `false`
2. Even when the map loaded successfully, the loading indicator remained visible
3. Error cases were not properly handling the loading state
4. No timeout mechanism existed to hide the loading indicator if the map load event never fired

## Implemented Fixes

1. **Added proper loading state management:**
   - Set `loading` to `false` when the map loads successfully
   - Set `loading` to `false` when map initialization errors occur
   - Set `loading` to `false` when Mapbox GL errors occur

2. **Added safety timeout:**
   - Implemented a 10-second safety timeout to hide the loading indicator
   - This ensures users aren't stuck with a loading screen if events don't fire correctly

3. **Improved cleanup:**
   - Added cleanup for the safety timeout in the useEffect cleanup function
   - Updated dependency array to include `loading` state

4. **Created test page:**
   - Added a diagnostic test page at `/test-map-loading.html`
   - This page can help diagnose map loading issues outside the main app

## Code Changes

```jsx
// 1. Added loading state management to map's load event
map.current.on('load', () => {
  console.log('[Map] Mapbox map loaded successfully');
  setMapInitialized(true);
  setLoading(false); // Set loading to false when map is loaded successfully

  // After map is loaded, add layers
  if (tripData) {
    initializeMapLayers(map.current, tripData);
  }
});

// 2. Added safety timeout
const loadingSafetyTimeout = setTimeout(() => {
  if (loading) {
    console.log('[Map] Safety timeout triggered - hiding loading indicator');
    setLoading(false);
  }
}, 10000); // 10 seconds timeout

// 3. Added loading state management to error handlers
map.current.on('error', (e) => {
  console.error('[Map] Mapbox error:', e);
  setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
  setLoading(false); // Set loading to false on error
});

// 4. Added loading state management to catch block
catch (error) {
  console.error('[Map] Critical initialization error:', error);
  setMapError(`Failed to initialize map: ${error.message}`);
  setLoading(false); // Set loading to false on initialization error
}

// 5. Improved cleanup function
return () => {
  clearTimeout(loadingSafetyTimeout); // Clear the safety timeout
  if (map.current) {
    map.current.remove();
    map.current = null;
  }
};
```

## Verification

The changes were tested with a local build and served with the development server. The map now correctly:

1. Shows the loading indicator while initializing
2. Hides the loading indicator when the map loads successfully
3. Hides the loading indicator if there's an error
4. Has a safety timeout to prevent users from being stuck with a loading screen

## Future Improvements

1. Add loading state as a prop to make it testable
2. Implement more comprehensive error recovery mechanisms
3. Add telemetry to track map loading performance and failure modes
4. Enhance the fallback UI for users on slow connections or when map fails to load
