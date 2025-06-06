#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

/**
 * Mapbox Token Setup Utility
 *
 * This script ensures that the Mapbox token is properly configured in the .env file
 * and validates that it's a valid public token (pk.*).
 *
 * The script checks:
 * 1. If .env file exists and has a VITE_MAPBOX_TOKEN
 * 2. If the token starts with 'pk.' (public token prefix)
 * 3. If not found, it will prompt to create or update the token
 *
 * Usage:
 *   node setup-mapbox-token.cjs [--token YOUR_MAPBOX_TOKEN]
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const chalk = require("chalk") || {
  green: (t) => t,
  red: (t) => t,
  yellow: (t) => t,
  blue: (t) => t,
  cyan: (t) => t,
  gray: (t) => t,
};

// Constants
const ENV_FILE_PATH = path.resolve(__dirname, ".env");
const ENV_EXAMPLE_PATH = path.resolve(__dirname, ".env.example");
const TOKEN_KEY = "VITE_MAPBOX_TOKEN";
const PUBLIC_TOKEN_PREFIX = "pk.";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Check if we have a token passed as an argument
let providedToken = null;
const tokenArgIndex = process.argv.indexOf("--token");
if (tokenArgIndex > -1 && process.argv.length > tokenArgIndex + 1) {
  providedToken = process.argv[tokenArgIndex + 1];
}

// Helper to prompt user for input
const prompt = (question) =>
  new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });

// Load existing .env file if it exists
const loadEnvFile = () => {
  try {
    if (fs.existsSync(ENV_FILE_PATH)) {
      const envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
      console.log(chalk.gray("Existing .env file found."));
      return envContent;
    } else {
      console.log(chalk.yellow("No .env file found. Will create a new one."));

      // Check if .env.example exists, and use it as a template if it does
      if (fs.existsSync(ENV_EXAMPLE_PATH)) {
        const exampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, "utf8");
        console.log(chalk.gray("Using .env.example as template."));
        return exampleContent;
      }

      return "";
    }
  } catch (error) {
    console.error(chalk.red(`Error reading env file: ${error.message}`));
    return "";
  }
};

// Extract existing token from .env content
const extractExistingToken = (envContent) => {
  const tokenRegex = new RegExp(`${TOKEN_KEY}=([^\n\r]*)`, "i");
  const match = envContent.match(tokenRegex);
  return match ? match[1].trim() : null;
};

// Validate that a token starts with pk. prefix (public token)
const isValidPublicToken = (token) => {
  if (!token) return false;

  const trimmedToken = token.trim();
  if (!trimmedToken.startsWith(PUBLIC_TOKEN_PREFIX)) {
    console.log(
      chalk.yellow(
        `Token must start with '${PUBLIC_TOKEN_PREFIX}' (public token prefix).`
      )
    );
    return false;
  }

  // Basic length validation (public tokens are usually quite long)
  if (trimmedToken.length < 20) {
    console.log(
      chalk.yellow("Token seems too short for a valid Mapbox token.")
    );
    return false;
  }

  return true;
};

// Update or create .env file with the token
const updateEnvFile = (envContent, token) => {
  try {
    const tokenLine = `${TOKEN_KEY}=${token}`;
    let newContent;

    if (envContent.includes(TOKEN_KEY)) {
      // Replace existing token
      newContent = envContent.replace(
        new RegExp(`${TOKEN_KEY}=([^\n\r]*)`, "i"),
        tokenLine
      );
      console.log(chalk.gray("Updating existing Mapbox token in .env file."));
    } else {
      // Add new token
      newContent =
        envContent + (envContent.endsWith("\n") ? "" : "\n") + tokenLine + "\n";
      console.log(chalk.gray("Adding Mapbox token to .env file."));
    }

    fs.writeFileSync(ENV_FILE_PATH, newContent);
    console.log(
      chalk.green(
        `✓ Successfully ${
          envContent.includes(TOKEN_KEY) ? "updated" : "added"
        } Mapbox token in .env file.`
      )
    );
    return true;
  } catch (error) {
    console.error(chalk.red(`Error updating .env file: ${error.message}`));
    return false;
  }
};

// Test token against Mapbox API
const testMapboxToken = async (token) => {
  try {
    console.log(chalk.gray("Testing token against Mapbox API..."));

    // Test token by fetching the styles endpoint
    const response = await fetch(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${token}`
    );

    if (response.ok) {
      console.log(
        chalk.green("✓ Token is valid! Successfully connected to Mapbox API.")
      );
      return true;
    } else {
      const errorText = await response.text();
      console.log(
        chalk.red(
          `✗ Token validation failed with status ${response.status}: ${errorText}`
        )
      );
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`Error testing token: ${error.message}`));
    return false;
  }
};

// Main function
const main = async () => {
  console.log(chalk.blue("🗺️  Mapbox Token Setup Utility"));
  console.log(chalk.blue("==========================="));

  // Load existing .env content
  const envContent = loadEnvFile();

  // Extract existing token
  const existingToken = extractExistingToken(envContent);

  console.log("\nChecking Mapbox token configuration...");

  // Determine which token to use
  let tokenToUse = providedToken || existingToken;

  // If we have a token, validate it
  if (tokenToUse) {
    console.log(chalk.gray(`Found token: ${tokenToUse.substring(0, 8)}...`));

    if (isValidPublicToken(tokenToUse)) {
      console.log(chalk.green("✓ Token format appears valid."));

      // Test the token against Mapbox API
      const isValid = await testMapboxToken(tokenToUse);

      if (isValid) {
        // Token is valid, update .env if needed
        if (tokenToUse !== existingToken) {
          updateEnvFile(envContent, tokenToUse);
        } else {
          console.log(
            chalk.green("✓ Existing token is valid. No changes needed.")
          );
        }
      } else {
        // Token is invalid, prompt for a new one
        tokenToUse = await prompt(
          chalk.yellow("Enter a valid Mapbox token (starts with pk.): ")
        );
        if (isValidPublicToken(tokenToUse)) {
          updateEnvFile(envContent, tokenToUse);
        } else {
          console.log(chalk.red("Invalid token format. Setup canceled."));
        }
      }
    } else {
      // Token format is invalid, prompt for a new one
      tokenToUse = await prompt(
        chalk.yellow("Enter a valid Mapbox token (starts with pk.): ")
      );
      if (isValidPublicToken(tokenToUse)) {
        updateEnvFile(envContent, tokenToUse);
      } else {
        console.log(chalk.red("Invalid token format. Setup canceled."));
      }
    }
  } else {
    // No token found, prompt for one
    console.log(chalk.yellow("No Mapbox token found in .env file."));
    tokenToUse = await prompt(
      chalk.yellow("Enter your Mapbox token (starts with pk.): ")
    );

    if (isValidPublicToken(tokenToUse)) {
      updateEnvFile(envContent, tokenToUse);
    } else {
      console.log(chalk.red("Invalid token format. Setup canceled."));
    }
  }

  console.log(chalk.blue("\nSetup complete!"));
  console.log(
    chalk.gray("You can now run the application with your Mapbox token.")
  );
  console.log(
    chalk.gray(
      "If you need to change the token later, run this script again or edit the .env file directly."
    )
  );

  rl.close();
};

// Run the main function
main().catch((error) => {
  console.error(chalk.red(`Unexpected error: ${error.message}`));
  rl.close();
});
