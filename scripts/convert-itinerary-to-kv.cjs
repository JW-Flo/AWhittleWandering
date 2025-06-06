#!/usr/bin/env node

/**
 * Convert Itinerary CSV to KV Namespace Format
 *
 * This script reads the 48Continental_Revised_Final_Itinerary.csv file,
 * converts the data to JSON format suitable for Cloudflare KV namespace,
 * and uploads it to the ITINERARY_KV namespace.
 *
 * Usage:
 *   node scripts/convert-itinerary-to-kv.cjs
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// Configuration
const CSV_FILE_PATH = path.join(
  __dirname,
  "..",
  "48Continental_Revised_Final_Itinerary.csv"
);
const KV_NAMESPACE = "ITINERARY_KV";
const CURRENT_DAY_FILE = path.join(__dirname, "..", ".current_trip_day.json");

// Function to parse date ranges like "6/4–6/5" or "7/3–7/7" or single dates like "6/6"
function parseDateRange(dateStr) {
  const year = new Date().getFullYear();

  // Check if it's a date range or single date
  if (dateStr.includes("–")) {
    const [startDateStr, endDateStr] = dateStr.split("–");

    // Handle month transitions (e.g., "6/30–7/2")
    let [startMonth, startDay] = startDateStr.split("/").map(Number);
    let [endMonth, endDay] = endDateStr.split("/").map(Number);

    // Ensure the month is included in the end date
    if (isNaN(endMonth)) {
      endMonth = startMonth;
    }

    const startDate = new Date(year, startMonth - 1, startDay);
    const endDate = new Date(year, endMonth - 1, endDay);

    return { startDate, endDate };
  } else {
    // Single date
    const [month, day] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return { startDate: date, endDate: date };
  }
}

// Function to generate day objects from start to end date
function generateDayObjects(
  startDate,
  endDate,
  location,
  state,
  person,
  duration,
  notes
) {
  const days = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push({
      date: currentDate.toISOString().split("T")[0],
      location,
      state,
      personSeen: person || null,
      duration,
      notes,
      isFirstDay: currentDate.getTime() === startDate.getTime(),
      isLastDay: currentDate.getTime() === endDate.getTime(),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

// Function to enrich itinerary data with coordinates and state details
function enrichItineraryData(itineraryData) {
  // This is a simplified version. In a real implementation, we would:
  // 1. Fetch coordinates from a geocoding service
  // 2. Add additional state information like nicknames, etc.

  // Simplified state information
  const stateInfo = {
    AL: { fullName: "Alabama", nickname: "Yellowhammer State" },
    AK: { fullName: "Alaska", nickname: "The Last Frontier" },
    AZ: { fullName: "Arizona", nickname: "Grand Canyon State" },
    AR: { fullName: "Arkansas", nickname: "The Natural State" },
    CA: { fullName: "California", nickname: "Golden State" },
    CO: { fullName: "Colorado", nickname: "Centennial State" },
    CT: { fullName: "Connecticut", nickname: "Constitution State" },
    DE: { fullName: "Delaware", nickname: "First State" },
    FL: { fullName: "Florida", nickname: "Sunshine State" },
    GA: { fullName: "Georgia", nickname: "Peach State" },
    HI: { fullName: "Hawaii", nickname: "Aloha State" },
    ID: { fullName: "Idaho", nickname: "Gem State" },
    IL: { fullName: "Illinois", nickname: "Prairie State" },
    IN: { fullName: "Indiana", nickname: "Hoosier State" },
    IA: { fullName: "Iowa", nickname: "Hawkeye State" },
    KS: { fullName: "Kansas", nickname: "Sunflower State" },
    KY: { fullName: "Kentucky", nickname: "Bluegrass State" },
    LA: { fullName: "Louisiana", nickname: "Pelican State" },
    ME: { fullName: "Maine", nickname: "Pine Tree State" },
    MD: { fullName: "Maryland", nickname: "Old Line State" },
    MA: { fullName: "Massachusetts", nickname: "Bay State" },
    MI: { fullName: "Michigan", nickname: "Great Lakes State" },
    MN: { fullName: "Minnesota", nickname: "North Star State" },
    MS: { fullName: "Mississippi", nickname: "Magnolia State" },
    MO: { fullName: "Missouri", nickname: "Show Me State" },
    MT: { fullName: "Montana", nickname: "Treasure State" },
    NE: { fullName: "Nebraska", nickname: "Cornhusker State" },
    NV: { fullName: "Nevada", nickname: "Silver State" },
    NH: { fullName: "New Hampshire", nickname: "Granite State" },
    NJ: { fullName: "New Jersey", nickname: "Garden State" },
    NM: { fullName: "New Mexico", nickname: "Land of Enchantment" },
    NY: { fullName: "New York", nickname: "Empire State" },
    NC: { fullName: "North Carolina", nickname: "Tar Heel State" },
    ND: { fullName: "North Dakota", nickname: "Peace Garden State" },
    OH: { fullName: "Ohio", nickname: "Buckeye State" },
    OK: { fullName: "Oklahoma", nickname: "Sooner State" },
    OR: { fullName: "Oregon", nickname: "Beaver State" },
    PA: { fullName: "Pennsylvania", nickname: "Keystone State" },
    RI: { fullName: "Rhode Island", nickname: "Ocean State" },
    SC: { fullName: "South Carolina", nickname: "Palmetto State" },
    SD: { fullName: "South Dakota", nickname: "Mount Rushmore State" },
    TN: { fullName: "Tennessee", nickname: "Volunteer State" },
    TX: { fullName: "Texas", nickname: "Lone Star State" },
    UT: { fullName: "Utah", nickname: "Beehive State" },
    VT: { fullName: "Vermont", nickname: "Green Mountain State" },
    VA: { fullName: "Virginia", nickname: "Old Dominion" },
    WA: { fullName: "Washington", nickname: "Evergreen State" },
    WV: { fullName: "West Virginia", nickname: "Mountain State" },
    WI: { fullName: "Wisconsin", nickname: "Badger State" },
    WY: { fullName: "Wyoming", nickname: "Equality State" },
  };

  // Mock coordinates for locations (in real scenario, use geocoding)
  const mockCoordinates = {
    "Corpus Christi": { lat: 27.8006, lng: -97.3964 },
    Tucson: { lat: 32.2226, lng: -110.9747 },
    "Grand Canyon": { lat: 36.0544, lng: -112.1401 },
    "Las Vegas": { lat: 36.1699, lng: -115.1398 },
    "Los Angeles": { lat: 34.0522, lng: -118.2437 },
    Yosemite: { lat: 37.8651, lng: -119.5383 },
    Colfax: { lat: 39.1002, lng: -120.9527 },
    "Cannon Beach": { lat: 45.8918, lng: -123.9615 },
    Seattle: { lat: 47.6062, lng: -122.3321 },
    Olympia: { lat: 47.0379, lng: -122.9007 },
    Yellowstone: { lat: 44.428, lng: -110.5885 },
    Provo: { lat: 40.2338, lng: -111.6585 },
    "Salt Lake City": { lat: 40.7608, lng: -111.891 },
    Lincoln: { lat: 40.8136, lng: -96.7026 },
    "Des Moines": { lat: 41.5868, lng: -93.625 },
    Chicago: { lat: 41.8781, lng: -87.6298 },
    Madison: { lat: 43.0731, lng: -89.4012 },
    "Traverse City": { lat: 44.7631, lng: -85.6206 },
    Cleveland: { lat: 41.4993, lng: -81.6944 },
    Erie: { lat: 42.1292, lng: -80.0851 },
    "Niagara Falls": { lat: 43.0962, lng: -79.0377 },
    Burlington: { lat: 44.4759, lng: -73.2121 },
    Hartford: { lat: 41.7658, lng: -72.6734 },
    "Portland / Bar Harbor": { lat: 44.3106, lng: -68.2347 },
    Boston: { lat: 42.3601, lng: -71.0589 },
    Providence: { lat: 41.824, lng: -71.4128 },
    "Hudson Valley": { lat: 41.7194, lng: -73.938 },
    Newark: { lat: 40.7357, lng: -74.1724 },
    Baltimore: { lat: 39.2904, lng: -76.6122 },
    Richmond: { lat: 37.5407, lng: -77.436 },
    Charleston: { lat: 32.7765, lng: -79.9311 },
    Columbia: { lat: 34.0007, lng: -81.0348 },
    Savannah: { lat: 32.0809, lng: -81.0912 },
    Gainesville: { lat: 29.6516, lng: -82.3248 },
    Sarasota: { lat: 27.3364, lng: -82.5307 },
    Monroe: { lat: 34.9855, lng: -80.5496 },
    "Max Patch": { lat: 35.7973, lng: -82.9568 },
    Knoxville: { lat: 35.9606, lng: -83.9207 },
    Lexington: { lat: 38.0406, lng: -84.5037 },
    "St. Louis": { lat: 38.627, lng: -90.1994 },
    Memphis: { lat: 35.1495, lng: -90.049 },
    Ozarks: { lat: 36.0711, lng: -92.5171 },
    "Oklahoma City": { lat: 35.4676, lng: -97.5164 },
    Amarillo: { lat: 35.222, lng: -101.8313 },
    "San Angelo": { lat: 31.4638, lng: -100.437 },
    Austin: { lat: 30.2672, lng: -97.7431 },
  };

  return itineraryData.map((day) => {
    const stateData = stateInfo[day.state] || {
      fullName: day.state,
      nickname: "",
    };
    const coordinates = mockCoordinates[day.location] || { lat: 0, lng: 0 };

    return {
      ...day,
      coordinates,
      stateFullName: stateData.fullName,
      stateNickname: stateData.nickname,
      id: `day_${day.date.replace(/-/g, "")}`,
    };
  });
}

// Function to determine the current and next trip day
function determineCurrentTripDay(itineraryData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayISO = today.toISOString().split("T")[0];

  // Find today's entry or the next upcoming day
  const currentDay = itineraryData.find((day) => day.date === todayISO);

  if (currentDay) {
    // Today is a trip day
    const nextDayIndex =
      itineraryData.findIndex((day) => day.date === todayISO) + 1;
    const nextDay =
      nextDayIndex < itineraryData.length ? itineraryData[nextDayIndex] : null;

    return { currentDay, nextDay, currentDayIndex: nextDayIndex - 1 };
  } else {
    // Find the next upcoming day
    const futureDays = itineraryData.filter((day) => day.date > todayISO);

    if (futureDays.length > 0) {
      const nextDay = futureDays[0];
      const nextDayIndex = itineraryData.findIndex(
        (day) => day.date === nextDay.date
      );
      const currentDayIndex = nextDayIndex > 0 ? nextDayIndex - 1 : null;
      const currentDay =
        currentDayIndex !== null ? itineraryData[currentDayIndex] : null;

      return { currentDay, nextDay, currentDayIndex };
    } else {
      // Trip is complete
      const lastDay = itineraryData[itineraryData.length - 1];
      return {
        currentDay: lastDay,
        nextDay: null,
        currentDayIndex: itineraryData.length - 1,
        tripComplete: true,
      };
    }
  }
}

// Function to determine visited states
function determineVisitedStates(itineraryData, currentDayIndex) {
  if (currentDayIndex === null) return [];

  const visitedLocations = itineraryData.slice(0, currentDayIndex + 1);
  const visitedStates = [
    ...new Set(visitedLocations.map((location) => location.state)),
  ];

  return visitedStates;
}

// Main function to process the CSV file
async function processItinerary() {
  try {
    console.log(`Reading CSV file: ${CSV_FILE_PATH}`);
    const csvData = fs.readFileSync(CSV_FILE_PATH, "utf8");

    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} records in CSV file`);

    // Process itinerary data
    let itineraryData = [];

    records.forEach((record) => {
      const { startDate, endDate } = parseDateRange(record["Date(s)"]);
      const days = generateDayObjects(
        startDate,
        endDate,
        record.Location,
        record.State,
        record["Person Seen"],
        record.Duration,
        record.Notes
      );

      itineraryData = [...itineraryData, ...days];
    });

    // Sort by date
    itineraryData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Enrich data with coordinates and state details
    const enrichedData = enrichItineraryData(itineraryData);

    // Determine current and next day
    const { currentDay, nextDay, currentDayIndex, tripComplete } =
      determineCurrentTripDay(enrichedData);

    // Determine visited states
    const visitedStates = determineVisitedStates(enrichedData, currentDayIndex);

    // Create summary object
    const tripSummary = {
      totalDays: enrichedData.length,
      totalStates: [...new Set(enrichedData.map((day) => day.state))].length,
      startDate: enrichedData[0].date,
      endDate: enrichedData[enrichedData.length - 1].date,
      currentDate: new Date().toISOString().split("T")[0],
      currentDayIndex,
      currentDay,
      nextDay,
      visitedStates,
      tripComplete: !!tripComplete,
      lastUpdated: new Date().toISOString(),
    };

    // Save current day to file for the MCP server to use
    fs.writeFileSync(
      CURRENT_DAY_FILE,
      JSON.stringify(
        {
          currentDay,
          nextDay,
          visitedStates,
          currentDayIndex,
          tripComplete: !!tripComplete,
          lastUpdated: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log("Trip summary created successfully");

    // Format data for KV namespace
    const kvData = {
      itinerary: enrichedData,
      summary: tripSummary,
    };

    // Temp file for KV data
    const tempFile = path.join(__dirname, "..", ".itinerary_data_kv.json");
    fs.writeFileSync(tempFile, JSON.stringify(kvData, null, 2));

    console.log("Uploading itinerary data to Cloudflare KV namespace...");

    try {
      // Use the execSync method with the proper command format
      const uploadCommand = `cd edge-worker && npx wrangler kv key put itinerary --binding=${KV_NAMESPACE} '${JSON.stringify(
        kvData
      )}'`;
      console.log(`Executing: ${uploadCommand}`);

      const { execSync } = require("child_process");
      execSync(uploadCommand, { stdio: "inherit" });

      console.log("Itinerary data uploaded successfully to KV namespace");

      // Also upload a separate current_day entry for easier access
      console.log("Uploading current day data...");
      const currentDayData = {
        currentDay: kvData.summary.currentDay,
        nextDay: kvData.summary.nextDay,
        visitedStates: kvData.summary.visitedStates,
        currentDayIndex: kvData.summary.currentDayIndex,
        tripComplete: kvData.summary.tripComplete,
        lastUpdated: new Date().toISOString(),
      };

      const currentDayCommand = `cd edge-worker && npx wrangler kv key put current_day --binding=${KV_NAMESPACE} '${JSON.stringify(
        currentDayData
      )}'`;
      execSync(currentDayCommand, { stdio: "inherit" });

      console.log("Current day data uploaded successfully");

      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return true;
    } catch (error) {
      console.error("Error executing wrangler command:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error processing itinerary data:", error);
    throw error;
  }
}

// Run the script
processItinerary()
  .then(() => {
    console.log("Itinerary data processing complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
