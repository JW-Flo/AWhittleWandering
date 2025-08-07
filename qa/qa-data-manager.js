/**
 * QA Data Manager for Cloudflare D1 Storage
 * Manages QA pipeline data in the cloud
 */

import { createHash } from "crypto";

export class QADataManager {
  constructor(database) {
    this.db = database;
  }

  /**
   * Start a new QA pipeline run
   */
  async startQARun(options = {}) {
    const runId = this.generateRunId();
    const {
      triggerType = "manual",
      gitCommit = null,
      branch = "main",
      environment = "production",
      pipelineVersion = "1.0.0",
      totalIterations = 3,
      deploymentType = "minor", // NEW: Track deployment type
      deploymentId = null,
    } = options;

    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO qa_runs (
          run_id, pipeline_version, total_iterations, status, 
          trigger_type, git_commit, branch, environment,
          total_phases, passed_phases, failed_phases,
          deployment_type
        ) VALUES (?, ?, ?, 'running', ?, ?, ?, ?, 10, 0, 0, ?)
      `
        )
        .bind(
          runId,
          pipelineVersion,
          totalIterations,
          triggerType,
          gitCommit,
          branch,
          environment,
          deploymentType
        )
        .run();

      // Log the QA run start
      await this.logComponentActivity(
        runId,
        "qa-pipeline",
        "qa",
        "info",
        `QA Run ${runId} started`,
        {
          deploymentType,
          deploymentId,
          totalIterations,
          environment,
          triggerType,
        }
      );

      console.log(
        `📊 QA Run ${runId} started in D1 database (${deploymentType} deployment)`
      );
      return runId;
    } catch (error) {
      console.error("Failed to start QA run:", error);

      // Log the error
      await this.logComponentActivity(
        null,
        "qa-pipeline",
        "qa",
        "error",
        "Failed to start QA run",
        { error: error.message, stack: error.stack }
      );

      throw error;
    }
  }

  /**
   * Record a phase execution
   */
  async recordPhase(
    runId,
    iteration,
    phaseName,
    phaseOrder,
    status,
    details = {}
  ) {
    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO qa_phases (
          run_id, iteration, phase_name, phase_order, status, 
          start_time, end_time, duration_ms, retry_count, 
          error_message, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          runId,
          iteration,
          phaseName,
          phaseOrder,
          status,
          details.startTime || new Date().toISOString(),
          details.endTime || new Date().toISOString(),
          details.durationMs || 0,
          details.retryCount || 0,
          details.errorMessage || null,
          JSON.stringify(details)
        )
        .run();

      return result.meta.last_row_id;
    } catch (error) {
      console.error(`Failed to record phase ${phaseName}:`, error);
      throw error;
    }
  }

  /**
   * Record test results
   */
  async recordTestResult(
    runId,
    phaseId,
    testName,
    testType,
    status,
    details = {}
  ) {
    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO qa_test_results (
          run_id, phase_id, test_name, test_type, status,
          execution_time_ms, assertion_count, passed_assertions, 
          failed_assertions, error_message, stack_trace, 
          screenshot_url, test_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          runId,
          phaseId,
          testName,
          testType,
          status,
          details.executionTimeMs || 0,
          details.assertionCount || 0,
          details.passedAssertions || 0,
          details.failedAssertions || 0,
          details.errorMessage || null,
          details.stackTrace || null,
          details.screenshotUrl || null,
          JSON.stringify(details.testData || {})
        )
        .run();

      return result.meta.last_row_id;
    } catch (error) {
      console.error(`Failed to record test result ${testName}:`, error);
      throw error;
    }
  }

  /**
   * Record performance metrics
   */
  async recordPerformanceMetric(
    runId,
    metricName,
    metricValue,
    metricUnit,
    endpointUrl = null,
    responseTimeMs = null,
    statusCode = null
  ) {
    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO qa_performance_metrics (
          run_id, metric_name, metric_value, metric_unit,
          endpoint_url, response_time_ms, status_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          runId,
          metricName,
          metricValue,
          metricUnit,
          endpointUrl,
          responseTimeMs,
          statusCode
        )
        .run();

      return result.meta.last_row_id;
    } catch (error) {
      console.error(
        `Failed to record performance metric ${metricName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Record security scan results
   */
  async recordSecurityScan(
    runId,
    scanType,
    vulnerabilityLevel,
    description,
    affectedComponent,
    recommendation
  ) {
    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO qa_security_scans (
          run_id, scan_type, vulnerability_level, description,
          affected_component, recommendation, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'open')
      `
        )
        .bind(
          runId,
          scanType,
          vulnerabilityLevel,
          description,
          affectedComponent,
          recommendation
        )
        .run();

      return result.meta.last_row_id;
    } catch (error) {
      console.error(`Failed to record security scan:`, error);
      throw error;
    }
  }

  /**
   * Record deployment validation
   */
  async recordDeploymentValidation(
    runId,
    deploymentId,
    environment,
    deploymentStatus,
    healthCheckUrl,
    healthCheckStatus,
    responseTimeMs
  ) {
    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO qa_deployment_validations (
          run_id, deployment_id, environment, deployment_status,
          health_check_url, health_check_status, response_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          runId,
          deploymentId,
          environment,
          deploymentStatus,
          healthCheckUrl,
          healthCheckStatus,
          responseTimeMs
        )
        .run();

      return result.meta.last_row_id;
    } catch (error) {
      console.error(`Failed to record deployment validation:`, error);
      throw error;
    }
  }

  /**
   * Create monitoring alert
   */
  async createMonitoringAlert(
    runId,
    alertType,
    severity,
    title,
    description,
    affectedService,
    metricValue = null,
    thresholdValue = null
  ) {
    const alertId = this.generateAlertId();

    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO qa_monitoring_alerts (
          alert_id, run_id, alert_type, severity, title, description,
          affected_service, metric_value, threshold_value, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `
        )
        .bind(
          alertId,
          runId,
          alertType,
          severity,
          title,
          description,
          affectedService,
          metricValue,
          thresholdValue
        )
        .run();

      console.log(`🚨 Alert ${alertId} created: ${title}`);
      return alertId;
    } catch (error) {
      console.error(`Failed to create monitoring alert:`, error);
      throw error;
    }
  }

  /**
   * Update QA run status
   */
  async updateQARunStatus(
    runId,
    status,
    passedPhases,
    failedPhases,
    durationMs
  ) {
    try {
      const result = await this.db
        .prepare(
          `
        UPDATE qa_runs 
        SET status = ?, passed_phases = ?, failed_phases = ?, 
            duration_ms = ?, updated_at = CURRENT_TIMESTAMP
        WHERE run_id = ?
      `
        )
        .bind(status, passedPhases, failedPhases, durationMs, runId)
        .run();

      console.log(
        `📊 QA Run ${runId} updated: ${status} (${passedPhases}/${
          passedPhases + failedPhases
        } phases passed)`
      );
      return result.success;
    } catch (error) {
      console.error(`Failed to update QA run status:`, error);
      throw error;
    }
  }

  /**
   * Get QA run history
   */
  async getQARunHistory(limit = 50, environment = null) {
    try {
      let query = `
        SELECT * FROM qa_runs 
        ${environment ? "WHERE environment = ?" : ""}
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      const params = environment ? [environment, limit] : [limit];
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all();

      return result.results || [];
    } catch (error) {
      console.error("Failed to get QA run history:", error);
      throw error;
    }
  }

  /**
   * Get detailed QA run report
   */
  async getQARunReport(runId) {
    try {
      // Get main run info
      const runResult = await this.db
        .prepare(
          `
        SELECT * FROM qa_runs WHERE run_id = ?
      `
        )
        .bind(runId)
        .first();

      if (!runResult) {
        throw new Error(`QA run ${runId} not found`);
      }

      // Get phases
      const phasesResult = await this.db
        .prepare(
          `
        SELECT * FROM qa_phases WHERE run_id = ? ORDER BY iteration, phase_order
      `
        )
        .bind(runId)
        .all();

      // Get test results
      const testsResult = await this.db
        .prepare(
          `
        SELECT * FROM qa_test_results WHERE run_id = ? ORDER BY created_at
      `
        )
        .bind(runId)
        .all();

      // Get performance metrics
      const metricsResult = await this.db
        .prepare(
          `
        SELECT * FROM qa_performance_metrics WHERE run_id = ? ORDER BY timestamp
      `
        )
        .bind(runId)
        .all();

      // Get security scans
      const securityResult = await this.db
        .prepare(
          `
        SELECT * FROM qa_security_scans WHERE run_id = ? ORDER BY created_at
      `
        )
        .bind(runId)
        .all();

      // Get deployment validations
      const deploymentResult = await this.db
        .prepare(
          `
        SELECT * FROM qa_deployment_validations WHERE run_id = ? ORDER BY validation_timestamp
      `
        )
        .bind(runId)
        .all();

      return {
        run: runResult,
        phases: phasesResult.results || [],
        tests: testsResult.results || [],
        metrics: metricsResult.results || [],
        security: securityResult.results || [],
        deployments: deploymentResult.results || [],
      };
    } catch (error) {
      console.error(`Failed to get QA run report for ${runId}:`, error);
      throw error;
    }
  }

  /**
   * Get QA dashboard data
   */
  async getQADashboardData() {
    try {
      // Recent runs
      const recentRuns = await this.getQARunHistory(10);

      // Success rate over last 30 days
      const successRateResult = await this.db
        .prepare(
          `
        SELECT 
          COUNT(*) as total_runs,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_runs,
          AVG(passed_phases * 100.0 / total_phases) as avg_pass_rate
        FROM qa_runs 
        WHERE timestamp >= datetime('now', '-30 days')
      `
        )
        .first();

      // Active alerts
      const activeAlertsResult = await this.db
        .prepare(
          `
        SELECT * FROM qa_monitoring_alerts 
        WHERE status = 'active' 
        ORDER BY created_at DESC 
        LIMIT 20
      `
        )
        .all();

      // Top failing tests
      const failingTestsResult = await this.db
        .prepare(
          `
        SELECT 
          test_name, 
          test_type,
          COUNT(*) as failure_count,
          MAX(created_at) as last_failure
        FROM qa_test_results 
        WHERE status = 'failed' 
          AND created_at >= datetime('now', '-7 days')
        GROUP BY test_name, test_type
        ORDER BY failure_count DESC
        LIMIT 10
      `
        )
        .all();

      return {
        recentRuns,
        successRate: successRateResult,
        activeAlerts: activeAlertsResult.results || [],
        failingTests: failingTestsResult.results || [],
      };
    } catch (error) {
      console.error("Failed to get QA dashboard data:", error);
      throw error;
    }
  }

  /**
   * Generate unique run ID
   */
  generateRunId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `qa-${timestamp}-${random}`;
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `alert-${timestamp}-${random}`;
  }

  /**
   * Get configuration value
   */
  async getConfig(key, defaultValue = null) {
    try {
      const result = await this.db
        .prepare(
          `
        SELECT config_value, config_type FROM qa_config WHERE config_key = ?
      `
        )
        .bind(key)
        .first();

      if (!result) return defaultValue;

      // Type conversion
      switch (result.config_type) {
        case "number":
          return parseFloat(result.config_value);
        case "boolean":
          return result.config_value === "true";
        case "json":
          return JSON.parse(result.config_value);
        default:
          return result.config_value;
      }
    } catch (error) {
      console.error(`Failed to get config ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Update configuration value
   */
  async updateConfig(key, value, type = "string") {
    try {
      const stringValue =
        type === "json" ? JSON.stringify(value) : String(value);

      const result = await this.db
        .prepare(
          `
        INSERT OR REPLACE INTO qa_config (config_key, config_value, config_type, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `
        )
        .bind(key, stringValue, type)
        .run();

      return result.success;
    } catch (error) {
      console.error(`Failed to update config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Log component activity with comprehensive details
   */
  async logComponentActivity(
    runId,
    componentName,
    serviceType,
    logLevel,
    message,
    details = {}
  ) {
    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO component_logs (
          run_id, component_name, service_type, log_level, message, details,
          error_stack, request_id, endpoint, method, status_code, response_time_ms,
          memory_usage_mb, cpu_usage_percent, correlation_id, source_file, source_function,
          environment, version, git_commit, deployment_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          runId,
          componentName,
          serviceType,
          logLevel,
          message,
          JSON.stringify(details),
          details.stack || null,
          details.requestId || null,
          details.endpoint || null,
          details.method || null,
          details.statusCode || null,
          details.responseTime || null,
          details.memoryUsage || null,
          details.cpuUsage || null,
          details.correlationId || null,
          details.sourceFile || null,
          details.sourceFunction || null,
          details.environment || "production",
          details.version || null,
          details.gitCommit || null,
          details.deploymentId || null
        )
        .run();

      return result.meta.last_row_id;
    } catch (error) {
      console.error(`Failed to log component activity:`, error);
      // Don't throw to avoid breaking the main flow
    }
  }

  /**
   * Track deployment events
   */
  async trackDeploymentEvent(
    deploymentId,
    deploymentType,
    component,
    version,
    gitCommit,
    options = {}
  ) {
    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO deployment_events (
          deployment_id, deployment_type, component, version, git_commit, git_branch,
          triggered_by, trigger_reason, deployment_status, pre_deployment_checks,
          environment, deployment_notes, health_check_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          deploymentId,
          deploymentType,
          component,
          version,
          gitCommit,
          options.branch || "main",
          options.triggeredBy || "automated",
          options.triggerReason || "QA validation",
          options.status || "initiated",
          JSON.stringify(options.preDeploymentChecks || {}),
          options.environment || "production",
          options.notes || null,
          options.healthCheckUrl || null
        )
        .run();

      console.log(
        `🚀 Deployment ${deploymentId} tracked: ${deploymentType} ${component} v${version}`
      );
      return result.meta.last_row_id;
    } catch (error) {
      console.error("Failed to track deployment event:", error);
      throw error;
    }
  }

  /**
   * Update deployment event status
   */
  async updateDeploymentStatus(deploymentId, status, options = {}) {
    try {
      const result = await this.db
        .prepare(
          `
        UPDATE deployment_events 
        SET deployment_status = ?, end_time = CURRENT_TIMESTAMP, 
            duration_ms = ?, post_deployment_validation = ?,
            health_check_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE deployment_id = ?
      `
        )
        .bind(
          status,
          options.durationMs || null,
          JSON.stringify(options.postDeploymentValidation || {}),
          options.healthCheckStatus || null,
          deploymentId
        )
        .run();

      return result.success;
    } catch (error) {
      console.error(`Failed to update deployment status:`, error);
      throw error;
    }
  }

  /**
   * Log API health check results
   */
  async logApiHealth(runId, endpointName, endpointUrl, options = {}) {
    try {
      const result = await this.db
        .prepare(
          `
        INSERT INTO api_health_logs (
          run_id, endpoint_name, endpoint_url, method, status_code, response_time_ms,
          payload_size_bytes, error_message, tessie_api_working, tesla_data_available,
          database_responsive, cache_working, external_dependencies_up, environment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          runId,
          endpointName,
          endpointUrl,
          options.method || "GET",
          options.statusCode || null,
          options.responseTime || null,
          options.payloadSize || null,
          options.errorMessage || null,
          options.tessieApiWorking !== undefined
            ? options.tessieApiWorking
            : null,
          options.teslaDataAvailable !== undefined
            ? options.teslaDataAvailable
            : null,
          options.databaseResponsive !== undefined
            ? options.databaseResponsive
            : null,
          options.cacheWorking !== undefined ? options.cacheWorking : null,
          options.externalDependenciesUp !== undefined
            ? options.externalDependenciesUp
            : null,
          options.environment || "production"
        )
        .run();

      return result.meta.last_row_id;
    } catch (error) {
      console.error("Failed to log API health:", error);
    }
  }

  /**
   * Get deployment history
   */
  async getDeploymentHistory(limit = 20, deploymentType = null) {
    try {
      let query = `
        SELECT * FROM deployment_events 
        ${deploymentType ? "WHERE deployment_type = ?" : ""}
        ORDER BY start_time DESC 
        LIMIT ?
      `;

      const params = deploymentType ? [deploymentType, limit] : [limit];
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all();

      return result.results || [];
    } catch (error) {
      console.error("Failed to get deployment history:", error);
      throw error;
    }
  }

  /**
   * Get component logs with filtering
   */
  async getComponentLogs(options = {}) {
    try {
      const {
        runId = null,
        componentName = null,
        logLevel = null,
        startTime = null,
        endTime = null,
        limit = 100,
      } = options;

      let query = "SELECT * FROM component_logs WHERE 1=1";
      const params = [];

      if (runId) {
        query += " AND run_id = ?";
        params.push(runId);
      }

      if (componentName) {
        query += " AND component_name = ?";
        params.push(componentName);
      }

      if (logLevel) {
        query += " AND log_level = ?";
        params.push(logLevel);
      }

      if (startTime) {
        query += " AND timestamp >= ?";
        params.push(startTime);
      }

      if (endTime) {
        query += " AND timestamp <= ?";
        params.push(endTime);
      }

      query += " ORDER BY timestamp DESC LIMIT ?";
      params.push(limit);

      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all();
      return result.results || [];
    } catch (error) {
      console.error("Failed to get component logs:", error);
      throw error;
    }
  }

  /**
   * Analyze Tessie API reliability
   */
  async analyzeTessieApiReliability(timeRangeHours = 24) {
    try {
      const result = await this.db
        .prepare(
          `
        SELECT 
          COUNT(*) as total_calls,
          SUM(CASE WHEN tessie_api_working = 1 THEN 1 ELSE 0 END) as successful_calls,
          AVG(response_time_ms) as avg_response_time,
          MAX(response_time_ms) as max_response_time,
          MIN(response_time_ms) as min_response_time
        FROM api_health_logs 
        WHERE tessie_api_working IS NOT NULL 
          AND timestamp >= datetime('now', '-${timeRangeHours} hours')
      `
        )
        .first();

      const reliability =
        result.total_calls > 0
          ? (result.successful_calls / result.total_calls) * 100
          : 0;

      return {
        reliabilityPercentage: reliability,
        totalCalls: result.total_calls,
        successfulCalls: result.successful_calls,
        averageResponseTime: result.avg_response_time,
        maxResponseTime: result.max_response_time,
        minResponseTime: result.min_response_time,
        timeRange: `${timeRangeHours} hours`,
      };
    } catch (error) {
      console.error("Failed to analyze Tessie API reliability:", error);
      throw error;
    }
  }

  // API Configuration Management Integration
  async validateApiConfigurations() {
    try {
      const db = await this.getDb();

      // Check if API management system is available
      const { spawn } = await import("child_process");

      return new Promise((resolve) => {
        const auditProcess = spawn(
          "node",
          ["../api-management-system.js", "audit"],
          {
            cwd: __dirname,
            stdio: "pipe",
          }
        );

        let output = "";
        let errorOutput = "";

        auditProcess.stdout.on("data", (data) => {
          output += data.toString();
        });

        auditProcess.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        auditProcess.on("close", async (code) => {
          const isSuccess = code === 0;
          const criticalIssues = output.match(/Critical Issues: (\d+)/);
          const issueCount = criticalIssues ? parseInt(criticalIssues[1]) : 0;

          // Log API configuration status
          await this.logComponentActivity(
            "api_management",
            isSuccess ? "info" : "error",
            isSuccess
              ? "API configurations verified"
              : `${issueCount} critical API configuration issues`,
            JSON.stringify({
              audit_output: output,
              error_output: errorOutput,
              exit_code: code,
              critical_issues: issueCount,
            })
          );

          resolve({
            status: isSuccess ? "configured" : "missing_configs",
            critical_issues: issueCount,
            audit_output: output,
            is_blocking: issueCount > 0,
          });
        });
      });
    } catch (error) {
      console.error("Failed to validate API configurations:", error);
      return {
        status: "error",
        message: error.message,
        is_blocking: true,
      };
    }
  }
}
