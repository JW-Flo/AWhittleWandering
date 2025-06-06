#!/usr/bin/env node

/**
 * Simple script to check wrangler KV command syntax
 */

const { execSync } = require("child_process");

try {
  console.log("Checking wrangler KV command syntax...");

  // Check general KV commands
  console.log("\n==== Wrangler KV Help ====");
  const result = execSync("cd edge-worker && npx wrangler kv --help", {
    encoding: "utf8",
  });
  console.log(result);

  console.log("\n==== Checking specific KV commands ====");
  const keyResult = execSync(
    "cd edge-worker && npx wrangler kv:namespace --help",
    { encoding: "utf8" }
  );
  console.log(keyResult);
} catch (error) {
  console.error("Error checking wrangler syntax:", error);
}
