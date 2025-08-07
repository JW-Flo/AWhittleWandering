/**
 * Cloud-Enabled QA Pipeline Runner
 * Integrates with Cloudflare D1 for data storage and monitoring
 */

import fetch from "node-fetch";

export class CloudQARunner {
  constructor(options = {}) {
    this.qaApiUrl =
      options.qaApiUrl || "https://qa-pipeline.kd8jc7v8cd.workers.dev";
    this.runId = null;
    this.config = {
      backend: {
        url: "https://awhittlewandering-api.kd8jc7v8cd.workers.dev",
        timeout: 30000,
      },
      frontend: {
        url: "https://ab99ceea.awhittlewandering-frontend.pages.dev",
        timeout: 30000,
      },
    };
  }

  /**
   * Start a new QA run in the cloud
   */
  async startQARun(options = {}) {
    try {
      const response = await fetch(`${this.qaApiUrl}/qa/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triggerType: options.triggerType || "manual",
          gitCommit: options.gitCommit,
          branch: options.branch || "main",
          environment: options.environment || "production",
          totalIterations: options.iterations || 3,
        }),
      });

      const result = await response.json();
      if (result.success) {
        this.runId = result.runId;
        console.log(`🌥️  Cloud QA Run ${this.runId} started`);
        return this.runId;
      } else {
        throw new Error(`Failed to start QA run: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to start cloud QA run:", error);
      throw error;
    }
  }

  /**
   * Record phase execution in the cloud
   */
  async recordPhase(iteration, phaseName, phaseOrder, status, details = {}) {
    if (!this.runId) {
      throw new Error("QA run not started. Call startQARun() first.");
    }

    try {
      const response = await fetch(
        `${this.qaApiUrl}/qa/runs/${this.runId}/phases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            iteration,
            phaseName,
            phaseOrder,
            status,
            details: {
              ...details,
              startTime: details.startTime || new Date().toISOString(),
              endTime: details.endTime || new Date().toISOString(),
              durationMs: details.durationMs || 0,
            },
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        console.log(`📊 Phase ${phaseName} recorded: ${status}`);
        return result.phaseId;
      }
    } catch (error) {
      console.error(`Failed to record phase ${phaseName}:`, error);
    }
  }

  /**
   * Record test result in the cloud
   */
  async recordTestResult(phaseId, testName, testType, status, details = {}) {
    if (!this.runId) return;

    try {
      await fetch(`${this.qaApiUrl}/qa/runs/${this.runId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseId,
          testName,
          testType,
          status,
          details,
        }),
      });
    } catch (error) {
      console.error(`Failed to record test result ${testName}:`, error);
    }
  }

  /**
   * Record performance metric in the cloud
   */
  async recordPerformanceMetric(
    metricName,
    metricValue,
    metricUnit,
    endpointUrl = null,
    responseTimeMs = null
  ) {
    if (!this.runId) return;

    try {
      await fetch(`${this.qaApiUrl}/qa/runs/${this.runId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metricName,
          metricValue,
          metricUnit,
          endpointUrl,
          responseTimeMs,
        }),
      });

      console.log(
        `📈 Metric recorded: ${metricName} = ${metricValue} ${metricUnit}`
      );
    } catch (error) {
      console.error(`Failed to record metric ${metricName}:`, error);
    }
  }

  /**
   * Create monitoring alert in the cloud
   */
  async createAlert(
    alertType,
    severity,
    title,
    description,
    affectedService = null
  ) {
    try {
      const response = await fetch(`${this.qaApiUrl}/qa/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: this.runId,
          alertType,
          severity,
          title,
          description,
          affectedService,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log(`🚨 Alert created: ${title} (${severity})`);
        return result.alertId;
      }
    } catch (error) {
      console.error("Failed to create alert:", error);
    }
  }

  /**
   * Complete QA run with final status
   */
  async completeQARun(status, passedPhases, failedPhases, durationMs) {
    if (!this.runId) return;

    try {
      const response = await fetch(`${this.qaApiUrl}/qa/runs/${this.runId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          passedPhases,
          failedPhases,
          durationMs,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log(
          `✅ QA Run ${this.runId} completed: ${status} (${passedPhases}/${
            passedPhases + failedPhases
          } phases passed)`
        );
      }
    } catch (error) {
      console.error("Failed to complete QA run:", error);
    }
  }

  /**
   * Run comprehensive website diagnostics
   */
  async runWebsiteDiagnostics(url, issue = "General diagnostics") {
    try {
      const response = await fetch(`${this.qaApiUrl}/qa/troubleshoot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, issue }),
      });

      const result = await response.json();
      if (result.success) {
        console.log(`🔍 Website Diagnostics for ${url}:`);
        console.log(`   Status: ${result.diagnostics.severity}`);

        Object.entries(result.diagnostics.checks).forEach(([check, data]) => {
          const status =
            data.status === "pass"
              ? "✅"
              : data.status === "warning"
              ? "⚠️"
              : "❌";
          console.log(`   ${status} ${check}: ${data.status}`);
        });

        if (result.recommendations.length > 0) {
          console.log("📋 Recommendations:");
          result.recommendations.forEach((rec) => {
            console.log(
              `   ${rec.priority === "high" ? "🔴" : "🟡"} ${rec.issue}: ${
                rec.action
              }`
            );
          });
        }

        return result.diagnostics;
      }
    } catch (error) {
      console.error("Failed to run diagnostics:", error);
      throw error;
    }
  }

  /**
   * Test frontend JavaScript execution
   */
  async testFrontendJavaScript() {
    console.log("🧪 Testing frontend JavaScript execution...");

    try {
      // Test if the main JavaScript bundle loads
      const jsResponse = await fetch(
        `${this.config.frontend.url}/assets/index-CcChzyz6.js`
      );
      const jsStatus = jsResponse.ok ? "pass" : "fail";

      await this.recordTestResult(
        null,
        "JavaScript Bundle Load",
        "frontend",
        jsStatus,
        {
          statusCode: jsResponse.status,
          bundleUrl: `${this.config.frontend.url}/assets/index-CcChzyz6.js`,
        }
      );

      console.log(
        `   ${jsStatus === "pass" ? "✅" : "❌"} JavaScript Bundle: ${jsStatus}`
      );

      // Test API connectivity from frontend perspective
      const apiResponse = await fetch(`${this.config.backend.url}/health`);
      const apiStatus = apiResponse.ok ? "pass" : "fail";

      await this.recordTestResult(
        null,
        "API Connectivity",
        "integration",
        apiStatus,
        {
          statusCode: apiResponse.status,
          responseTime: apiResponse.headers.get("response-time"),
        }
      );

      console.log(
        `   ${
          apiStatus === "pass" ? "✅" : "❌"
        } API Connectivity: ${apiStatus}`
      );

      return jsStatus === "pass" && apiStatus === "pass";
    } catch (error) {
      console.error("Frontend JavaScript test failed:", error);

      await this.createAlert(
        "error_rate",
        "high",
        "Frontend JavaScript Execution Issue",
        `JavaScript testing failed: ${error.message}`,
        this.config.frontend.url
      );

      return false;
    }
  }

  /**
   * Monitor website for issues
   */
  async monitorWebsite() {
    console.log("🔍 Monitoring website for issues...");

    const diagnostics = await this.runWebsiteDiagnostics(
      this.config.frontend.url,
      "Monitoring check for black screen issue"
    );

    // Record performance metrics
    if (diagnostics.checks.performance) {
      await this.recordPerformanceMetric(
        "response_time",
        diagnostics.checks.performance.responseTime,
        "ms",
        this.config.frontend.url,
        diagnostics.checks.performance.responseTime
      );
    }

    // Create alerts for issues
    if (diagnostics.severity !== "info") {
      await this.createAlert(
        "availability",
        diagnostics.severity,
        "Website Issue Detected",
        `Diagnostics detected ${diagnostics.severity} level issues`,
        this.config.frontend.url
      );
    }

    // Test JavaScript execution
    const jsWorking = await this.testFrontendJavaScript();

    if (!jsWorking) {
      await this.createAlert(
        "error_rate",
        "critical",
        "Frontend JavaScript Not Working",
        "JavaScript bundle or API connectivity issues detected",
        this.config.frontend.url
      );
    }

    return diagnostics;
  }

  /**
   * Get QA dashboard data
   */
  async getQADashboard() {
    try {
      const response = await fetch(`${this.qaApiUrl}/qa/dashboard`);
      const result = await response.json();

      if (result.success) {
        console.log("📊 QA Dashboard Data:");
        console.log(`   Recent Runs: ${result.dashboard.recentRuns.length}`);
        console.log(
          `   Active Alerts: ${result.dashboard.activeAlerts.length}`
        );
        console.log(
          `   Failing Tests: ${result.dashboard.failingTests.length}`
        );

        return result.dashboard;
      }
    } catch (error) {
      console.error("Failed to get QA dashboard:", error);
      throw error;
    }
  }
}
