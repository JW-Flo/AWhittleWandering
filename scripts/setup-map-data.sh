#!/bin/bash
# setup-map-data.sh
#
# This script makes the coordinate processing scripts executable and runs them
# to generate and integrate the itinerary data with coordinates.

# Make scripts executable
chmod +x scripts/generate-itinerary-csv.cjs
chmod +x scripts/integrate-itinerary-coordinates.cjs

# Create data directory if it doesn't exist
mkdir -p 48Continental_Starter/public-site/src/data

echo "========================================"
echo "Generating itinerary CSV with coordinates"
echo "========================================"
node scripts/generate-itinerary-csv.cjs

echo "========================================"
echo "Integrating coordinates with map data"
echo "========================================"
node scripts/integrate-itinerary-coordinates.cjs

echo "========================================"
echo "Setup complete!"
echo "========================================"
echo "Data files have been created at:"
echo "- 48Continental_Final_Itinerary_with_Coords.csv"
echo "- 48Continental_Starter/public-site/src/data/trip-data.json"
echo "- 48Continental_Starter/public-site/src/data/trip-data.geojson"
echo ""
echo "You can now run your development server to see the map with the new data."
