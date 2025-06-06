#!/usr/bin/env node
/* eslint-disable */
// This is a CommonJS script
const { exec } = require("child_process");
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

// Format for wrangler command
const envVarArgs = Object.entries(productionEnvVars)
  .map(([key, value]) => `--var ${key}="${value}"`)
  .join(" ");

// Construct the wrangler command
const command = `npx wrangler pages deploy dist --project-name=wandering-whittle ${envVarArgs}`;

console.log("Executing command:");
console.log(command);

// Execute the command
exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(`stdout: ${stdout}`);
});
