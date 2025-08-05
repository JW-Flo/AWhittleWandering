#!/usr/bin/env node

import https from "https";
import fs from "fs";

/**
 * Comprehensive website validation test
 */
async function validateWebsite() {
  const urls = [
    "https://awhittlewandering.com",
    "https://5643ac07.awhittlewandering-site.pages.dev",
  ];

  console.log("🔍 Starting Website Validation Test");
  console.log("====================================\n");

  for (const url of urls) {
    console.log(`Testing: ${url}`);
    try {
      const html = await fetchPage(url);
      const results = analyzeHTML(html, url);

      console.log(`📊 Results for ${url}:`);
      console.log(`  - Page loads: ${results.loads ? "✅" : "❌"}`);
      console.log(`  - Has HTML content: ${results.hasContent ? "✅" : "❌"}`);
      console.log(`  - Has root div: ${results.hasRootDiv ? "✅" : "❌"}`);
      console.log(`  - Has JavaScript: ${results.hasJS ? "✅" : "❌"}`);
      console.log(`  - Page size: ${results.size} bytes`);
      console.log(`  - Likely working: ${results.likelyWorking ? "✅" : "❌"}`);

      if (!results.likelyWorking) {
        console.log(`  - Issues: ${results.issues.join(", ")}`);
      }

      // Save HTML for inspection
      const filename = `debug-${url.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
      fs.writeFileSync(filename, html);
      console.log(`  - HTML saved to: ${filename}`);
    } catch (error) {
      console.log(`❌ Failed to fetch ${url}: ${error.message}`);
    }
    console.log("");
  }
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

function analyzeHTML(html, url) {
  const results = {
    loads: true,
    hasContent: html.length > 100,
    hasRootDiv: html.includes('<div id="root">'),
    hasJS: html.includes("<script"),
    size: html.length,
    likelyWorking: false,
    issues: [],
  };

  // Check for common issues
  if (html.length < 100) {
    results.issues.push("Page too small");
  }

  if (!results.hasRootDiv) {
    results.issues.push("Missing root div");
  }

  if (!results.hasJS) {
    results.issues.push("No JavaScript found");
  }

  // Check for error indicators
  if (html.includes("404") || html.includes("Not Found")) {
    results.issues.push("404 error");
  }

  if (html.includes("Error") && !html.includes("ErrorBoundary")) {
    results.issues.push("Contains error text");
  }

  // Determine if likely working
  results.likelyWorking =
    results.hasContent &&
    results.hasRootDiv &&
    results.hasJS &&
    results.issues.length === 0;

  return results;
}

// Run the test
validateWebsite().catch(console.error);
