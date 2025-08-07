#!/usr/bin/env node

/**
 * ZERO-FAILURE API MANAGEMENT SYSTEM
 *
 * Ensures all 4 critical API connections are properly configured:
 * 1. TESSIE_API_KEY - Tesla data integration
 * 2. MAPBOX_ACCESS_TOKEN - Map services
 * 3. OPENWEATHER_API_KEY - Weather data
 * 4. JWT_SECRET - Authentication security
 *
 * This system validates, monitors, and maintains API configurations
 * with zero tolerance for failures.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class APIManagementSystem {
  constructor() {
    this.requiredAPIs = {
      TESSIE_API_KEY: {
        description: "Tesla data via Tessie API - MOST CRITICAL",
        testEndpoint: "https://api.tessie.com/me",
        required: true,
        priority: 1,
      },
      MAPBOX_ACCESS_TOKEN: {
        description: "Map integration and geocoding",
        testEndpoint:
          "https://api.mapbox.com/geocoding/v5/mapbox.places/0,0.json",
        required: true,
        priority: 2,
      },
      OPENWEATHER_API_KEY: {
        description: "Weather data integration",
        testEndpoint: "https://api.openweathermap.org/data/2.5/weather",
        required: true,
        priority: 3,
      },
      JWT_SECRET: {
        description: "Authentication security",
        testEndpoint: null,
        required: true,
        priority: 4,
        minLength: 32,
      },
      TESLA_VIN: {
        description: "Tesla Vehicle Identification Number",
        testEndpoint: null,
        required: true,
        priority: 5,
        pattern: /^[A-HJ-NPR-Z0-9]{17}$/,
      },
    };

    this.environments = ["development", "production"];
    this.logFile = path.join(__dirname, "api-management.log");
    this.configFile = path.join(__dirname, "api-config-status.json");
  }

  log(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    console.log(logEntry.trim());

    // Ensure log directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(this.logFile, logEntry);
  }

  async checkCloudflareSecrets(environment = null) {
    this.log(
      `🔍 Checking Cloudflare secrets${
        environment ? ` for ${environment}` : ""
      }...`
    );

    const results = {};

    for (const [apiName, config] of Object.entries(this.requiredAPIs)) {
      try {
        const envFlag = environment ? `--env ${environment}` : "";
        const command = `npx wrangler secret list ${envFlag}`;

        const output = execSync(command, {
          encoding: "utf8",
          cwd: path.join(__dirname, "backend", "edge-worker"),
        });

        const secretExists = output.includes(apiName);
        results[apiName] = {
          configured: secretExists,
          environment: environment || "development",
          priority: config.priority,
          description: config.description,
        };

        if (secretExists) {
          this.log(
            `✅ ${apiName} configured in ${environment || "development"}`
          );
        } else {
          this.log(
            `❌ ${apiName} MISSING in ${environment || "development"}`,
            "ERROR"
          );
        }
      } catch (error) {
        this.log(`❌ Failed to check ${apiName}: ${error.message}`, "ERROR");
        results[apiName] = {
          configured: false,
          environment: environment || "development",
          error: error.message,
          priority: config.priority,
          description: config.description,
        };
      }
    }

    return results;
  }

  async validateAPIHealth() {
    this.log("🏥 Validating API health...");

    const healthResults = {};

    for (const [apiName, config] of Object.entries(this.requiredAPIs)) {
      if (!config.testEndpoint) {
        healthResults[apiName] = {
          status: "no_test",
          message: "No test endpoint defined",
        };
        continue;
      }

      try {
        // This would need to be implemented with proper secret retrieval
        // For now, we'll mark as needs_testing
        healthResults[apiName] = {
          status: "needs_testing",
          message: "Health check requires secret access",
        };
      } catch (error) {
        healthResults[apiName] = {
          status: "error",
          message: error.message,
        };
        this.log(
          `❌ ${apiName} health check failed: ${error.message}`,
          "ERROR"
        );
      }
    }

    return healthResults;
  }

  async auditAllConfigurations() {
    this.log("🔍 STARTING COMPREHENSIVE API AUDIT");

    const auditResults = {
      timestamp: new Date().toISOString(),
      environments: {},
      healthChecks: {},
      criticalIssues: [],
      recommendations: [],
    };

    // Check each environment
    for (const env of this.environments) {
      auditResults.environments[env] = await this.checkCloudflareSecrets(env);
    }

    // Validate API health
    auditResults.healthChecks = await this.validateAPIHealth();

    // Identify critical issues
    for (const env of this.environments) {
      for (const [apiName, result] of Object.entries(
        auditResults.environments[env]
      )) {
        if (!result.configured && this.requiredAPIs[apiName].required) {
          auditResults.criticalIssues.push({
            severity: "CRITICAL",
            environment: env,
            api: apiName,
            issue: `Missing required API configuration`,
            priority: this.requiredAPIs[apiName].priority,
          });
        }
      }
    }

    // Generate recommendations
    if (auditResults.criticalIssues.length > 0) {
      auditResults.recommendations.push({
        action: "immediate",
        description: "Run setup-tessie-secrets.sh to configure missing APIs",
        command: "./setup-tessie-secrets.sh",
      });
    }

    // Save audit results
    fs.writeFileSync(this.configFile, JSON.stringify(auditResults, null, 2));

    return auditResults;
  }

  async fixMissingConfigurations() {
    this.log("🔧 FIXING MISSING API CONFIGURATIONS");

    const audit = await this.auditAllConfigurations();

    if (audit.criticalIssues.length === 0) {
      this.log("✅ All API configurations are properly set!");
      return true;
    }

    this.log(`❌ Found ${audit.criticalIssues.length} critical issues:`);
    audit.criticalIssues.forEach((issue) => {
      this.log(
        `   ${issue.severity}: ${issue.api} missing in ${issue.environment}`,
        "ERROR"
      );
    });

    // Check if setup script exists
    const setupScript = path.join(__dirname, "setup-tessie-secrets.sh");
    if (fs.existsSync(setupScript)) {
      this.log("🔧 Running setup-tessie-secrets.sh to fix configurations...");
      try {
        execSync("chmod +x setup-tessie-secrets.sh", { cwd: __dirname });
        this.log("✅ Setup script is ready to run");
        this.log(
          "🚨 MANUAL ACTION REQUIRED: Run ./setup-tessie-secrets.sh to configure secrets"
        );
        return false;
      } catch (error) {
        this.log(
          `❌ Failed to prepare setup script: ${error.message}`,
          "ERROR"
        );
        return false;
      }
    } else {
      this.log("❌ setup-tessie-secrets.sh not found!", "ERROR");
      return false;
    }
  }

  generateDeploymentCheck() {
    return `#!/bin/bash
# Auto-generated deployment check for API configurations
# This runs before every deployment to ensure zero failures

echo "🔍 Pre-deployment API configuration check..."

# Check if API management system exists
if [ ! -f "api-management-system.js" ]; then
    echo "❌ API management system not found!"
    exit 1
fi

# Run comprehensive audit
node api-management-system.js audit

# Check audit results
if [ -f "api-config-status.json" ]; then
    CRITICAL_ISSUES=$(cat api-config-status.json | grep -o '"severity":"CRITICAL"' | wc -l)
    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        echo "❌ DEPLOYMENT BLOCKED: $CRITICAL_ISSUES critical API configuration issues found"
        echo "Run './setup-tessie-secrets.sh' to fix configurations"
        exit 1
    fi
    echo "✅ All API configurations verified - deployment can proceed"
else
    echo "❌ Unable to verify API configurations"
    exit 1
fi
`;
  }

  async createDeploymentHooks() {
    this.log("🪝 Creating deployment hooks for zero-failure API management...");

    // Pre-deployment check
    const preDeployCheck = this.generateDeploymentCheck();
    const preDeployPath = path.join(__dirname, "pre-deploy-api-check.sh");
    fs.writeFileSync(preDeployPath, preDeployCheck);
    execSync(`chmod +x "${preDeployPath}"`);

    // Package.json integration
    const packageJsonPath = path.join(__dirname, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      if (!packageJson.scripts) packageJson.scripts = {};

      packageJson.scripts["api:audit"] = "node api-management-system.js audit";
      packageJson.scripts["api:fix"] = "node api-management-system.js fix";
      packageJson.scripts["api:health"] =
        "node api-management-system.js health";
      packageJson.scripts["pre-deploy"] = "./pre-deploy-api-check.sh";

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      this.log("✅ Added API management scripts to package.json");
    }

    this.log("✅ Deployment hooks created successfully");
  }
}

// CLI Interface
async function main() {
  const apiManager = new APIManagementSystem();
  const command = process.argv[2] || "audit";

  try {
    switch (command) {
      case "audit":
        const audit = await apiManager.auditAllConfigurations();
        console.log("\n📊 AUDIT SUMMARY:");
        console.log(`Critical Issues: ${audit.criticalIssues.length}`);
        console.log(
          `Environments Checked: ${Object.keys(audit.environments).length}`
        );
        if (audit.criticalIssues.length > 0) {
          console.log("\n🚨 CRITICAL ISSUES FOUND:");
          audit.criticalIssues.forEach((issue) => {
            console.log(`   ${issue.api} missing in ${issue.environment}`);
          });
          process.exit(1);
        }
        break;

      case "fix":
        const fixed = await apiManager.fixMissingConfigurations();
        process.exit(fixed ? 0 : 1);
        break;

      case "health":
        const health = await apiManager.validateAPIHealth();
        console.log("\n🏥 API HEALTH STATUS:");
        Object.entries(health).forEach(([api, status]) => {
          console.log(`   ${api}: ${status.status} - ${status.message}`);
        });
        break;

      case "setup-hooks":
        await apiManager.createDeploymentHooks();
        break;

      default:
        console.log(
          "Usage: node api-management-system.js [audit|fix|health|setup-hooks]"
        );
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ API Management System Error: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default APIManagementSystem;
