# 48 Continental USA Site Documentation

## Site Functionality Baseline

This document establishes the baseline functionality for the 48 Continental USA site. It serves as the objective standard for verifying that the site is functioning correctly.

## Core Components

### 1. Map Display
The map should:
- Load completely with all map tiles visible
- Display within 5 seconds on standard connections
- Be centered on the current vehicle location
- Show the complete route path as a colored line
- Display waypoints/stops as marker icons
- Allow zooming and panning
- Not display "MapBox GL JS: Invalid access token" errors

### 2. Vehicle Data
The vehicle component should:
- Show a vehicle marker at the current location
- Update position at regular intervals (real or simulated)
- Display current vehicle stats (battery, speed, etc.)
- Properly format all values with appropriate units
- Handle disconnected state gracefully

### 3. Journey Information
The journey component should:
- Display the complete itinerary 
- Show timing information for stops
- Highlight the current/next stop
- Calculate remaining distance correctly
- Show state progression data

### 4. States Tracking
The states component should:
- Display a count of states visited
- Show which states have been visited
- Highlight the current state
- Update when crossing state boundaries

### 5. UI Navigation
The UI should:
- Have working tabs for all main sections
- Allow switching between views
- Properly size and display on desktop and mobile
- Handle window resizing events
- Maintain state between tab switches

## Error States

The site should gracefully handle:
- Network disconnections
- API failures
- Missing map tokens
- Map loading failures
- Missing vehicle data

## Expected Performance

- Initial load: < 3 seconds
- Map initialization: < 2 seconds
- Data refresh interval: 30 seconds or configurable
- Smooth transitions between states
- No visible UI freezing during data operations

## Known Limitations

- Weather data may be delayed up to 15 minutes
- Simulated vehicle data used when real data unavailable
- Map performance may vary on older devices

## Verification Process

1. Use the `verify-site.sh` script for automated checks
2. Complete the `verification-checklist.md` for manual verification
3. Compare results against this baseline document
4. Document any deviations with screenshots and browser console logs

Always verify the site after:
- Deployment to production
- Changes to the map component
- Changes to data providers
- Updates to environment variables
