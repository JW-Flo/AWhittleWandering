#!/usr/bin/env node
/**
 * generate-itinerary-csv.cjs
 *
 * This script processes a raw itinerary text and generates a CSV file with:
 * - Properly formatted dates
 * - City and state information
 * - Stop types (overnight, charging, waypoint)
 * - Coordinates (fetched from OpenStreetMap Nominatim)
 * - Notes from the original itinerary
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { EOL } = require("os");

// Configuration
const OUTPUT_FILE = path.join(
  __dirname,
  "..",
  "48Continental_Final_Itinerary_with_Coords.csv"
);
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA";

// Function to delay execution - needed for API rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to fetch coordinates using MapBox Geocoding API
async function fetchCoordinates(location, state) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(`${location}, ${state}, USA`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    console.log(`Fetching coordinates for ${location}, ${state}...`);

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);

            if (response.features && response.features.length > 0) {
              const [longitude, latitude] = response.features[0].center;
              resolve({ longitude, latitude });
            } else {
              console.warn(`No coordinates found for ${location}, ${state}`);
              // Provide fallback coordinates (center of the US)
              resolve({ longitude: -96.7, latitude: 39.8 });
            }
          } catch (error) {
            console.error(
              `Error parsing coordinates for ${location}, ${state}:`,
              error.message
            );
            // Provide fallback coordinates
            resolve({ longitude: -96.7, latitude: 39.8 });
          }
        });
      })
      .on("error", (error) => {
        console.error(
          `Error fetching coordinates for ${location}, ${state}:`,
          error.message
        );
        // Provide fallback coordinates
        resolve({ longitude: -96.7, latitude: 39.8 });
      });
  });
}

// Parse date range in the format "6/7–6/9" or single date "6/7"
function parseDate(dateStr) {
  if (!dateStr) return { startDate: null, endDate: null };

  const parts = dateStr.split("–");
  let startDate = parts[0].trim();
  let endDate = parts.length > 1 ? parts[1].trim() : startDate;

  // Add year
  if (!startDate.includes("/")) return { startDate: null, endDate: null };

  const startParts = startDate.split("/");
  const endParts = endDate.split("/");

  // If the date doesn't have a year, add 2024
  startDate = `2024-${startParts[0].padStart(2, "0")}-${startParts[1].padStart(
    2,
    "0"
  )}`;
  endDate = `2024-${endParts[0].padStart(2, "0")}-${endParts[1].padStart(
    2,
    "0"
  )}`;

  return { startDate, endDate };
}

// Function to determine stop type from notes
function determineStopType(notes) {
  const lowerNotes = notes.toLowerCase();

  if (
    lowerNotes.includes("overnight") ||
    lowerNotes.includes("campground") ||
    lowerNotes.includes("camp") ||
    lowerNotes.includes("visit") ||
    lowerNotes.includes("stay")
  ) {
    return "overnight";
  } else if (
    lowerNotes.includes("supercharger") ||
    lowerNotes.includes("charging")
  ) {
    return "charging";
  } else if (lowerNotes.includes("trip ends")) {
    return "end";
  } else if (lowerNotes.includes("trip begins")) {
    return "start";
  } else {
    return "waypoint";
  }
}

// Main function to process the itinerary
async function processItinerary(itineraryText) {
  // Split the text into lines
  const lines = itineraryText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("[") && !line.endsWith("]"));

  // CSV header
  const csvLines = ["Date,City,State,StopType,Longitude,Latitude,Notes"];

  // Prepare to track cumulative miles
  let cumulativeMiles = 0;
  let currentDate = "2024-06-06"; // Starting date

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines or headers
    if (!line || line.includes("context")) continue;

    // Try to extract information using regex
    let match = line.match(
      /^(?:(\d+\/\d+(?:–\d+\/\d+)?)\s+)?([^,]+),?\s+([A-Z]{2})(?:\s+(.+))?$/
    );

    // If the regex didn't match, try a more flexible approach
    if (!match) {
      match = line.match(
        /^(?:(\d+\/\d+(?:–\d+\/\d+)?)\s+)?([^,\t]+)(?:,|\t)\s*([A-Z]{2})(?:\s+(.+))?$/
      );
    }

    // If still no match, use another pattern for incomplete entries
    if (!match) {
      match = line.match(
        /^(?:(\d+\/\d+(?:–\d+\/\d+)?)\s+)?([^,\t]+)(?:\s+(.+))?$/
      );

      // If we matched a city but not a state, try to extract them
      if (match) {
        const possibleCity = match[2].trim();
        let possibleState = "";
        let restOfLine = match[3] || "";

        // Look for a state abbreviation at the beginning of the rest of the line
        const stateMatch = restOfLine.match(/^([A-Z]{2})\s+(.+)$/);
        if (stateMatch) {
          possibleState = stateMatch[1];
          restOfLine = stateMatch[2];
        } else {
          // Try to guess the state from the city
          switch (possibleCity.toLowerCase()) {
            case "little rock":
              possibleState = "AR";
              break;
            case "joplin":
              possibleState = "MO";
              break;
            case "independence":
              possibleState = "KS";
              break;
            case "oklahoma city":
              possibleState = "OK";
              break;
            case "jackson":
              possibleState = "MS";
              break;
            default:
              possibleState = "XX"; // Unknown state
          }
        }

        match = [line, match[1], possibleCity, possibleState, restOfLine];
      }
    }

    // Skip lines that don't match any pattern
    if (!match) {
      console.warn(`Couldn't parse line: ${line}`);
      continue;
    }

    // Extract information
    const [_, dateRange, city, state, notes] = match;

    // Parse date
    const { startDate, endDate } = parseDate(dateRange);
    const displayDate = startDate || currentDate;

    // Update current date for entries without dates
    if (startDate) {
      currentDate = startDate;
    }

    // Determine stop type
    const stopType = determineStopType(notes || "");

    // Fetch coordinates
    const { longitude, latitude } = await fetchCoordinates(city, state);

    // Wait a bit to respect API rate limits
    await delay(1000);

    // Format CSV line
    const csvLine = [
      displayDate,
      city.replace(/,/g, " "),
      state,
      stopType,
      longitude,
      latitude,
      notes ? `"${notes.replace(/"/g, '""')}"` : "",
    ].join(",");

    csvLines.push(csvLine);

    // Log progress
    console.log(
      `Processed: ${city}, ${state} - Coordinates: [${longitude}, ${latitude}]`
    );
  }

  // Write CSV file
  fs.writeFileSync(OUTPUT_FILE, csvLines.join(EOL));
  console.log(`CSV file written to: ${OUTPUT_FILE}`);
}

// Raw itinerary text provided by the user
const rawItinerary = `
Tucson	AZ	Overnight at Catalina State Park — Tesla charging in Tucson
6/7–6/9	Grand Canyon	AZ	Mather Campground — Tesla Supercharger in Tusayan
6/9–6/10	Los Angeles	CA	Visit Laurent
6/10–6/11	Big Sur	CA	Camp at Limekiln State Park — Tesla Supercharging in Monterey/Carmel
6/11–6/12	Redwoods	CA	Prairie Creek Redwoods SP — Charging in Eureka
6/12–6/14	Colfax	WA	Visit Stefan Morris (2 full days)
6/14–6/15	Oregon Coast	OR	Beachfront camping at Harris Beach State Park — Supercharging in Grants Pass
6/15–6/16	Olympia	WA	Visit Brian
6/16–6/17	Seattle	WA	Visit Troy
6/17–6/19	Yellowstone	MT/WY	Canyon Campground — Charging in West Yellowstone
6/19–6/20	Salt Lake City	UT	Visit Brady Covington
6/21–6/23	Provo	UT	Visit Erin Lane
6/23–6/24	Denver	CO	Visit Josh
6/24–6/25	Fort Collins	CO	Visit Caleb Blakeman
6/25–6/26	Fargo	ND	Overnight at Buffalo River State Park — Charging in Fargo
6/26–6/27	Sioux Falls	SD	Good Earth State Park — Supercharger in Sioux Falls
6/27–7/1	Lincoln	NE	Visit Parents & Hayden (4 days)
7/1	Chicago	IL	Visit Connor McBride
7/2	Milwaukee	WI	Camping at Kettle Moraine State Forest — Charging in Milwaukee
7/3	Minneapolis	MN	Camp at Afton State Park — Charging in Woodbury
7/4	Traverse City	MI	Camp at Sleeping Bear Dunes — Charging in Traverse City
7/5	Columbus	OH	Visit Cameron Hynes
7/6	Terre Haute	IN	Visit Jack Lavey
7/7	Philadelphia	PA	Fairmount Park overnight — Charging in Philly
7/8	Albany	NY	Visit Philip Dalton (optional)
7/9	Montpelier / Concord	VT/NH	Camping at Quechee State Park — Charging in Lebanon, NH
7/10–7/11	Bar Harbor	ME	Blackwoods Campground — Charging in Ellsworth
7/11–7/15	Hartford	CT	Visit Deanna (4 days)
7/15–7/16	Boston → Wilmington	MA/RI/NJ/DE	Cape Cod detour or forest overnight — Charging along I-95
7/16–7/17	Harpers Ferry	WV	Camp at Harpers Ferry KOA — Charging in Frederick, MD
7/17–7/18	Raleigh	NC	Visit Brad Gross
7/18–7/22	Monroe	NC	Visit Nana & Pawpaw
7/22–7/23	Asheville	NC	Mount Pisgah Campground — Supercharging in Asheville
7/23–7/24	Spartanburg	SC	Visit Max Mosley
7/24–7/25	Savannah	GA	Skidaway Island State Park — Charging in Savannah
7/25–7/26	Sarasota	FL	Visit John & Sarah
7/26–7/27	Tallahassee	FL	Stay at Ochlockonee River State Park — Charging in Tallahassee
7/27–7/28	Knoxville	TN	Visit Barton
7/28–7/29	Mobile	AL	Blakeley State Park — Charging in Spanish Fort
7/29–7/30	New Orleans	LA	Jean Lafitte Park nearby — Charging in NOLA
7/30–7/31	Jackson	MS	LeFleur's Bluff State Park — Charging in Jackson
7/31–8/1	Little Rock	AR	Overnight stop
8/1	Joplin	MO	Charging stop
8/2	Independence	KS	Quick visit
8/2–8/3	Oklahoma City	OK	Overnight stop
8/3–8/4	Austin	TX	Trip ends — home
`;

// Execute the main function
processItinerary(rawItinerary)
  .then(() => console.log("Done!"))
  .catch((error) => console.error("Error:", error));
