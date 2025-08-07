/**
 * QA Report Generator
 * Generates comprehensive reports from QA pipeline results
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QAReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, "reports");
    this.logsDir = path.join(__dirname, "logs");
    this.alertsDir = path.join(__dirname, "alerts");
    this.screenshotsDir = path.join(__dirname, "screenshots");
  }

  async generateComprehensiveReport() {
    console.log("📋 Generating comprehensive QA report...");

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        reportType: "comprehensive",
        version: "1.0.0",
      },
      summary: await this.generateSummary(),
      recentRuns: await this.getRecentRuns(),
      trends: await this.analyzeTrends(),
      performance: await this.analyzePerformance(),
      failures: await this.analyzeFailures(),
      recommendations: await this.generateRecommendations(),
      alerts: await this.getRecentAlerts(),
      screenshots: await this.getRecentScreenshots(),
    };

    const reportPath = path.join(
      this.reportsDir,
      `comprehensive-qa-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReportPath = await this.generateHTMLReport(report);

    console.log(`✅ Reports generated:`);
    console.log(`  📄 JSON: ${reportPath}`);
    console.log(`  🌐 HTML: ${htmlReportPath}`);

    return { json: reportPath, html: htmlReportPath };
  }

  async generateSummary() {
    const recentReports = await this.getRecentReports(7); // Last 7 days

    if (recentReports.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        averageDuration: 0,
        status: "no-data",
      };
    }

    const successful = recentReports.filter((r) => r.summary?.failed === 0);
    const totalDuration = recentReports.reduce((sum, r) => {
      const phases = r.phases || {};
      return (
        sum +
        Object.values(phases).reduce((pSum, p) => pSum + (p.duration || 0), 0)
      );
    }, 0);

    return {
      totalRuns: recentReports.length,
      successful: successful.length,
      failed: recentReports.length - successful.length,
      successRate: Math.round((successful.length / recentReports.length) * 100),
      averageDuration: Math.round(totalDuration / recentReports.length),
      status:
        successful.length > recentReports.length * 0.8
          ? "healthy"
          : "concerning",
    };
  }

  async getRecentRuns() {
    const reports = await this.getRecentReports(10);

    return reports.map((report) => ({
      timestamp: report.timestamp,
      iteration: report.iteration,
      duration: this.calculateTotalDuration(report),
      status: report.summary?.failed === 0 ? "passed" : "failed",
      phases: Object.keys(report.phases || {}),
      failedPhases: Object.entries(report.phases || {})
        .filter(([_, phase]) => phase.status === "failed")
        .map(([name, _]) => name),
    }));
  }

  async analyzeTrends() {
    const reports = await this.getRecentReports(30); // Last 30 days

    if (reports.length < 2) {
      return { insufficient_data: true };
    }

    // Group by day
    const dailyStats = {};

    reports.forEach((report) => {
      const date = new Date(report.timestamp).toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = { runs: 0, failures: 0, totalDuration: 0 };
      }

      dailyStats[date].runs++;
      if (report.summary?.failed > 0) {
        dailyStats[date].failures++;
      }
      dailyStats[date].totalDuration += this.calculateTotalDuration(report);
    });

    // Calculate trends
    const dates = Object.keys(dailyStats).sort();
    const recentDays = dates.slice(-7);
    const previousDays = dates.slice(-14, -7);

    const recentFailureRate = this.calculateAverageFailureRate(
      recentDays,
      dailyStats
    );
    const previousFailureRate = this.calculateAverageFailureRate(
      previousDays,
      dailyStats
    );

    return {
      dailyStats,
      failureRateTrend: {
        recent: recentFailureRate,
        previous: previousFailureRate,
        direction:
          recentFailureRate > previousFailureRate
            ? "increasing"
            : recentFailureRate < previousFailureRate
            ? "decreasing"
            : "stable",
      },
      performanceTrend: this.analyzePerformanceTrend(dailyStats, dates),
    };
  }

  async analyzePerformance() {
    const reports = await this.getRecentReports(10);

    const phasePerformance = {};

    reports.forEach((report) => {
      Object.entries(report.phases || {}).forEach(([phaseName, phase]) => {
        if (!phasePerformance[phaseName]) {
          phasePerformance[phaseName] = [];
        }
        phasePerformance[phaseName].push(phase.duration || 0);
      });
    });

    const performanceMetrics = {};

    Object.entries(phasePerformance).forEach(([phase, durations]) => {
      performanceMetrics[phase] = {
        average: Math.round(
          durations.reduce((a, b) => a + b, 0) / durations.length
        ),
        min: Math.min(...durations),
        max: Math.max(...durations),
        samples: durations.length,
      };
    });

    return performanceMetrics;
  }

  async analyzeFailures() {
    const reports = await this.getRecentReports(20);

    const failureAnalysis = {
      commonFailures: {},
      phaseFailures: {},
      errorPatterns: {},
      recentFailures: [],
    };

    reports.forEach((report) => {
      if (report.summary?.failed > 0) {
        // Analyze phase failures
        Object.entries(report.phases || {}).forEach(([phaseName, phase]) => {
          if (phase.status === "failed") {
            failureAnalysis.phaseFailures[phaseName] =
              (failureAnalysis.phaseFailures[phaseName] || 0) + 1;

            // Collect error patterns
            if (phase.error) {
              const errorKey = this.extractErrorPattern(phase.error);
              failureAnalysis.errorPatterns[errorKey] =
                (failureAnalysis.errorPatterns[errorKey] || 0) + 1;
            }
          }
        });

        // Add to recent failures
        failureAnalysis.recentFailures.push({
          timestamp: report.timestamp,
          iteration: report.iteration,
          failedPhases: Object.entries(report.phases || {})
            .filter(([_, phase]) => phase.status === "failed")
            .map(([name, phase]) => ({ name, error: phase.error })),
        });
      }
    });

    return failureAnalysis;
  }

  async generateRecommendations() {
    const summary = await this.generateSummary();
    const failures = await this.analyzeFailures();
    const trends = await this.analyzeTrends();

    const recommendations = [];

    // Success rate recommendations
    if (summary.successRate < 80) {
      recommendations.push({
        priority: "high",
        category: "reliability",
        title: "Low Success Rate Detected",
        description: `Current success rate is ${summary.successRate}%. Investigate common failure patterns.`,
        actions: [
          "Review failed test logs",
          "Check infrastructure stability",
          "Consider increasing retry mechanisms",
        ],
      });
    }

    // Performance recommendations
    if (summary.averageDuration > 300000) {
      // 5 minutes
      recommendations.push({
        priority: "medium",
        category: "performance",
        title: "Long Test Duration",
        description: `Average test duration is ${Math.round(
          summary.averageDuration / 1000
        )}s. Consider optimization.`,
        actions: [
          "Parallelize test execution",
          "Optimize test setup/teardown",
          "Review test complexity",
        ],
      });
    }

    // Failure pattern recommendations
    const topFailure = Object.entries(failures.phaseFailures).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (topFailure && topFailure[1] > 3) {
      recommendations.push({
        priority: "high",
        category: "stability",
        title: `Frequent ${topFailure[0]} Failures`,
        description: `${topFailure[0]} phase has failed ${topFailure[1]} times recently.`,
        actions: [
          `Review ${topFailure[0]} test implementation`,
          "Check external dependencies",
          "Consider test environment issues",
        ],
      });
    }

    // Trend recommendations
    if (trends.failureRateTrend?.direction === "increasing") {
      recommendations.push({
        priority: "high",
        category: "trend",
        title: "Increasing Failure Rate",
        description: "Failure rate is trending upward over the past week.",
        actions: [
          "Investigate recent code changes",
          "Check infrastructure changes",
          "Review deployment process",
        ],
      });
    }

    return recommendations;
  }

  async getRecentAlerts() {
    try {
      const alertFiles = fs
        .readdirSync(this.alertsDir)
        .filter((file) => file.endsWith(".json"))
        .sort()
        .slice(-10); // Last 10 alerts

      return alertFiles.map((file) => {
        const content = fs.readFileSync(
          path.join(this.alertsDir, file),
          "utf8"
        );
        return JSON.parse(content);
      });
    } catch (error) {
      return [];
    }
  }

  async getRecentScreenshots() {
    try {
      const screenshotFiles = fs
        .readdirSync(this.screenshotsDir)
        .filter((file) => file.endsWith(".png"))
        .sort()
        .slice(-5); // Last 5 screenshots

      return screenshotFiles.map((file) => ({
        filename: file,
        path: path.join(this.screenshotsDir, file),
        timestamp: fs.statSync(path.join(this.screenshotsDir, file)).mtime,
      }));
    } catch (error) {
      return [];
    }
  }

  async getRecentReports(days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const reportFiles = fs
        .readdirSync(this.reportsDir)
        .filter((file) => file.includes("qa-report-") && file.endsWith(".json"))
        .map((file) => {
          const filePath = path.join(this.reportsDir, file);
          const stats = fs.statSync(filePath);
          return { file, path: filePath, mtime: stats.mtime };
        })
        .filter(({ mtime }) => mtime > cutoffDate)
        .sort((a, b) => b.mtime - a.mtime);

      return reportFiles
        .map(({ path }) => {
          try {
            const content = fs.readFileSync(path, "utf8");
            return JSON.parse(content);
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  calculateTotalDuration(report) {
    const phases = report.phases || {};
    return Object.values(phases).reduce(
      (sum, phase) => sum + (phase.duration || 0),
      0
    );
  }

  calculateAverageFailureRate(dates, dailyStats) {
    if (dates.length === 0) return 0;

    const totalRuns = dates.reduce(
      (sum, date) => sum + (dailyStats[date]?.runs || 0),
      0
    );
    const totalFailures = dates.reduce(
      (sum, date) => sum + (dailyStats[date]?.failures || 0),
      0
    );

    return totalRuns > 0 ? (totalFailures / totalRuns) * 100 : 0;
  }

  analyzePerformanceTrend(dailyStats, dates) {
    if (dates.length < 2) return { trend: "insufficient_data" };

    const recentDays = dates.slice(-7);
    const previousDays = dates.slice(-14, -7);

    const recentAvg = this.calculateAverageDuration(recentDays, dailyStats);
    const previousAvg = this.calculateAverageDuration(previousDays, dailyStats);

    return {
      recent: recentAvg,
      previous: previousAvg,
      trend:
        recentAvg > previousAvg * 1.1
          ? "degrading"
          : recentAvg < previousAvg * 0.9
          ? "improving"
          : "stable",
    };
  }

  calculateAverageDuration(dates, dailyStats) {
    if (dates.length === 0) return 0;

    const totalDuration = dates.reduce(
      (sum, date) => sum + (dailyStats[date]?.totalDuration || 0),
      0
    );
    const totalRuns = dates.reduce(
      (sum, date) => sum + (dailyStats[date]?.runs || 0),
      0
    );

    return totalRuns > 0 ? totalDuration / totalRuns : 0;
  }

  extractErrorPattern(error) {
    // Extract common error patterns
    if (error.includes("timeout")) return "timeout";
    if (error.includes("connection")) return "connection";
    if (error.includes("404")) return "not_found";
    if (error.includes("500")) return "server_error";
    if (error.includes("network")) return "network";
    if (error.includes("authentication")) return "auth";

    return "other";
  }

  async generateHTMLReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QA Report - ${new Date(
      report.metadata.generatedAt
    ).toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #007acc; margin-bottom: 30px; padding-bottom: 20px; }
        .header h1 { color: #007acc; margin: 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; }
        .recommendation { margin-bottom: 15px; padding: 15px; border-left: 4px solid #007acc; background: #f8f9fa; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #28a745; }
        .failures { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 QA Pipeline Report</h1>
            <p class="timestamp">Generated: ${new Date(
              report.metadata.generatedAt
            ).toLocaleString()}</p>
        </div>

        <div class="section">
            <h2>📊 Summary</h2>
            <div class="summary">
                <div class="metric">
                    <div class="metric-value ${
                      report.summary.successRate >= 80 ? "success" : "danger"
                    }">${report.summary.successRate}%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${report.summary.totalRuns}</div>
                    <div class="metric-label">Total Runs</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.round(
                      report.summary.averageDuration / 1000
                    )}s</div>
                    <div class="metric-label">Avg Duration</div>
                </div>
                <div class="metric">
                    <div class="metric-value ${
                      report.summary.status === "healthy"
                        ? "success"
                        : "warning"
                    }">${report.summary.status}</div>
                    <div class="metric-label">Overall Status</div>
                </div>
            </div>
        </div>

        ${
          report.recommendations.length > 0
            ? `
        <div class="section">
            <h2>💡 Recommendations</h2>
            <div class="recommendations">
                ${report.recommendations
                  .map(
                    (rec) => `
                    <div class="recommendation priority-${rec.priority}">
                        <h3>${rec.title}</h3>
                        <p>${rec.description}</p>
                        <ul>
                            ${rec.actions
                              .map((action) => `<li>${action}</li>`)
                              .join("")}
                        </ul>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
        `
            : ""
        }

        <div class="section">
            <h2>📈 Recent Runs</h2>
            <table>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Phases</th>
                        <th>Failed Phases</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.recentRuns
                      .map(
                        (run) => `
                        <tr>
                            <td>${new Date(run.timestamp).toLocaleString()}</td>
                            <td class="${
                              run.status === "passed" ? "success" : "danger"
                            }">${run.status}</td>
                            <td>${Math.round(run.duration / 1000)}s</td>
                            <td>${run.phases.length}</td>
                            <td>${run.failedPhases.join(", ") || "None"}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>

        ${
          Object.keys(report.failures.phaseFailures).length > 0
            ? `
        <div class="section">
            <h2>❌ Failure Analysis</h2>
            <div class="failures">
                <h3>Most Common Phase Failures:</h3>
                <ul>
                    ${Object.entries(report.failures.phaseFailures)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(
                        ([phase, count]) =>
                          `<li>${phase}: ${count} failures</li>`
                      )
                      .join("")}
                </ul>
            </div>
        </div>
        `
            : ""
        }

        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Phase</th>
                        <th>Average (ms)</th>
                        <th>Min (ms)</th>
                        <th>Max (ms)</th>
                        <th>Samples</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(report.performance)
                      .map(
                        ([phase, metrics]) => `
                        <tr>
                            <td>${phase}</td>
                            <td>${metrics.average}</td>
                            <td>${metrics.min}</td>
                            <td>${metrics.max}</td>
                            <td>${metrics.samples}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.reportsDir, `qa-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlTemplate);

    return htmlPath;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new QAReportGenerator();

  generator
    .generateComprehensiveReport()
    .then(({ json, html }) => {
      console.log("\n✅ Report generation completed successfully!");
      console.log(`📊 Open HTML report: file://${html}`);
    })
    .catch((error) => {
      console.error("❌ Report generation failed:", error.message);
      process.exit(1);
    });
}

export default QAReportGenerator;
