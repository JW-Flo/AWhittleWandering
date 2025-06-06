# 48Continental – Road‑Trip Site

This project tracks a 60-day Tesla road trip through all 48 contiguous U.S. states, providing real-time visualization and trip data.

---

## Map Implementation Status

The map functionality is currently experiencing loading issues. The following components have been developed:

- **Map.jsx**: Main map rendering component with MapBox GL integration
- **useTripData.js**: Custom hook for fetching and processing trip data
- **MapDebug.jsx**: Debugging tool to help diagnose coordinate format issues and map errors
- **MapEnhancements.css**: Styling for map elements, markers, and UI components

### Known Issues

- Map is not rendering properly in the application
- Possible coordinate format inconsistencies between data sources and MapBox expectations
- API integration issues may be preventing proper data flow

### Next Steps

For developers working on this project, refer to the detailed debugging task in `map-rendering-fix-task.md` which outlines specific areas to investigate.

---

## Deployment

Use `wrangler deploy` instead of `wrangler publish` for deploying Workers and Pages.

```bash
wrangler deploy
```
