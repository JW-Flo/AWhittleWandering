#!/usr/bin/env node
/* eslint-disable */
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

console.log("=== Environment Variables for Cloudflare Pages ===");
console.log("Configure these variables in the Cloudflare Pages dashboard:");
console.log("");

Object.entries(productionEnvVars).forEach(([key, value]) => {
  console.log(`${key} = ${value}`);
});

console.log("");
console.log("Remember to configure the custom domain for your site:");
console.log("1. Go to your Cloudflare Pages project");
console.log("2. Navigate to Settings > Custom Domains");
console.log("3. Add custom domain: thewanderingwhittle.com");
