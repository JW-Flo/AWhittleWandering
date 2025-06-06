#!/usr/bin/env node

/**
 * 48 Continental USA - Itinerary Processing and Upload Script
 *
 * This script automates the process of:
 * 1. Converting the itinerary CSV to KV-ready JSON format
 * 2. Uploading the data to Cloudflare KV (either local or remote)
 *
 * Usage:
 *   node scripts/itinerary-to-kv.cjs [--remote] [--csv-file=path/to/itinerary.csv]
 *
 * Options:
 *   --remote      Upload to the remote KV namespace (production)
 *   --csv-file    Specify a custom CSV file path (default: 48Continental_Revised_Final_Itinerary.csv)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ANSI color codes for prettier output
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

// Process command line arguments
const args = process.argv.slice(2);
const isRemote = args.includes("--remote");
let csvFile = "48Continental_Revised_Final_Itinerary.csv";

// Check for custom CSV file path
const csvArg = args.find((arg) => arg.startsWith("--csv-file="));
if (csvArg) {
  csvFile = csvArg.split("=")[1];
}

// Configuration
const CSV_FILE = path.join(__dirname, "..", csvFile);
const CONVERT_SCRIPT = path.join(__dirname, "convert-itinerary-to-kv.cjs");
const KV_NAMESPACE = "ITINERARY_KV";
const TEMP_DIR = path.join(__dirname, "..", ".temp");

// Banner
console.log(`\n${BOLD}${BLUE}========================================${RESET}`);
console.log(`${BOLD}${BLUE}  48 Continental USA - Itinerary Upload  ${RESET}`);
console.log(`${BOLD}${BLUE}========================================${RESET}\n`);

// Step 1: Check if CSV file exists
console.log(`${YELLOW}Step 1: Checking for itinerary CSV file...${RESET}`);
if (!fs.existsSync(CSV_FILE)) {
  console.error(
    `${RED}Error: Itinerary CSV file not found at ${CSV_FILE}${RESET}`
  );
  console.log(`${YELLOW}Available CSV files:${RESET}`);

  try {
    const rootDir = path.join(__dirname, "..");
    const files = fs
      .readdirSync(rootDir)
      .filter((file) => file.endsWith(".csv"));

    if (files.length === 0) {
      console.log(`${YELLOW}No CSV files found in the root directory.${RESET}`);
    } else {
      files.forEach((file) => console.log(`- ${file}`));
      console.log(
        `\n${YELLOW}Run with --csv-file=FILENAME to specify a different file.${RESET}`
      );
    }
  } catch (error) {
    console.error(`${RED}Error listing CSV files:${RESET}`, error);
  }

  process.exit(1);
}

console.log(`${GREEN}Found itinerary CSV file: ${CSV_FILE}${RESET}`);

// Step 2: Run the conversion script
console.log(`\n${YELLOW}Step 2: Converting itinerary to KV format...${RESET}`);

try {
  console.log(`${YELLOW}Running: node ${CONVERT_SCRIPT}${RESET}`);
  execSync(`node ${CONVERT_SCRIPT}`, { stdio: "inherit" });
  console.log(`${GREEN}Conversion completed successfully!${RESET}`);
} catch (error) {
  console.error(`${RED}Error converting itinerary:${RESET}`, error);
  process.exit(1);
}

// Step 3: Create temporary directory
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Step 4: Upload data to KV namespace
console.log(
  `\n${YELLOW}Step 3: Uploading data to ${
    isRemote ? "remote" : "local"
  } KV namespace...${RESET}`
);

try {
  // Check if .current_trip_day.json exists
  const DATA_FILE = path.join(__dirname, "..", ".current_trip_day.json");
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`${RED}Error: Data file ${DATA_FILE} not found${RESET}`);
    process.exit(1);
  }

  // Read the data file
  const tripData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  // Write to temporary file
  const tempFile = path.join(TEMP_DIR, "current_day.json");
  fs.writeFileSync(tempFile, JSON.stringify(tripData, null, 2));

  // Upload to KV namespace
  console.log(
    `${YELLOW}Uploading current day data to ${KV_NAMESPACE}${
      isRemote ? " (REMOTE)" : ""
    }${RESET}`
  );

  const remoteFlag = isRemote ? " --remote" : "";
  const command = `cd edge-worker && npx wrangler kv key put current_day --binding=${KV_NAMESPACE} --path="${tempFile.replace(
    /\\/g,
    "/"
  )}"${remoteFlag}`;

  console.log(`${YELLOW}Executing: ${command}${RESET}`);
  execSync(command, { stdio: "inherit" });

  console.log(`${GREEN}Trip data uploaded successfully!${RESET}`);

  // Also upload the full itinerary
  console.log(
    `${YELLOW}Uploading full itinerary to ${KV_NAMESPACE}${
      isRemote ? " (REMOTE)" : ""
    }${RESET}`
  );

  // Read the itinerary data
  const ITINERARY_FILE = path.join(__dirname, "..", ".itinerary.json");
  if (fs.existsSync(ITINERARY_FILE)) {
    const itineraryData = JSON.parse(fs.readFileSync(ITINERARY_FILE, "utf8"));
    const itineraryTempFile = path.join(TEMP_DIR, "itinerary.json");
    fs.writeFileSync(itineraryTempFile, JSON.stringify(itineraryData, null, 2));

    const itineraryCommand = `cd edge-worker && npx wrangler kv key put itinerary --binding=${KV_NAMESPACE} --path="${itineraryTempFile.replace(
      /\\/g,
      "/"
    )}"${remoteFlag}`;

    console.log(`${YELLOW}Executing: ${itineraryCommand}${RESET}`);
    execSync(itineraryCommand, { stdio: "inherit" });

    console.log(`${GREEN}Full itinerary uploaded successfully!${RESET}`);

    // Clean up
    fs.unlinkSync(itineraryTempFile);
  } else {
    console.log(
      `${YELLOW}No full itinerary file found, skipping upload.${RESET}`
    );
  }

  // Clean up the current day temp file
  fs.unlinkSync(tempFile);

  console.log(
    `\n${BOLD}${GREEN}✅ Itinerary processing and upload completed successfully!${RESET}`
  );
  console.log(
    `${BLUE}Data uploaded to ${
      isRemote ? "remote" : "local"
    } KV namespace: ${KV_NAMESPACE}${RESET}\n`
  );
} catch (error) {
  console.error(`${RED}Error uploading trip data:${RESET}`, error);
  process.exit(1);
}
