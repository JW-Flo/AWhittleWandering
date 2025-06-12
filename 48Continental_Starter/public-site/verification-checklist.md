# The Wandering Whittle Site Verification Checklist

## Core Map Functionality
- [ ] Map loads completely (no spinning indicators)
- [ ] Map tiles are visible across the viewable area
- [ ] Map is centered on the relevant journey location
- [ ] Zoom controls function properly

## Vehicle Data
- [ ] Vehicle marker is visible on the map
- [ ] Vehicle position data updates periodically
- [ ] Vehicle information panel shows current stats
- [ ] Battery level, range, and other metrics are displayed

## Journey Information
- [ ] Complete route is visible on the map
- [ ] Waypoints/stops are correctly marked
- [ ] Journey timeline displays all planned stops
- [ ] Current journey position is highlighted

## UI Components
- [ ] All navigation tabs function correctly:
  - [ ] Journey tab
  - [ ] Vehicle tab
  - [ ] States tab
  - [ ] Any other tabs
- [ ] Slide-out panels open and close as expected
- [ ] States tracking panel shows visited states
- [ ] Current state is highlighted

## Data Integration
- [ ] API endpoints properly connected (check Network tab)
- [ ] No visible console errors related to data fetching
- [ ] Graceful fallback to simulated data when needed
- [ ] Weather data displayed if applicable

## Error Handling
- [ ] Error boundaries catch and display errors appropriately
- [ ] No uncaught exceptions in console
- [ ] User-friendly error messages where appropriate
- [ ] Debug panels properly hidden in production mode

## Performance
- [ ] Initial load time is reasonable (<3s)
- [ ] Map interactions are smooth (pan/zoom)
- [ ] No visible UI lag when interacting with components
- [ ] Memory usage remains stable (no leaks)

## Responsive Design
- [ ] Site functions correctly at multiple screen sizes
- [ ] Mobile layout adjusts appropriately
- [ ] Touch interactions work on mobile devices
- [ ] No overflow issues causing horizontal scrolling

## After Each Deployment:
1. Open Network tab in browser devtools
2. Clear cache and hard reload (Ctrl+Shift+R)
3. Verify all resources load correctly (no 404s)
4. Check for console errors
5. Verify all core functionality using this checklist
6. Test at least one interaction on each major component
7. Capture screenshots for documentation if issues found

**Last verified: [Date/Time]**
**Verified by: [Name]**
**Deployment URL: [URL]**
**Version: [Git hash or version number]**

## Notes:
*Add any observations, issues, or suggestions here*
