#!/usr/bin/env node

/**
 * Script to upload secrets from .dev.vars to Cloudflare Workers
 * Automatic version - no confirmation required
 */

import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .dev.vars file
function parseDevVars(content) {
  const vars = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const equalsIndex = trimmedLine.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmedLine.slice(0, equalsIndex).trim();
    const value = trimmedLine.slice(equalsIndex + 1).trim();

    vars[key] = value;
  }

  return vars;
}

// Main function
async function main() {
  try {
    // Path to .dev.vars file
    const devVarsPath = path.resolve(__dirname, "../edge-worker/.dev.vars");

    // Check if file exists
    if (!fs.existsSync(devVarsPath)) {
      console.error(".dev.vars file not found at", devVarsPath);
      process.exit(1);
    }

    // Read and parse .dev.vars
    const devVarsContent = fs.readFileSync(devVarsPath, "utf8");
    const vars = parseDevVars(devVarsContent);

    console.log("Found the following variables in .dev.vars:");
    console.log(Object.keys(vars).join(", "));
    console.log("Uploading secrets automatically...");

    // Loop through vars and upload each as a secret
    for (const [key, value] of Object.entries(vars)) {
      console.log(`Uploading ${key}...`);

      // Create a temporary file with the secret value
      const tempFilePath = path.resolve(__dirname, `../temp-secret-${key}`);
      fs.writeFileSync(tempFilePath, value);

      try {
        // Use wrangler to upload the secret from the edge-worker directory
        const edgeWorkerDir = path.resolve(__dirname, "../edge-worker");
        const relativeSecretPath = path.relative(edgeWorkerDir, tempFilePath);

        // Change working directory to edge-worker and run the command
        process.chdir(edgeWorkerDir);
        execSync(`npx wrangler secret put ${key} < ${relativeSecretPath}`, {
          stdio: "inherit",
        });
        // Change back to original directory
        process.chdir(__dirname);
        console.log(`Successfully uploaded ${key}`);
      } catch (error) {
        console.error(`Failed to upload ${key}:`, error);
      } finally {
        // Delete the temporary file
        fs.unlinkSync(tempFilePath);
      }
    }

    console.log("All secrets uploaded!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the script
main();
