#!/usr/bin/env node
/* eslint-disable no-undef, no-console */
/**
 * verify-mapbox-token.cjs
 *
 * This script verifies that the Mapbox token is correctly set in the
 * environment and tests its validity by making a request to the Mapbox API.
 *
 * Usage:
 *   node verify-mapbox-token.cjs [token]
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const dotenv = require("dotenv");

// Configure
const ENV_FILE_PATH = path.join(__dirname, ".env");
const ENV_EXAMPLE_PATH = path.join(__dirname, ".env.example");
const TOKEN_ENV_VARS = [
  "REACT_APP_MAPBOX_TOKEN",
  "VITE_MAPBOX_TOKEN",
  "MAPBOX_TOKEN",
];
const MAPBOX_API_URL = "https://api.mapbox.com/tokens/v2";

// Setup console colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Parse command line arguments
const args = process.argv.slice(2);
const providedToken = args[0];

/**
 * Main function to verify the Mapbox token
 */
async function verifyMapboxToken() {
  console.log(
    `${colors.bright}${colors.blue}=== Mapbox Token Verification ===\n${colors.reset}`
  );

  // Step 1: Find the token
  const token = await findMapboxToken();
  if (!token) {
    console.log(`${colors.red}No Mapbox token found.${colors.reset}`);
    console.log(`Please provide a token in one of the following ways:`);
    console.log(
      `  1. As a command line argument: ${colors.cyan}node verify-mapbox-token.cjs YOUR_TOKEN${colors.reset}`
    );
    console.log(
      `  2. In a .env file with one of: ${TOKEN_ENV_VARS.join(", ")}`
    );
    process.exit(1);
  }

  console.log(
    `${colors.green}✓ Token found: ${maskToken(token)}${colors.reset}\n`
  );

  // Step 2: Verify token format
  if (!validateTokenFormat(token)) {
    console.log(`${colors.red}✗ Invalid token format${colors.reset}`);
    console.log(
      `Token should start with 'pk.' for public tokens or 'sk.' for secret tokens.`
    );
    process.exit(1);
  }

  console.log(`${colors.green}✓ Token format looks valid${colors.reset}`);

  // Step 3: Test token with Mapbox API
  try {
    const isValid = await testMapboxToken(token);
    if (isValid) {
      console.log(
        `${colors.green}✓ Token is valid and working with Mapbox API${colors.reset}`
      );
    } else {
      console.log(
        `${colors.red}✗ Token was accepted but might have limited scopes${colors.reset}`
      );
    }
  } catch (error) {
    console.log(
      `${colors.red}✗ Token validation failed: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }

  // Step 4: Suggest next steps
  console.log(
    `\n${colors.bright}${colors.blue}=== Next Steps ===\n${colors.reset}`
  );
  console.log(
    `To use this token in your app, make sure it's set in your environment:`
  );
  console.log(
    `  - For Create React App: ${colors.cyan}REACT_APP_MAPBOX_TOKEN=${maskToken(
      token
    )}${colors.reset}`
  );
  console.log(
    `  - For Vite: ${colors.cyan}VITE_MAPBOX_TOKEN=${maskToken(token)}${
      colors.reset
    }`
  );

  // Check if the token is already in the .env file
  const envExists = fs.existsSync(ENV_FILE_PATH);
  const tokenInEnv = envExists
    ? await checkTokenInEnvFile(ENV_FILE_PATH, token)
    : false;

  if (tokenInEnv) {
    console.log(
      `\n${colors.green}✓ Token is already correctly set in .env file${colors.reset}`
    );
  } else if (envExists) {
    console.log(
      `\n${colors.yellow}! Token not found in .env file or is different${colors.reset}`
    );
    console.log(
      `Would you like to update the .env file with this token? (y/n)`
    );
    const answer = await getUserInput();
    if (answer.toLowerCase() === "y") {
      await updateEnvFile(ENV_FILE_PATH, token);
    }
  } else {
    console.log(`\n${colors.yellow}! No .env file found${colors.reset}`);
    console.log(`Would you like to create a .env file with this token? (y/n)`);
    const answer = await getUserInput();
    if (answer.toLowerCase() === "y") {
      await createEnvFile(ENV_FILE_PATH, token);
    }
  }

  console.log(
    `\n${colors.bright}${colors.green}Verification complete!${colors.reset}`
  );
}

/**
 * Find the Mapbox token from command line args or environment
 */
async function findMapboxToken() {
  // 1. Check command line argument
  if (providedToken) {
    return providedToken;
  }

  // 2. Check environment variables
  for (const envVar of TOKEN_ENV_VARS) {
    if (process.env[envVar]) {
      return process.env[envVar];
    }
  }

  // 3. Check .env file
  if (fs.existsSync(ENV_FILE_PATH)) {
    try {
      const envConfig = dotenv.parse(fs.readFileSync(ENV_FILE_PATH));
      for (const envVar of TOKEN_ENV_VARS) {
        if (envConfig[envVar]) {
          return envConfig[envVar];
        }
      }
    } catch (error) {
      console.log(
        `${colors.yellow}Warning: Error reading .env file: ${error.message}${colors.reset}`
      );
    }
  }

  return null;
}

/**
 * Validate the format of the token
 */
function validateTokenFormat(token) {
  // Public tokens start with 'pk.', secret tokens with 'sk.'
  return token && (token.startsWith("pk.") || token.startsWith("sk."));
}

/**
 * Test the token with the Mapbox API
 */
function testMapboxToken(token) {
  return new Promise((resolve, reject) => {
    const url = `${MAPBOX_API_URL}?access_token=${token}`;

    https
      .get(url, (res) => {
        const { statusCode } = res;

        if (statusCode === 200) {
          resolve(true);
        } else if (statusCode === 401 || statusCode === 403) {
          reject(
            new Error(
              `Unauthorized (${statusCode}). Your token may be invalid or expired.`
            )
          );
        } else {
          reject(new Error(`Request failed with status code ${statusCode}`));
        }

        // Consume response data to free up memory
        res.resume();
      })
      .on("error", (e) => {
        reject(new Error(`Network error: ${e.message}`));
      });
  });
}

/**
 * Check if the token is already in the .env file
 */
function checkTokenInEnvFile(filePath, token) {
  return new Promise((resolve) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      for (const envVar of TOKEN_ENV_VARS) {
        const regex = new RegExp(`${envVar}=["']?${token}["']?`);
        if (regex.test(content)) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    } catch (error) {
      console.log(
        `${colors.yellow}Warning: Error checking .env file: ${error.message}${colors.reset}`
      );
      resolve(false);
    }
  });
}

/**
 * Update the .env file with the token
 */
function updateEnvFile(filePath, token) {
  return new Promise((resolve) => {
    try {
      let content = fs.readFileSync(filePath, "utf8");
      let updated = false;

      // Try to update existing token variables
      for (const envVar of TOKEN_ENV_VARS) {
        const regex = new RegExp(`${envVar}=.*`, "g");
        if (regex.test(content)) {
          content = content.replace(regex, `${envVar}=${token}`);
          updated = true;
        }
      }

      // If no token variables found, add the primary one
      if (!updated) {
        content += `\n# Mapbox token for map rendering\nREACT_APP_MAPBOX_TOKEN=${token}\n`;
      }

      fs.writeFileSync(filePath, content);
      console.log(
        `${colors.green}✓ Updated .env file with token${colors.reset}`
      );
      resolve(true);
    } catch (error) {
      console.log(
        `${colors.red}Error updating .env file: ${error.message}${colors.reset}`
      );
      resolve(false);
    }
  });
}

/**
 * Create a new .env file with the token
 */
function createEnvFile(filePath, token) {
  return new Promise((resolve) => {
    try {
      // Check if .env.example exists to use as a template
      if (fs.existsSync(ENV_EXAMPLE_PATH)) {
        let content = fs.readFileSync(ENV_EXAMPLE_PATH, "utf8");

        // Try to update existing token variables
        let updated = false;
        for (const envVar of TOKEN_ENV_VARS) {
          const regex = new RegExp(`${envVar}=.*`, "g");
          if (regex.test(content)) {
            content = content.replace(regex, `${envVar}=${token}`);
            updated = true;
          }
        }

        // If no token variables found, add the primary one
        if (!updated) {
          content += `\n# Mapbox token for map rendering\nREACT_APP_MAPBOX_TOKEN=${token}\n`;
        }

        fs.writeFileSync(filePath, content);
      } else {
        // Create minimal .env file
        const content = `# Environment variables for 48 Continental USA project\n\n# Mapbox token for map rendering\nREACT_APP_MAPBOX_TOKEN=${token}\n`;
        fs.writeFileSync(filePath, content);
      }

      console.log(
        `${colors.green}✓ Created .env file with token${colors.reset}`
      );
      resolve(true);
    } catch (error) {
      console.log(
        `${colors.red}Error creating .env file: ${error.message}${colors.reset}`
      );
      resolve(false);
    }
  });
}

/**
 * Mask the token for display
 */
function maskToken(token) {
  if (!token || token.length < 10) return token;
  return `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
}

/**
 * Get user input from the console
 */
function getUserInput() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (data) => {
      process.stdin.pause();
      resolve(data.trim());
    });
  });
}

// Run the verification
verifyMapboxToken().catch((error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});
