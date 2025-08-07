/**
 * Cloudflare Worker for QA Pipeline with D1 Storage
 * This worker handles QA data storage and provides API endpoints for QA monitoring
 */

import { QADataManager } from "./qa-data-manager.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const qaDataManager = new QADataManager(env.QA_DB);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            status: "ok",
            timestamp: Date.now(),
            service: "QA Pipeline API",
            database: "Connected",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Start a new QA run
      if (url.pathname === "/qa/runs" && request.method === "POST") {
        const body = await request.json();
        const runId = await qaDataManager.startQARun(body);

        return new Response(
          JSON.stringify({
            success: true,
            runId,
            message: "QA run started successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get QA run history
      if (url.pathname === "/qa/runs" && request.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit")) || 50;
        const environment = url.searchParams.get("environment");

        const history = await qaDataManager.getQARunHistory(limit, environment);

        return new Response(
          JSON.stringify({
            success: true,
            runs: history,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get specific QA run report
      if (
        url.pathname.match(/^\/qa\/runs\/([^\/]+)$/) &&
        request.method === "GET"
      ) {
        const runId = url.pathname.split("/")[3];
        const report = await qaDataManager.getQARunReport(runId);

        return new Response(
          JSON.stringify({
            success: true,
            report,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update QA run status
      if (
        url.pathname.match(/^\/qa\/runs\/([^\/]+)$/) &&
        request.method === "PUT"
      ) {
        const runId = url.pathname.split("/")[3];
        const body = await request.json();

        const success = await qaDataManager.updateQARunStatus(
          runId,
          body.status,
          body.passedPhases,
          body.failedPhases,
          body.durationMs
        );

        return new Response(
          JSON.stringify({
            success,
            message: success
              ? "QA run updated successfully"
              : "Failed to update QA run",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Record phase execution
      if (
        url.pathname.match(/^\/qa\/runs\/([^\/]+)\/phases$/) &&
        request.method === "POST"
      ) {
        const runId = url.pathname.split("/")[3];
        const body = await request.json();

        const phaseId = await qaDataManager.recordPhase(
          runId,
          body.iteration,
          body.phaseName,
          body.phaseOrder,
          body.status,
          body.details
        );

        return new Response(
          JSON.stringify({
            success: true,
            phaseId,
            message: "Phase recorded successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Record test result
      if (
        url.pathname.match(/^\/qa\/runs\/([^\/]+)\/tests$/) &&
        request.method === "POST"
      ) {
        const runId = url.pathname.split("/")[3];
        const body = await request.json();

        const testId = await qaDataManager.recordTestResult(
          runId,
          body.phaseId,
          body.testName,
          body.testType,
          body.status,
          body.details
        );

        return new Response(
          JSON.stringify({
            success: true,
            testId,
            message: "Test result recorded successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Record performance metric
      if (
        url.pathname.match(/^\/qa\/runs\/([^\/]+)\/metrics$/) &&
        request.method === "POST"
      ) {
        const runId = url.pathname.split("/")[3];
        const body = await request.json();

        const metricId = await qaDataManager.recordPerformanceMetric(
          runId,
          body.metricName,
          body.metricValue,
          body.metricUnit,
          body.endpointUrl,
          body.responseTimeMs,
          body.statusCode
        );

        return new Response(
          JSON.stringify({
            success: true,
            metricId,
            message: "Performance metric recorded successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create monitoring alert
      if (url.pathname === "/qa/alerts" && request.method === "POST") {
        const body = await request.json();

        const alertId = await qaDataManager.createMonitoringAlert(
          body.runId,
          body.alertType,
          body.severity,
          body.title,
          body.description,
          body.affectedService,
          body.metricValue,
          body.thresholdValue
        );

        return new Response(
          JSON.stringify({
            success: true,
            alertId,
            message: "Alert created successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get QA dashboard data
      if (url.pathname === "/qa/dashboard" && request.method === "GET") {
        const dashboardData = await qaDataManager.getQADashboardData();

        return new Response(
          JSON.stringify({
            success: true,
            dashboard: dashboardData,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get configuration
      if (
        url.pathname.match(/^\/qa\/config\/([^\/]+)$/) &&
        request.method === "GET"
      ) {
        const configKey = url.pathname.split("/")[3];
        const configValue = await qaDataManager.getConfig(configKey);

        return new Response(
          JSON.stringify({
            success: true,
            key: configKey,
            value: configValue,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update configuration
      if (
        url.pathname.match(/^\/qa\/config\/([^\/]+)$/) &&
        request.method === "PUT"
      ) {
        const configKey = url.pathname.split("/")[3];
        const body = await request.json();

        const success = await qaDataManager.updateConfig(
          configKey,
          body.value,
          body.type || "string"
        );

        return new Response(
          JSON.stringify({
            success,
            message: success
              ? "Configuration updated successfully"
              : "Failed to update configuration",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Website troubleshooting endpoint
      if (url.pathname === "/qa/troubleshoot" && request.method === "POST") {
        const body = await request.json();
        const { url: siteUrl, issue } = body;

        // Run basic diagnostics
        const diagnostics = await runWebsiteDiagnostics(siteUrl);

        // Create alert if critical issue detected
        if (diagnostics.severity === "critical") {
          await qaDataManager.createMonitoringAlert(
            null, // no specific run ID
            "availability",
            "critical",
            `Website Issue: ${issue}`,
            `Diagnostics: ${JSON.stringify(diagnostics)}`,
            siteUrl
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            diagnostics,
            recommendations: generateRecommendations(diagnostics),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 404 for unknown routes
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "The requested endpoint does not exist",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("QA API Error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message,
          stack: error.stack,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};

/**
 * Run basic website diagnostics
 */
async function runWebsiteDiagnostics(url) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    url,
    checks: {},
    severity: "info",
  };

  try {
    // Check if the site responds
    const startTime = Date.now();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "QA-Pipeline-Diagnostics/1.0",
      },
    });
    const responseTime = Date.now() - startTime;

    diagnostics.checks.availability = {
      status: response.ok ? "pass" : "fail",
      statusCode: response.status,
      responseTime,
    };

    if (!response.ok) {
      diagnostics.severity = response.status >= 500 ? "critical" : "warning";
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    diagnostics.checks.contentType = {
      status:
        contentType && contentType.includes("text/html") ? "pass" : "warning",
      value: contentType,
    };

    // Check response time
    diagnostics.checks.performance = {
      status: responseTime < 5000 ? "pass" : "warning",
      responseTime,
      threshold: 5000,
    };

    if (responseTime > 10000) {
      diagnostics.severity = "warning";
    }

    // Try to get page content for basic checks
    if (response.ok) {
      const html = await response.text();

      // Check for basic HTML structure
      diagnostics.checks.htmlStructure = {
        status:
          html.includes("<html") && html.includes("</html>") ? "pass" : "fail",
        hasTitle: html.includes("<title"),
        hasBody: html.includes("<body"),
      };

      // Check for JavaScript errors (basic)
      diagnostics.checks.javascript = {
        status: html.includes("<script") ? "pass" : "warning",
        hasScripts: html.includes("<script"),
      };
    }
  } catch (error) {
    diagnostics.checks.availability = {
      status: "fail",
      error: error.message,
    };
    diagnostics.severity = "critical";
  }

  return diagnostics;
}

/**
 * Generate recommendations based on diagnostics
 */
function generateRecommendations(diagnostics) {
  const recommendations = [];

  if (diagnostics.checks.availability?.status === "fail") {
    recommendations.push({
      priority: "high",
      issue: "Site unavailable",
      action: "Check server status and deployment. Verify DNS configuration.",
    });
  }

  if (diagnostics.checks.performance?.responseTime > 5000) {
    recommendations.push({
      priority: "medium",
      issue: "Slow response time",
      action:
        "Optimize server performance, check CDN configuration, review asset sizes.",
    });
  }

  if (diagnostics.checks.htmlStructure?.status === "fail") {
    recommendations.push({
      priority: "high",
      issue: "Invalid HTML structure",
      action: "Check build process and ensure proper HTML generation.",
    });
  }

  if (diagnostics.checks.javascript?.status === "warning") {
    recommendations.push({
      priority: "medium",
      issue: "Missing JavaScript",
      action: "Verify JavaScript bundle is loading correctly.",
    });
  }

  return recommendations;
}
