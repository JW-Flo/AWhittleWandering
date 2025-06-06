#!/usr/bin/env node
/* eslint-disable */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Read the .env file
const envPath = path.join(__dirname, ".env");
const envContent = fs.readFileSync(envPath, "utf8");

// Parse environment variables
const envVars = envContent.split("\n").reduce((acc, line) => {
  if (line && !line.startsWith("#")) {
    const [key, value] = line.split("=");
    if (key && value !== undefined) {
      acc[key] = value;
    }
  }
  return acc;
}, {});

// Update environment variables for production
const productionEnvVars = {
  ...envVars,
  VITE_EDGE_WORKER_URL: "https://thewanderingwhittle-edge.workers.dev",
  VITE_API_BASE_URL: "https://thewanderingwhittle-edge.workers.dev",
  VITE_OPENWEATHER_API_KEY: "15bff53e78e69788b02b407a2603ee43", // From Cloudflare dashboard
  VITE_USE_SIMULATED_DATA: "false",
};

// Format variables for wrangler command
const varArgs = Object.entries(productionEnvVars)
  .map(([key, value]) => `--var ${key}="${value}"`)
  .join(" ");

// Construct the wrangler command to set environment variables
const command = `npx wrangler pages deployment create 48Continental_Starter/public-site/dist --project-name continentalusa-site ${varArgs}`;

console.log("Setting environment variables in Cloudflare Pages...");
console.log(command);

try {
  // Execute the command
  const output = execSync(command, { cwd: __dirname, encoding: "utf8" });
  console.log(output);
  console.log("Environment variables successfully set in Cloudflare Pages!");
} catch (error) {
  console.error("Error setting environment variables:");
  console.error(error.message);
  console.error("You may need to run 'wrangler login' first.");
}
