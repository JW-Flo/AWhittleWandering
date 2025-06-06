/**
 * Script to convert the 48 Continental USA itinerary from CSV to JSON
 * and upload it to the Cloudflare KV namespace
 */

import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// City coordinates - normally we would use a geocoding API, but for speed we'll hardcode major locations
const cityCoordinates = {
  "Corpus Christi": { latitude: 27.8006, longitude: -97.3964 },
  Tucson: { latitude: 32.2226, longitude: -110.9747 },
  "Grand Canyon": { latitude: 36.1069, longitude: -112.1129 },
  "Las Vegas": { latitude: 36.1699, longitude: -115.1398 },
  "Los Angeles": { latitude: 34.0522, longitude: -118.2437 },
  Yosemite: { latitude: 37.8651, longitude: -119.5383 },
  Colfax: { latitude: 39.1021, longitude: -120.9531 },
  "Cannon Beach": { latitude: 45.8918, longitude: -123.9615 },
  Seattle: { latitude: 47.6062, longitude: -122.3321 },
  Olympia: { latitude: 47.0379, longitude: -122.9007 },
  Yellowstone: { latitude: 44.428, longitude: -110.5885 },
  Provo: { latitude: 40.2338, longitude: -111.6585 },
  "Salt Lake City": { latitude: 40.7608, longitude: -111.891 },
  Lincoln: { latitude: 40.8136, longitude: -96.7026 },
  "Des Moines": { latitude: 41.5868, longitude: -93.625 },
  Chicago: { latitude: 41.8781, longitude: -87.6298 },
  Madison: { latitude: 43.0731, longitude: -89.4012 },
  "Traverse City": { latitude: 44.7631, longitude: -85.6206 },
  Cleveland: { latitude: 41.4993, longitude: -81.6944 },
  Erie: { latitude: 42.1292, longitude: -80.0851 },
  "Niagara Falls": { latitude: 43.0962, longitude: -79.0377 },
  Burlington: { latitude: 44.4759, longitude: -73.2121 },
  Hartford: { latitude: 41.7658, longitude: -72.6734 },
  Portland: { latitude: 43.6591, longitude: -70.2568 },
  "Bar Harbor": { latitude: 44.3876, longitude: -68.2039 },
  Boston: { latitude: 42.3601, longitude: -71.0589 },
  Providence: { latitude: 41.824, longitude: -71.4128 },
  "Hudson Valley": { latitude: 41.7065, longitude: -73.9283 },
  Newark: { latitude: 40.7357, longitude: -74.1724 },
  Baltimore: { latitude: 39.2904, longitude: -76.6122 },
  Richmond: { latitude: 37.5407, longitude: -77.436 },
  Charleston: { latitude: 32.7765, longitude: -79.9311 },
  Columbia: { latitude: 34.0007, longitude: -81.0348 },
  Savannah: { latitude: 32.0809, longitude: -81.0912 },
  Gainesville: { latitude: 29.6516, longitude: -82.3248 },
  Sarasota: { latitude: 27.3364, longitude: -82.5307 },
  Monroe: { latitude: 34.9855, longitude: -80.5495 },
  "Max Patch": { latitude: 35.7971, longitude: -82.9567 },
  Knoxville: { latitude: 35.9606, longitude: -83.9207 },
  Lexington: { latitude: 38.0406, longitude: -84.5037 },
  "St. Louis": { latitude: 38.627, longitude: -90.1994 },
  Memphis: { latitude: 35.1495, longitude: -90.049 },
  Ozarks: { latitude: 37.8723, longitude: -92.9199 },
  "Oklahoma City": { latitude: 35.4676, longitude: -97.5164 },
  Amarillo: { latitude: 35.222, longitude: -101.8313 },
  "San Angelo": { latitude: 31.4638, longitude: -100.437 },
  Austin: { latitude: 30.2672, longitude: -97.7431 },
};

// Parse the date string like "6/4–6/5" or "6/4"
function parseDateRange(dateStr) {
  const year = new Date().getFullYear();

  if (dateStr.includes("–")) {
    const [start, end] = dateStr.split("–");
    const [startMonth, startDay] = start.split("/").map((n) => parseInt(n, 10));
    const [endMonth, endDay] = end.split("/").map((n) => parseInt(n, 10));

    return {
      startDate: `${year}-${startMonth.toString().padStart(2, "0")}-${startDay
        .toString()
        .padStart(2, "0")}`,
      endDate: `${year}-${endMonth.toString().padStart(2, "0")}-${endDay
        .toString()
        .padStart(2, "0")}`,
    };
  } else {
    const [month, day] = dateStr.split("/").map((n) => parseInt(n, 10));
    const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    return {
      startDate: formattedDate,
      // No end date for single-day entries
    };
  }
}

// Parse the CSV
function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");

  const stops = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const rowData = {};

    // Map CSV columns to our data structure
    headers.forEach((header, index) => {
      rowData[header.trim()] = values[index]?.trim() || "";
    });

    // Parse the date range
    const dateRange = parseDateRange(rowData["Date(s)"]);

    // Get coordinates for the location
    const locationName = rowData["Location"];
    const coordinates = cityCoordinates[locationName] || null;

    // Create the stop object
    const stop = {
      ...dateRange,
      location: locationName,
      state: rowData["State"],
      personSeen: rowData["Person Seen"] || undefined,
      duration: rowData["Duration"],
      notes: rowData["Notes"] || undefined,
      coordinates: coordinates,
    };

    stops.push(stop);
  }

  return {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    stops,
  };
}

// Main function
async function main() {
  try {
    // Read the CSV file
    const csvPath = path.resolve(
      __dirname,
      "../48Continental_Revised_Final_Itinerary.csv"
    );
    const csvContent = fs.readFileSync(csvPath, "utf8");

    // Parse CSV to JSON
    const itinerary = parseCSV(csvContent);

    // Save the JSON to a temporary file
    const jsonPath = path.resolve(__dirname, "../temp-itinerary.json");
    fs.writeFileSync(jsonPath, JSON.stringify(itinerary, null, 2));

    console.log("Itinerary JSON created successfully");

    // Save the JSON permanently
    const finalJsonPath = path.resolve(__dirname, "../itinerary.json");
    fs.copyFileSync(jsonPath, finalJsonPath);

    console.log("Itinerary JSON file created successfully at:", finalJsonPath);
    console.log("Now you can use this command to upload to KV namespace:");
    console.log(
      `npx wrangler kv:key put --binding=ITINERARY_KV "itinerary_v1" --path=${finalJsonPath}`
    );

    // Clean up the temporary file
    fs.unlinkSync(jsonPath);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the script
main();
