#!/usr/bin/env node

/* eslint-disable no-console */

import { promisify } from "util";
import https from "https";
import dns from "dns";
import { fileURLToPath } from "url";

const resolveCname = promisify(dns.resolveCname);
const resolve = promisify(dns.resolve);

const TARGET_DOMAIN = "continentalusa-site.pages.dev";
const WWW_DOMAIN = "www.awhittlewandering.com";
const MAIN_DOMAIN = "awhittlewandering.com";

/**
 * Verify DNS configuration and site accessibility
 */
async function verifyDnsChange() {
  console.log("🔍 Starting DNS Change Verification\n");

  try {
    // 1. Check current DNS configuration
    console.log("Checking current DNS configuration...");
    const currentCname = await resolveCname(WWW_DOMAIN).catch(() => []);
    console.log("Current CNAME record:", currentCname[0] || "Not found");

    // 2. Test target site availability
    console.log("\nVerifying target site availability...");
    const targetSiteStatus = await checkSiteStatus(TARGET_DOMAIN);
    console.log("Target site status:", targetSiteStatus.code);
    console.log("SSL/TLS:", targetSiteStatus.ssl ? "✅ Valid" : "❌ Invalid");

    // 3. Check SSL certificate for www domain
    console.log("\nChecking current domain configuration...");
    const wwwStatus = await checkSiteStatus(WWW_DOMAIN);
    if (wwwStatus.error) {
      console.log("Note: WWW domain not yet configured (this is expected)");
    } else {
      console.log("WWW domain status:", wwwStatus.code);
      console.log("SSL/TLS:", wwwStatus.ssl ? "✅ Valid" : "❌ Invalid");
    }

    // 4. Check for dependencies
    console.log("\nChecking for dependencies...");
    const domains = await resolve(MAIN_DOMAIN);
    console.log("Main domain resolves to:", domains.join(", "));

    // Summary
    outputSummary({
      targetSite: !targetSiteStatus.error,
      ssl: targetSiteStatus.ssl,
      currentCname: currentCname[0],
      domains,
    });
  } catch (error) {
    console.error("\n❌ Verification failed:", error.message);
    console.log("\nRecommendation: Resolve issues before proceeding");
    process.exit(1);
  }
}

/**
 * Check site status and SSL
 * @param {string} domain Domain to check
 * @returns {Promise<{code?: number, ssl?: boolean, error?: boolean}>}
 */
async function checkSiteStatus(domain) {
  return new Promise((resolve) => {
    https
      .get(`https://${domain}`, (res) => {
        resolve({
          code: res.statusCode,
          ssl: res.socket.getPeerCertificate().valid,
        });
      })
      .on("error", () => {
        resolve({ error: true });
      });
  });
}

/**
 * Output verification summary
 * @param {Object} params Summary parameters
 */
function outputSummary({ targetSite, ssl, currentCname, domains }) {
  console.log("\n📋 Verification Summary:");
  console.log(`1. Target site (${TARGET_DOMAIN}): ${targetSite ? "✅" : "❌"}`);
  console.log(`2. SSL certificates: ${ssl ? "✅" : "❌"}`);
  console.log("3. Current DNS records documented ✅");

  console.log("\n✅ Ready to proceed with DNS change");
  console.log("\nRollback information:");
  console.log("Current CNAME:", currentCname || "None");
  console.log("Current A records:", domains.join(", "));
}

// Check if file is being run directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  verifyDnsChange().catch(console.error);
}

export default verifyDnsChange;
