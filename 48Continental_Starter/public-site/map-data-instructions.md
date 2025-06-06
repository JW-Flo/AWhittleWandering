# Map Functionality Fix Instructions

This document outlines how to fix the map functionality issues and integrate your itinerary with proper coordinates.

## What We've Created

1. **generate-itinerary-csv.cjs**: Script that takes your itinerary and creates a CSV file with proper coordinates for each stop
2. **integrate-itinerary-coordinates.cjs**: Script that converts the CSV data into both GeoJSON and JSON formats for map rendering
3. **setup-map-data.sh**: Shell script that runs both scripts in sequence and prepares all necessary data files

## How to Run the Scripts

```bash
# Make the setup script executable
chmod +x scripts/setup-map-data.sh

# Run the setup script
./scripts/setup-map-data.sh
```

This will:
1. Generate `48Continental_Final_Itinerary_with_Coords.csv` with proper coordinates
2. Create `48Continental_Starter/public-site/src/data/trip-data.json` for the application
3. Create `48Continental_Starter/public-site/src/data/trip-data.geojson` for MapBox

## Key Fixes to Map Functionality

The primary issue with the map was coordinate format inconsistency. MapBox requires coordinates in [longitude, latitude] format, but some data was in [latitude, longitude] format. Our scripts ensure:

1. All coordinates are consistently in the correct [longitude, latitude] format
2. GeoJSON is properly structured with feature collections
3. Route lines and stop markers are properly separated
4. State data is included for visited state tracking

## Testing the Map

After running the scripts:

1. Start your development server:
   ```bash
   cd 48Continental_Starter/public-site
   npm run dev
   ```

2. Open the application in your browser and verify:
   - The map loads correctly
   - Stop markers appear in the expected locations
   - The route line connects all stops properly
   - State data is correctly tracked

## Troubleshooting

If the map still doesn't render correctly:

1. Check browser console for errors
2. Verify the MapBox token is valid in your .env file
3. Confirm the data files were created successfully
4. Check data format in trip-data.json to ensure coordinates are numbers, not strings
5. Verify that the Map.jsx component is correctly importing and using the data

## Additional Enhancements

Once the basic map functionality is working, consider implementing these UI/UX enhancements:

1. Responsive design optimizations
2. Interactive timeline controls
3. Better stop marker styling
4. Improved state highlighting
5. Smoother animations and transitions
