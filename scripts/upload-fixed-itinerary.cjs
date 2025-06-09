#!/usr/bin/env node

/**
 * Upload Fixed Itinerary Data to Cloudflare KV
 *
 * This script uploads the itinerary-full.json data to the ITINERARY_KV namespace
 * and also creates the current_day data entry for proper dashboard rendering
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const ITINERARY_FILE = path.join(__dirname, "..", "itinerary-full.json");
const KV_NAMESPACE = "ITINERARY_KV";
const NAMESPACE_ID = "41e8cca6911d47338647d950d2344d91"; // From wrangler.toml

// Main function to process and upload the data
async function uploadFixedItinerary() {
  try {
    console.log(`Reading itinerary data from ${ITINERARY_FILE}`);
    const itineraryData = JSON.parse(fs.readFileSync(ITINERARY_FILE, "utf8"));

    // Create temporary directory if it doesn't exist
    const tempDir = path.join(__dirname, "..", ".temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // 1. Upload the complete itinerary data
    console.log("Uploading complete itinerary data...");
    const tempFullFile = path.join(tempDir, "itinerary-full.json");
    fs.writeFileSync(tempFullFile, JSON.stringify(itineraryData, null, 2));

    const itineraryCommand = `cd edge-worker && npx wrangler kv key put itinerary --binding=${KV_NAMESPACE} --path="${tempFullFile.replace(
      /\\/g,
      "/"
    )}"`;
    console.log(`Executing: ${itineraryCommand}`);
    execSync(itineraryCommand, { stdio: "inherit" });

    // 2. Create and upload current day data
    console.log("Creating current day data...");
    const currentStop =
      itineraryData.stops.find((stop) => stop.isCurrent === true) ||
      itineraryData.stops[0];
    const nextStop = itineraryData.stops[1]; // The next stop after current

    const currentDayData = {
      currentDay: {
        date: new Date().toISOString().split("T")[0],
        location: currentStop.location,
        state: currentStop.state,
        notes: currentStop.notes,
        coordinates: currentStop.coordinates,
        isFirstDay: true,
        isLastDay: false,
        id: `day_${new Date().toISOString().split("T")[0].replace(/-/g, "")}`,
      },
      nextDay: {
        date: new Date().toISOString().split("T")[0],
        location: nextStop.location,
        state: nextStop.state,
        notes: nextStop.notes,
        coordinates: nextStop.coordinates,
        eta: nextStop.eta,
      },
      visitedStates: itineraryData.progress.statesVisited,
      currentDayIndex: itineraryData.progress.currentDay - 1,
      tripComplete: false,
      lastUpdated: new Date().toISOString(),
    };

    const tempCurrentDayFile = path.join(tempDir, "current-day.json");
    fs.writeFileSync(
      tempCurrentDayFile,
      JSON.stringify(currentDayData, null, 2)
    );

    const currentDayCommand = `cd edge-worker && npx wrangler kv key put current_day --binding=${KV_NAMESPACE} --path="${tempCurrentDayFile.replace(
      /\\/g,
      "/"
    )}"`;
    console.log(`Executing: ${currentDayCommand}`);
    execSync(currentDayCommand, { stdio: "inherit" });

    // 3. Create a separate vehicle data entry
    console.log("Creating vehicle data...");
    const vehicleData = {
      ...itineraryData.vehicle,
      lastUpdated: new Date().toISOString(),
    };

    const tempVehicleFile = path.join(tempDir, "vehicle-data.json");
    fs.writeFileSync(tempVehicleFile, JSON.stringify(vehicleData, null, 2));

    const vehicleCommand = `cd edge-worker && npx wrangler kv key put vehicle --binding=${KV_NAMESPACE} --path="${tempVehicleFile.replace(
      /\\/g,
      "/"
    )}"`;
    console.log(`Executing: ${vehicleCommand}`);
    execSync(vehicleCommand, { stdio: "inherit" });

    // 4. Create trip stats entry
    console.log("Creating trip stats data...");
    const tripStats = {
      totalDistance: itineraryData.meta.totalDistance,
      milesCompleted: itineraryData.progress.milesCompleted,
      milesRemaining: itineraryData.progress.milesRemaining,
      percentComplete: itineraryData.progress.percentComplete,
      statesVisited: itineraryData.progress.statesVisited,
      statesRemaining: 48 - itineraryData.progress.statesVisited.length,
      currentState: itineraryData.progress.currentState,
      lastUpdated: new Date().toISOString(),
    };

    const tempStatsFile = path.join(tempDir, "trip-stats.json");
    fs.writeFileSync(tempStatsFile, JSON.stringify(tripStats, null, 2));

    const statsCommand = `cd edge-worker && npx wrangler kv key put trip_stats --binding=${KV_NAMESPACE} --path="${tempStatsFile.replace(
      /\\/g,
      "/"
    )}"`;
    console.log(`Executing: ${statsCommand}`);
    execSync(statsCommand, { stdio: "inherit" });

    console.log("All data uploaded successfully!");

    // Clean up temporary files
    fs.unlinkSync(tempFullFile);
    fs.unlinkSync(tempCurrentDayFile);
    fs.unlinkSync(tempVehicleFile);
    fs.unlinkSync(tempStatsFile);

    // Also update the .current_trip_day.json file for MCP server
    fs.writeFileSync(
      path.join(__dirname, "..", ".current_trip_day.json"),
      JSON.stringify(currentDayData, null, 2)
    );

    return true;
  } catch (error) {
    console.error("Error uploading itinerary data:", error);
    throw error;
  }
}

// Run the script
uploadFixedItinerary()
  .then(() => {
    console.log("✅ Fixed itinerary data uploaded successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
