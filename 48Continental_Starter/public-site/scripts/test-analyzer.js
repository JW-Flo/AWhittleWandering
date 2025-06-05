#!/usr/bin/env node
/* eslint-env node */
"use strict";

const fs = require("fs");
const path = require("path");
const { fileURLToPath } = require("url");

// Directory to store historical test results
const TEST_RESULTS_DIR = path.join(process.cwd(), "test-results");

// Ensure test results directory exists
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Read the latest test results
const testResults = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "test-results.json"), "utf-8")
);

// Format for storing test failures
const failureReport = {
  timestamp: new Date().toISOString(),
  failures: [],
  errors: [],
  summary: {
    totalTests: 0,
    failedTests: 0,
    passedTests: 0,
  },
};

// Process test results
function processTestResults(results) {
  if (results.testResults) {
    results.testResults.forEach((testFile) => {
      failureReport.summary.totalTests +=
        testFile.assertionResults?.length || 0;

      testFile.assertionResults?.forEach((test) => {
        if (test.status === "failed") {
          failureReport.summary.failedTests++;
          failureReport.failures.push({
            testName: test.title,
            fullName: test.fullName,
            filePath: testFile.name,
            errorMessage: test.failureMessages?.join("\n"),
            duration: test.duration,
          });
        } else if (test.status === "passed") {
          failureReport.summary.passedTests++;
        }
      });
    });
  }

  // Capture any errors that occurred during test execution
  if (results.errors?.length > 0) {
    failureReport.errors = results.errors;
  }
}

// Process the results
processTestResults(testResults);

// Save the failure report
const reportFileName = `failure-report-${new Date()
  .toISOString()
  .replace(/[:.]/g, "-")}.json`;
fs.writeFileSync(
  path.join(TEST_RESULTS_DIR, reportFileName),
  JSON.stringify(failureReport, null, 2)
);

// Generate a human-readable summary
const summary = `
Test Execution Summary
=====================
Time: ${failureReport.timestamp}

Statistics
----------
Total Tests: ${failureReport.summary.totalTests}
Passed: ${failureReport.summary.passedTests}
Failed: ${failureReport.summary.failedTests}

${
  failureReport.failures.length > 0
    ? `
Failed Tests
-----------
${failureReport.failures
  .map(
    (f) => `
• ${f.fullName}
  File: ${f.filePath}
  Error: ${f.errorMessage?.split("\n")[0]}
`
  )
  .join("\n")}`
    : "All tests passed!"
}

${
  failureReport.errors.length > 0
    ? `
Execution Errors
---------------
${failureReport.errors.map((e) => `• ${e}`).join("\n")}`
    : ""
}
`;

// Save the summary
fs.writeFileSync(path.join(TEST_RESULTS_DIR, "latest-summary.txt"), summary);

// Output summary to console
console.log(summary);

// Exit with appropriate code
process.exit(failureReport.failures.length > 0 ? 1 : 0);
