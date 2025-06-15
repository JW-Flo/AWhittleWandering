#!/usr/bin/env node

/**
 * Convert Final Itinerary CSV to KV-compatible format
 * Converts the AWhittleWandering_Final_With_Deanna_And_BarHarbor.csv to proper JSON format
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { execSync } = require("child_process");

// Configuration
const CSV_FILE = path.join(
  __dirname,
  "..",
  "docs",
  "AWhittleWandering_Final_With_Deanna_And_BarHarbor.csv"
);
const KV_NAMESPACE = "ITINERARY_KV";

// ANSI color codes
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

/**
 * City coordinates mapping for accurate location data
 */
const cityCoordinates = {
  "Fort Stockton, TX": { lat: 30.8896, lng: -102.8779 },
  "El Paso, TX": { lat: 31.7619, lng: -106.485 },
  "Sedona, AZ": { lat: 34.8697, lng: -111.761 },
  "Grand Canyon, AZ": { lat: 36.0544, lng: -112.1401 },
  "Zion NP, UT": { lat: 37.2982, lng: -113.0263 },
  "Los Angeles, CA": { lat: 34.0522, lng: -118.2437 },
  "Santa Maria, CA": { lat: 34.953, lng: -120.4357 },
  "San Francisco, CA": { lat: 37.7749, lng: -122.4194 },
  "Colfax, CA": { lat: 39.1007, lng: -120.9538 },
  "Redwood NP, CA": { lat: 41.2132, lng: -124.0046 },
  "Cannon Beach, OR": { lat: 45.8918, lng: -123.9615 },
  "Olympia, WA": { lat: 47.0379, lng: -122.9015 },
  "Seattle, WA": { lat: 47.6062, lng: -122.3321 },
  "Bozeman, MT": { lat: 45.677, lng: -111.0429 },
  "Yellowstone NP, WY": { lat: 44.428, lng: -110.5885 },
  "Salt Lake City, UT": { lat: 40.7608, lng: -111.891 },
  "Provo, UT": { lat: 40.2338, lng: -111.6585 },
  "Fort Collins, CO": { lat: 40.5853, lng: -105.0844 },
  "Denver, CO": { lat: 39.7392, lng: -104.9903 },
  "Bismarck, ND": { lat: 46.8083, lng: -100.7837 },
  "Badlands, SD": { lat: 43.8554, lng: -101.9777 },
  "Lincoln, NE": { lat: 40.8136, lng: -96.7026 },
  "Des Moines, IA": { lat: 41.5868, lng: -93.625 },
  "Chicago, IL": { lat: 41.8781, lng: -87.6298 },
  "Terre Haute, IN": { lat: 39.4667, lng: -87.4139 },
  "Columbus, OH": { lat: 39.9612, lng: -82.9988 },
  "Detroit, MI": { lat: 42.3314, lng: -83.0458 },
  "Milwaukee, WI": { lat: 43.0389, lng: -87.9065 },
  "Minneapolis, MN": { lat: 44.9778, lng: -93.265 },
  "Bar Harbor, ME": { lat: 44.3876, lng: -68.2039 },
  "Hartford, CT": { lat: 41.7658, lng: -72.6734 },
  "Albany, NY": { lat: 42.6526, lng: -73.7562 },
  "Monroe, NC": { lat: 35.0004, lng: -80.5495 },
  "Raleigh, NC": { lat: 35.7796, lng: -78.6382 },
  "Asheville, NC": { lat: 35.5951, lng: -82.5515 },
  "Spartanburg, SC": { lat: 34.9496, lng: -81.932 },
  "Augusta, GA": { lat: 33.4735, lng: -82.0105 },
  "Sarasota, FL": { lat: 27.3364, lng: -82.5307 },
  "Knoxville, TN": { lat: 35.9606, lng: -83.9207 },
  "Corbin, KY": { lat: 36.9487, lng: -84.0966 },
  "Jackson, MS": { lat: 32.2988, lng: -90.1848 },
  "Monroe, LA": { lat: 32.5093, lng: -92.1193 },
  "Little Rock, AR": { lat: 34.7465, lng: -92.2896 },
  "Joplin, MO": { lat: 37.0842, lng: -94.5133 },
  "Independence, KS": { lat: 37.2264, lng: -95.7081 },
  "Oklahoma City, OK": { lat: 35.4676, lng: -97.5164 },
  "Austin, TX": { lat: 30.2672, lng: -97.7431 },
};

/**
 * Parse date string and determine if it's a single date or range
 */
function parseDate(dateStr) {
  const currentYear = 2025;

  if (dateStr.includes("–")) {
    const [start, end] = dateStr.split("–").map((d) => d.trim());
    return {
      startDate: `${currentYear}-${start.replace(/\s+/g, "-")}`,
      endDate: `${currentYear}-${end.replace(/\s+/g, "-")}`,
    };
  }

  return {
    startDate: `${currentYear}-${dateStr.replace(/\s+/g, "-")}`,
  };
}

/**
 * Determine stop type from notes
 */
function determineStopType(notes) {
  const lowerNotes = notes.toLowerCase();

  if (lowerNotes.includes("start:")) return "start";
  if (lowerNotes.includes("trip ends")) return "end";
  if (
    lowerNotes.includes("visit") ||
    lowerNotes.includes("stay") ||
    lowerNotes.includes("camping")
  )
    return "overnight";
  if (
    lowerNotes.includes("repair") ||
    lowerNotes.includes("charging") ||
    lowerNotes.includes("supercharger")
  )
    return "charging";
  if (
    lowerNotes.includes("park") ||
    lowerNotes.includes("hike") ||
    lowerNotes.includes("scenic")
  )
    return "attraction";

  return "waypoint";
}

/**
 * Extract state from city string
 */
function extractState(city) {
  const parts = city.split(", ");
  return parts.length > 1 ? parts[1] : "";
}

/**
 * Main conversion function
 */
async function convertFinalItinerary() {
  try {
    console.log(
      `${BLUE}Converting final itinerary CSV to JSON format...${RESET}`
    );

    // Read and parse CSV
    const csvContent = fs.readFileSync(CSV_FILE, "utf8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(
      `${YELLOW}Processing ${records.length} itinerary records...${RESET}`
    );

    // Convert to structured format
    const stops = records.map((record, index) => {
      const city = record.City;
      const coordinates = cityCoordinates[city] || { lat: 0, lng: 0 };
      const state = extractState(city);
      const stopType = determineStopType(record.Notes || "");
      const dateInfo = parseDate(record.Date);

      if (!cityCoordinates[city]) {
        console.warn(
          `${YELLOW}Warning: No coordinates found for ${city}${RESET}`
        );
      }

      return {
        id: `stop_${index + 1}`,
        stopNumber: index + 1,
        date: dateInfo.startDate,
        endDate: dateInfo.endDate,
        city: city.split(", ")[0],
        state,
        location: city,
        coordinates: [coordinates.lng, coordinates.lat], // GeoJSON format [lng, lat]
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        type: stopType,
        milesFromPrev: parseFloat(record.MilesFromPrev) || 0,
        driveHours: parseFloat(record.DriveHours) || 0,
        notes: record.Notes || "",
        isStart: stopType === "start",
        isEnd: stopType === "end",
        isCurrent: index === 0, // First stop is current for now
        visited: false,
      };
    });

    // Create full itinerary object
    const itinerary = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            route: "AWhittleWandering - 48 Continental States",
            description:
              "60-day Tesla road trip through all 48 contiguous US states",
            tripStart: "2025-06-06",
            tripEnd: "2025-08-09",
            totalStops: stops.length,
            totalMiles: stops.reduce(
              (sum, stop) => sum + stop.milesFromPrev,
              0
            ),
            totalDriveHours: stops.reduce(
              (sum, stop) => sum + stop.driveHours,
              0
            ),
            stops,
          },
          geometry: {
            type: "LineString",
            coordinates: stops.map((stop) => stop.coordinates),
          },
        },
      ],
      meta: {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        generatedFrom: "AWhittleWandering_Final_With_Deanna_And_BarHarbor.csv",
      },
    };

    // Save to file
    const outputFile = path.join(__dirname, "..", "itinerary-final.json");
    fs.writeFileSync(outputFile, JSON.stringify(itinerary, null, 2));

    console.log(`${GREEN}✅ Itinerary converted successfully!${RESET}`);
    console.log(`${BLUE}📄 Saved to: ${outputFile}${RESET}`);
    console.log(`${BLUE}📊 Total stops: ${stops.length}${RESET}`);
    console.log(
      `${BLUE}🛣️  Total miles: ${stops.reduce(
        (sum, stop) => sum + stop.milesFromPrev,
        0
      )}${RESET}`
    );

    // Upload to KV storage
    console.log(`\n${YELLOW}Uploading to Cloudflare KV...${RESET}`);

    // Create temp file for upload
    const tempDir = path.join(__dirname, "..", ".temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempFile = path.join(tempDir, "itinerary-final.json");
    fs.writeFileSync(tempFile, JSON.stringify(itinerary, null, 2));

    // Upload using wrangler
    const uploadCommand = `cd edge-worker && npx wrangler kv key put itinerary --binding=${KV_NAMESPACE} --path="${tempFile.replace(
      /\\/g,
      "/"
    )}"`;

    console.log(`${YELLOW}Executing: ${uploadCommand}${RESET}`);
    execSync(uploadCommand, { stdio: "inherit" });

    // Clean up temp file
    fs.unlinkSync(tempFile);

    console.log(
      `${GREEN}✅ Final itinerary uploaded to KV storage successfully!${RESET}`
    );

    return itinerary;
  } catch (error) {
    console.error(`${RED}❌ Error converting itinerary:${RESET}`, error);
    throw error;
  }
}

// Run the conversion
if (require.main === module) {
  convertFinalItinerary()
    .then(() => {
      console.log(
        `\n${GREEN}🎉 Final itinerary conversion and upload completed!${RESET}`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error(`${RED}💥 Error:${RESET}`, error);
      process.exit(1);
    });
}

module.exports = { convertFinalItinerary };
