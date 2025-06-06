#!/usr/bin/env node

/**
 * Convert 48 Continental USA Itinerary CSV to KV-compatible JSON format
 * This script reads the 48Continental_Revised_Final_Itinerary.csv file
 * and converts it to a structured JSON format for storage in Cloudflare KV
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// Path to the CSV file (relative to project root)
const CSV_FILE = path.join(
  __dirname,
  "..",
  "48Continental_Revised_Final_Itinerary.csv"
);
// Output JSON file path
const JSON_OUTPUT = path.join(__dirname, "..", "itinerary.json");

// Parse a date string in format MM/DD/YYYY to ISO format
function parseDate(dateStr) {
  if (!dateStr) return null;

  const parts = dateStr.split("/").map((n) => parseInt(n, 10));
  let month, day, year;
  if (parts.length === 3) {
    [month, day, year] = parts;
  } else if (parts.length === 2) {
    [month, day] = parts;
    year = new Date().getFullYear(); // Use current year if missing
  } else {
    return null;
  }
  const date = new Date(year, month - 1, day);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

// Main function to convert CSV to JSON
async function convertCsvToJson() {
  try {
    // Read CSV file
    const csvData = fs.readFileSync(CSV_FILE, "utf8");

    // Parse CSV with headers
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Transform to structured format
    const itinerary = records.map((record, index) => {
      return {
        id: String(index + 1),
        stopNumber: index + 1,
        city: record.City || "",
        state: record.State || "",
        location: {
          latitude: parseFloat(record.Latitude) || 0,
          longitude: parseFloat(record.Longitude) || 0,
        },
        arrivalDate: parseDate(record.ArrivalDate),
        departureDate: parseDate(record.DepartureDate),
        overnightStay: record.OvernightStay === "Yes",
        chargingStop: record.ChargingStop === "Yes",
        supercharger: record.Supercharger === "Yes",
        pointsOfInterest: record.PointsOfInterest
          ? record.PointsOfInterest.split(";")
              .map((poi) => poi.trim())
              .filter(Boolean)
          : [],
        notes: record.Notes || "",
        weather: {
          averageTemp: parseInt(record.AverageTemp) || null,
          precipitation: parseFloat(record.Precipitation) || 0,
        },
        distance: {
          fromPrevious: parseFloat(record.DistanceFromPrevious) || 0,
          fromStart: parseFloat(record.DistanceFromStart) || 0,
        },
      };
    });

    // Create the full itinerary object
    const itineraryObject = {
      title: "48 Continental USA Tesla Road Trip",
      description: "A 60-day journey through all 48 contiguous U.S. states",
      version: "1.0.0",
      updated: new Date().toISOString(),
      stops: itinerary,
      totalStops: itinerary.length,
      totalDistance: itinerary.reduce(
        (sum, stop) => sum + stop.distance.fromPrevious,
        0
      ),
      startDate: itinerary[0].arrivalDate,
      endDate: itinerary[itinerary.length - 1].departureDate,
    };

    // Write to JSON file
    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(itineraryObject, null, 2));

    console.log(`✅ Successfully converted CSV to JSON`);
    console.log(
      `📝 Wrote ${itineraryObject.totalStops} stops to ${JSON_OUTPUT}`
    );

    return itineraryObject;
  } catch (error) {
    console.error("Error converting CSV to JSON:", error);
    process.exit(1);
  }
}

// Execute the conversion
convertCsvToJson();
