#!/usr/bin/env node

/**
 * Test Simple Map Functionality
 *
 * This script runs the development server and opens the browser to the
 * SimpleMapTestPage route, which showcases the simplified map component
 * with proper coordinate handling and minimal error logic.
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ANSI color codes for prettier console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },
};

// Helper to print colored console messages
const print = {
  info: (msg) => console.log(`${colors.fg.cyan}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.fg.green}${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.fg.yellow}${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.fg.red}${msg}${colors.reset}`),
  header: (msg) =>
    console.log(`\n${colors.bright}${colors.fg.cyan}${msg}${colors.reset}\n`),
};

// Make sure we're in the right directory
const publicSitePath = __dirname;
if (!fs.existsSync(path.join(publicSitePath, "src/components/SimpleMap.jsx"))) {
  print.error(
    "Could not find SimpleMap.jsx! Make sure you are running this script from the public-site directory."
  );
  process.exit(1);
}

// Verify our SimpleMapTestPage component exists
if (
  !fs.existsSync(path.join(publicSitePath, "src/pages/SimpleMapTestPage.jsx"))
) {
  print.error(
    "Could not find SimpleMapTestPage.jsx! Make sure you have created the test page component."
  );
  process.exit(1);
}

// Print welcome message
print.header("48 Continental USA - Simple Map Test");
print.info(
  "This script will launch the development server and open the simplified map test page."
);
print.info("The simplified map component features:");
print.info("  • Direct token handling without complex fallbacks");
print.info("  • Streamlined coordinate processing");
print.info("  • Focused rendering without excessive debug tools");
print.info(
  "  • Clear separation of concerns for map initialization and data rendering"
);
print.info(
  "\nThe test page will show a map with the complete trip route and stops."
);

// Ask for confirmation before starting the server
rl.question("\nStart the development server? (y/n) ", (answer) => {
  if (answer.toLowerCase() !== "y") {
    print.warning("Aborted.");
    rl.close();
    process.exit(0);
  }

  rl.close();

  print.info("\nStarting development server...");

  // Run the development server
  const devServer = exec("npm run dev", { cwd: publicSitePath });

  devServer.stdout.on("data", (data) => {
    console.log(data.toString());

    // When the server is ready, open the browser to our test page
    if (data.includes("Local:") && !browserOpened) {
      browserOpened = true;

      // Wait a moment for the server to fully initialize
      setTimeout(() => {
        print.success("\n✅ Development server is running!");
        print.info("\nOpening the SimpleMapTestPage in your browser...");

        // Open the browser to our test page
        exec("open http://localhost:5173/simple-map-test");

        print.header("TESTING INSTRUCTIONS");
        print.info("1. Verify the map loads without errors");
        print.info("2. Check that the route line appears correctly");
        print.info(
          "3. Confirm that stop markers are in their proper locations"
        );
        print.info("4. Toggle the satellite view to test layer switching");
        print.info("5. Verify vehicle marker appears at the first stop");
        print.info("\nPress Ctrl+C when finished to stop the server.");
      }, 2000);
    }
  });

  devServer.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  let browserOpened = false;

  // Handle process termination
  process.on("SIGINT", () => {
    print.info("\nStopping development server...");
    devServer.kill();
    process.exit(0);
  });
});
