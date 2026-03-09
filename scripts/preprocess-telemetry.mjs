#!/usr/bin/env node
/**
 * Pre-process raw Tesla CSV telemetry into compact JSON files for the frontend.
 * Run from repo root: node scripts/preprocess-telemetry.mjs
 *
 * Inputs (repo root):  charging_states.csv, battery_states.csv, driving_states.csv, climate_states.csv
 * Outputs (frontend/public/data/):
 *   - charging_sessions.json   — discrete charge sessions with location, energy, power
 *   - battery_timeline.json    — sampled battery % + range over time (every 15 min)
 *   - climate_timeline.json    — sampled outside temp over time (every 15 min)
 *   - driving_timeline.json    — sampled speed/location over time (every 60 s while driving)
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const OUT = join(ROOT, "frontend", "public", "data");

// ---------- CSV helpers ----------
function parseCsv(filename) {
  const text = readFileSync(join(ROOT, filename), "utf-8");
  const lines = text.trim().split("\n");
  const header = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseRow(line);
    const obj = {};
    header.forEach((h, i) => (obj[h] = vals[i] ?? ""));
    return obj;
  });
}

function parseRow(line) {
  const fields = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { fields.push(cur); cur = ""; }
    else cur += ch;
  }
  fields.push(cur);
  return fields;
}

function ts(row) { return row["Timestamp (UTC)"]; }
function toMs(s) { return new Date(s.replace(" ", "T") + "Z").getTime(); }
function num(v) { return parseFloat(v) || 0; }

// ---------- 1. Charging Sessions ----------
console.log("Parsing charging_states.csv...");
const charging = parseCsv("charging_states.csv");

// Build driving_states index for location lookup (sparse: every 60s)
console.log("Parsing driving_states.csv for location index...");
const driving = parseCsv("driving_states.csv");

// Build a time→location map (sparse, for lookup during charge sessions)
const locationByTime = [];
for (const row of driving) {
  const lat = num(row["Latitude"]);
  const lng = num(row["Longitude"]);
  if (lat !== 0 || lng !== 0) {
    locationByTime.push({ t: toMs(ts(row)), lat, lng });
  }
}

function findLocation(timeMs) {
  // Binary search for closest driving_states entry
  let lo = 0, hi = locationByTime.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (locationByTime[mid].t < timeMs) lo = mid + 1;
    else hi = mid;
  }
  const best = locationByTime[lo];
  if (!best) return { lat: 0, lng: 0 };
  // Check neighbor
  if (lo > 0) {
    const prev = locationByTime[lo - 1];
    if (Math.abs(prev.t - timeMs) < Math.abs(best.t - timeMs))
      return { lat: prev.lat, lng: prev.lng };
  }
  return { lat: best.lat, lng: best.lng };
}

const sessions = [];
let sessionStart = null;
let peakPower = 0;
let startBattery = 0;
let endBattery = 0;
let startRange = 0;
let endRange = 0;

for (let i = 0; i < charging.length; i++) {
  const row = charging[i];
  const state = row["Charging State"];
  const power = num(row["Charger Power (kW)"]);
  const battery = num(row["Usable Battery Level (%)"]);
  const range = num(row["Battery Range (mi)"]);
  const voltage = num(row["Charger Voltage (V)"]);

  if (state === "Charging") {
    if (!sessionStart) {
      sessionStart = ts(row);
      startBattery = battery;
      startRange = range;
      peakPower = power;
    }
    if (power > peakPower) peakPower = power;
    endBattery = battery;
    endRange = range;
  } else if (sessionStart) {
    // Session ended
    const endTime = ts(row);
    const startMs = toMs(sessionStart);
    const endMs = toMs(endTime);
    const durationMin = Math.round((endMs - startMs) / 60000);

    // Only keep sessions > 1 minute and where battery actually increased
    if (durationMin > 1 && endBattery > startBattery) {
      const loc = findLocation(startMs);
      sessions.push({
        start: sessionStart,
        end: endTime,
        durationMin,
        startBattery,
        endBattery,
        energyAdded: Math.round(endRange - startRange),
        peakPowerKw: peakPower,
        lat: loc.lat,
        lng: loc.lng,
        isSupercharger: peakPower > 20 || voltage > 300,
      });
    }
    sessionStart = null;
    peakPower = 0;
  }
}

console.log(`  Found ${sessions.length} charging sessions`);
writeFileSync(join(OUT, "charging_sessions.json"), JSON.stringify(sessions));

// ---------- 2. Battery Timeline (sample every 15 min) ----------
console.log("Building battery timeline...");
const BATTERY_INTERVAL = 15 * 60 * 1000;
const batteryTimeline = [];
let nextBatteryTs = 0;

for (const row of charging) {
  const t = toMs(ts(row));
  if (t >= nextBatteryTs) {
    batteryTimeline.push({
      t: ts(row),
      pct: num(row["Usable Battery Level (%)"]),
      range: Math.round(num(row["Battery Range (mi)"])),
      state: row["Charging State"],
    });
    nextBatteryTs = t + BATTERY_INTERVAL;
  }
}

console.log(`  ${batteryTimeline.length} battery samples`);
writeFileSync(join(OUT, "battery_timeline.json"), JSON.stringify(batteryTimeline));

// ---------- 3. Climate Timeline (sample every 15 min) ----------
console.log("Parsing climate_states.csv...");
const climate = parseCsv("climate_states.csv");
const CLIMATE_INTERVAL = 15 * 60 * 1000;
const climateTimeline = [];
let nextClimateTs = 0;

for (const row of climate) {
  const t = toMs(ts(row));
  if (t >= nextClimateTs) {
    const outsideC = num(row["Outside Temp (°C)"]);
    const insideC = num(row["Inside Temp (°C)"]);
    if (outsideC !== 0 || insideC !== 0) {
      climateTimeline.push({
        t: ts(row),
        outsideF: Math.round(outsideC * 9 / 5 + 32),
        insideF: Math.round(insideC * 9 / 5 + 32),
      });
    }
    nextClimateTs = t + CLIMATE_INTERVAL;
  }
}

console.log(`  ${climateTimeline.length} climate samples`);
writeFileSync(join(OUT, "climate_timeline.json"), JSON.stringify(climateTimeline));

// ---------- 4. Driving Timeline (every 60s while moving) ----------
console.log("Building driving timeline...");
const DRIVE_INTERVAL = 60 * 1000;
const drivingTimeline = [];
let nextDriveTs = 0;

for (const row of driving) {
  const speed = num(row["Speed (mph)"]);
  const shift = row["Shift State"];
  if (shift !== "D" && shift !== "R") continue; // only moving
  const t = toMs(ts(row));
  if (t >= nextDriveTs) {
    drivingTimeline.push({
      t: ts(row),
      lat: num(row["Latitude"]),
      lng: num(row["Longitude"]),
      speed: Math.round(speed),
      odo: Math.round(num(row["Odometer (mi)"])),
    });
    nextDriveTs = t + DRIVE_INTERVAL;
  }
}

console.log(`  ${drivingTimeline.length} driving samples`);
writeFileSync(join(OUT, "driving_timeline.json"), JSON.stringify(drivingTimeline));

console.log("\nDone! Files written to frontend/public/data/");
