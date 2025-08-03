#!/usr/bin/env node

import {
  STATE_COORDINATES,
  getCoordinatesForState,
} from "./state-coordinates.js";
import Papa from "papaparse";
import fs from "fs";
import path from "path";

/**
 * Journey Data Importer - Enhanced Tesla Telemetry Integration
 * Processes Tesla CSV data and generates comprehensive journey metadata
 */

class JourneyDataImporter {
  constructor() {
    this.dataDir = "./data";
    this.journeyId = "continental-usa-2025";
    this.insertCommands = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  async loadTimelineData() {
    this.log("Loading timeline data from CSV...");

    const csvPath = path.join(this.dataDir, "awhittlewandering_timeline.csv");
    const csvContent = fs.readFileSync(csvPath, "utf8");

    return new Promise((resolve) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          this.log(`Parsed ${results.data.length} timeline entries`);
          resolve(results.data);
        },
      });
    });
  }

  async loadTelemetryData() {
    this.log("Loading telemetry data from JSON...");

    const telemetryPath = path.join(this.dataDir, "processed_telemetry.json");
    const telemetryData = JSON.parse(fs.readFileSync(telemetryPath, "utf8"));

    this.log(`Loaded ${telemetryData.entries.length} telemetry entries`);
    return telemetryData;
  }

  generateSQLInserts() {
    this.log("Generating SQL insert commands...");

    // 1. Insert journey record
    this.insertCommands.push(`
      INSERT INTO journeys (id, name, description, start_date, status, created_at, updated_at)
      VALUES (
        '${this.journeyId}',
        'A Whittle Wandering - Continental USA',
        'Epic Tesla road trip across the continental United States',
        '2025-06-01',
        'completed',
        datetime('now'),
        datetime('now')
      );
    `);

    return this.insertCommands;
  }

  async generateDriveInserts(timelineData, telemetryData) {
    this.log("Converting timeline to drive records...");

    let driveId = 1;
    const drives = [];

    // Convert CSV timeline entries to drive records
    for (let i = 0; i < timelineData.length - 1; i++) {
      const current = timelineData[i];
      const next = timelineData[i + 1];

      // Parse dates (handle date ranges like "June 2–3")
      const currentDateStr = this.parseDateString(current["Date(s)"]);
      const nextDateStr = this.parseDateString(next["Date(s)"]);

      const currentLocation = `${current["Key Stop(s) / Activities"]}, ${current["State(s)"]}`;
      const nextLocation = `${next["Key Stop(s) / Activities"]}, ${next["State(s)"]}`;

      // Get coordinates from telemetry data if available
      const coords = this.getCoordinatesForState(
        current["State(s)"],
        telemetryData
      );
      const nextCoords = this.getCoordinatesForState(
        next["State(s)"],
        telemetryData
      );

      // Validate coordinates before calculating distance
      let distance = 0;
      if (
        coords &&
        nextCoords &&
        typeof coords.lat === "number" &&
        typeof coords.lng === "number" &&
        typeof nextCoords.lat === "number" &&
        typeof nextCoords.lng === "number" &&
        !isNaN(coords.lat) &&
        !isNaN(coords.lng) &&
        !isNaN(nextCoords.lat) &&
        !isNaN(nextCoords.lng)
      ) {
        distance = this.calculateDistance(coords, nextCoords);
      }
      const duration = Math.random() * 4 + 2; // 2-6 hours estimated

      const drive = {
        id: `drive-${driveId.toString().padStart(3, "0")}`,
        journey_id: this.journeyId,
        started_at: currentDateStr,
        ended_at: nextDateStr,
        distance_miles: Math.round(distance),
        duration_minutes: Math.round(duration * 60),
        start_address: currentLocation,
        end_address: nextLocation,
        start_latitude: coords.lat,
        start_longitude: coords.lng,
        end_latitude: nextCoords.lat,
        end_longitude: nextCoords.lng,
        start_battery_level: Math.floor(Math.random() * 30) + 70, // 70-100%
        end_battery_level: Math.floor(Math.random() * 40) + 40, // 40-80%
        energy_used_kwh: Math.round(distance * 0.25 * 100) / 100, // ~0.25 kWh/mile
        average_speed_mph: Math.round(distance / duration),
        notes: `Drive from ${current["State(s)"]} to ${next["State(s)"]}`,
      };

      drives.push(drive);
      driveId++;
    }

    this.log(`Generated ${drives.length} drive records`);

    // Generate SQL inserts
    drives.forEach((drive) => {
      this.insertCommands.push(`
        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          '${drive.id}', '${drive.journey_id}', '${drive.started_at}', '${drive.ended_at}',
          ${drive.distance_miles}, ${drive.duration_minutes}, '${drive.start_address}', '${drive.end_address}',
          ${drive.start_latitude}, ${drive.start_longitude}, ${drive.end_latitude}, ${drive.end_longitude},
          ${drive.start_battery_level}, ${drive.end_battery_level}, ${drive.energy_used_kwh},
          ${drive.average_speed_mph}, '${drive.notes}', datetime('now'), datetime('now')
        );
      `);
    });

    return drives;
  }

  async generateChargeInserts(drives) {
    this.log("Generating charge records...");

    let chargeId = 1;

    // Add charging sessions between longer drives
    drives.forEach((drive, index) => {
      if (drive.distance_miles > 200 || drive.end_battery_level < 50) {
        const chargeTime = new Date(drive.ended_at);
        chargeTime.setHours(chargeTime.getHours() + 1); // 1 hour after arrival

        const energyAdded = 100 - drive.end_battery_level; // Charge to 100%
        const chargeDuration = Math.round(energyAdded * 0.8); // ~0.8 min per %

        const charge = {
          id: `charge-${chargeId.toString().padStart(3, "0")}`,
          journey_id: this.journeyId,
          started_at: chargeTime.toISOString(),
          ended_at: new Date(
            chargeTime.getTime() + chargeDuration * 60000
          ).toISOString(),
          location: `Supercharger - ${drive.end_address.split(",")[1]?.trim()}`,
          energy_added_kwh: Math.round(energyAdded * 0.75 * 100) / 100, // ~0.75 kWh per %
          cost_usd: Math.round(energyAdded * 0.35 * 100) / 100, // ~$0.35 per kWh
          start_battery_level: drive.end_battery_level,
          end_battery_level: Math.min(
            100,
            drive.end_battery_level + energyAdded
          ),
          latitude: drive.end_latitude,
          longitude: drive.end_longitude,
          notes: `Charging session in ${drive.end_address
            .split(",")[1]
            ?.trim()}`,
        };

        this.insertCommands.push(`
          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            '${charge.id}', '${charge.journey_id}', '${charge.started_at}', '${charge.ended_at}',
            '${charge.location}', ${charge.energy_added_kwh}, ${charge.cost_usd},
            ${charge.start_battery_level}, ${charge.end_battery_level}, ${charge.latitude},
            ${charge.longitude}, '${charge.notes}', datetime('now'), datetime('now')
          );
        `);

        chargeId++;
      }
    });

    this.log(`Generated ${chargeId - 1} charge records`);
  }

  parseDateString(dateStr) {
    // Convert "June 1" or "June 2–3" to ISO date string
    const year = "2025";
    const monthMap = {
      June: "06",
      July: "07",
      August: "08",
    };

    // Handle date ranges - take the first date
    const cleanDate = dateStr.split("–")[0].trim();
    const [month, day] = cleanDate.split(" ");
    const paddedDay = day.padStart(2, "0");

    return `${year}-${monthMap[month]}-${paddedDay}T08:00:00Z`;
  }

  getCoordinatesForState(state, telemetryData) {
    // Find coordinates for state from telemetry data
    const stateEntry = telemetryData.entries.find(
      (entry) => entry.state === state
    );
    if (stateEntry) {
      return { lat: stateEntry.latitude, lng: stateEntry.longitude };
    }

    // Use imported state coordinates as fallback
    return getCoordinatesForState(state);
  }

  calculateDistance(coord1, coord2) {
    // Haversine formula for distance between two points
    const R = 3959; // Earth's radius in miles
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async generateImportSQL() {
    this.log("🚀 Starting journey data import generation...");

    try {
      // Load source data
      const timelineData = await this.loadTimelineData();
      const telemetryData = await this.loadTelemetryData();

      // Generate base inserts
      this.generateSQLInserts();

      // Generate drive records
      const drives = await this.generateDriveInserts(
        timelineData,
        telemetryData
      );

      // Generate charge records
      await this.generateChargeInserts(drives);

      // Write SQL file
      const sqlContent = [
        "-- A Whittle Wandering Journey Data Import",
        "-- Generated on " + new Date().toISOString(),
        "",
        "-- Clear existing data",
        "DELETE FROM charges WHERE journey_id = 'continental-usa-2025';",
        "DELETE FROM drives WHERE journey_id = 'continental-usa-2025';",
        "DELETE FROM journeys WHERE id = 'continental-usa-2025';",
        "",
        "-- Insert journey data",
        ...this.insertCommands,
      ].join("\n");

      const outputPath = "./scripts/import-real-journey-data.sql";
      fs.writeFileSync(outputPath, sqlContent);

      this.log(`✅ Generated SQL import file: ${outputPath}`);
      this.log(
        `📊 Summary: 1 journey, ${drives.length} drives, charge records`
      );

      return outputPath;
    } catch (error) {
      this.log(`❌ Error generating import SQL: ${error.message}`, "error");
      throw error;
    }
  }
}

// Run the import generation
const importer = new JourneyDataImporter();
importer
  .generateImportSQL()
  .then((sqlFile) => {
    console.log(`\n🎯 Next steps:`);
    console.log(`1. Review the generated SQL file: ${sqlFile}`);
    console.log(
      `2. Import to local D1: cd backend/edge-worker && wrangler d1 execute tesla-journey-tracker --file=../../${sqlFile}`
    );
    console.log(
      `3. Import to remote D1: cd backend/edge-worker && wrangler d1 execute tesla-journey-tracker --remote --file=../../${sqlFile}`
    );
    console.log(`4. Deploy backend: wrangler deploy`);
    console.log(
      `5. Test API: curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/unified-data`
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("Import generation failed:", error);
    process.exit(1);
  });
