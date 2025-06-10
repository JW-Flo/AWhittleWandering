# Testing and Verification Script for Site Functionality

/**
 * This script provides a structured approach to testing the 48 Continental USA site
 * It verifies core functionality, logs issues, and generates reports
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  url: 'https://main.continentalusa-site.pages.dev',
  screenshotDir: './test-screenshots',
  waitTime: 5000, // Time to wait for resources to load
  viewports: [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 812, name: 'mobile' }
  ]
};

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

// Helper to get timestamp for filenames
const getTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

async function runVerification() {
  console.log(`Starting verification for: ${CONFIG.url}`);
  const timestamp = getTimestamp();
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1920,1080']
  });
  
  // Create report
  let report = {
    timestamp,
    url: CONFIG.url,
    tests: [],
    consoleMessages: [],
    networkRequests: [],
    screenshots: [],
    performance: null
  };
  
  try {
    // Testing desktop viewport first
    const page = await browser.newPage();
    
    // Collect console messages
    page.on('console', (msg) => {
      report.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Collect network requests
    page.on('request', request => {
      report.networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    // Test 1: Initial page load
    await page.goto(CONFIG.url, { waitUntil: 'networkidle2' });
    console.log('Page loaded, waiting for resources...');
    await page.waitForTimeout(CONFIG.waitTime);
    
    // Take screenshot of initial load
    const screenshotPath = path.join(CONFIG.screenshotDir, `${timestamp}-initial-load.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.screenshots.push({ name: 'initial-load', path: screenshotPath });
    console.log(`Screenshot saved: ${screenshotPath}`);
    
    // Test 2: Check if map loads
    const mapLoaded = await page.evaluate(() => {
      const mapElement = document.querySelector('.mapboxgl-map');
      const loadingIndicator = document.querySelector('.map-loading-indicator');
      return {
        mapExists: !!mapElement,
        mapHasCanvas: !!(mapElement && mapElement.querySelector('canvas')),
        isLoading: !!(loadingIndicator && window.getComputedStyle(loadingIndicator).display !== 'none')
      };
    });
    
    report.tests.push({
      name: 'Map Loading',
      passed: mapLoaded.mapExists && mapLoaded.mapHasCanvas && !mapLoaded.isLoading,
      details: mapLoaded
    });
    
    console.log('Map check results:', mapLoaded);
    
    // Test 3: Check vehicle data
    const vehicleData = await page.evaluate(() => {
      // Look for vehicle marker or vehicle data component
      const vehicleMarker = document.querySelector('.vehicle-marker');
      const vehiclePanel = document.querySelector('.vehicle-data-panel, .vehicle-stats');
      
      return {
        markerExists: !!vehicleMarker,
        panelExists: !!vehiclePanel,
        panelContent: vehiclePanel ? vehiclePanel.textContent : null
      };
    });
    
    report.tests.push({
      name: 'Vehicle Data',
      passed: vehicleData.markerExists || vehicleData.panelExists,
      details: vehicleData
    });
    
    console.log('Vehicle data check results:', vehicleData);
    
    // Test 4: Check UI components
    const uiComponents = await page.evaluate(() => {
      const tabs = document.querySelectorAll('.tab, nav button');
      const tabsArray = Array.from(tabs).map(tab => ({
        text: tab.textContent.trim(),
        visible: window.getComputedStyle(tab).display !== 'none'
      }));
      
      return {
        tabsCount: tabsArray.length,
        tabs: tabsArray,
        hasJourneyTab: tabsArray.some(t => t.text.toLowerCase().includes('journey')),
        hasVehicleTab: tabsArray.some(t => t.text.toLowerCase().includes('vehicle')),
        hasStatesTab: tabsArray.some(t => t.text.toLowerCase().includes('state'))
      };
    });
    
    report.tests.push({
      name: 'UI Components',
      passed: uiComponents.tabsCount > 0 && 
              (uiComponents.hasJourneyTab || uiComponents.hasVehicleTab || uiComponents.hasStatesTab),
      details: uiComponents
    });
    
    console.log('UI components check results:', uiComponents);
    
    // Test 5: Check for console errors
    const consoleErrors = report.consoleMessages.filter(msg => msg.type === 'error');
    report.tests.push({
      name: 'Console Errors',
      passed: consoleErrors.length === 0,
      details: {
        errorCount: consoleErrors.length,
        errors: consoleErrors
      }
    });
    
    console.log(`Console errors found: ${consoleErrors.length}`);
    
    // Test 6: Performance metrics
    const performance = await page.evaluate(() => {
      const perfData = window.performance;
      if (!perfData) return null;
      
      const timing = perfData.timing;
      if (!timing) return null;
      
      return {
        loadStart: timing.navigationStart,
        interactive: timing.domInteractive - timing.navigationStart,
        complete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: Math.round(perfData.getEntriesByType('paint')[0]?.startTime || 0),
        resourceCount: perfData.getEntriesByType('resource').length
      };
    });
    
    report.performance = performance;
    report.tests.push({
      name: 'Performance',
      passed: performance && performance.complete < 5000, // 5 seconds threshold
      details: performance
    });
    
    console.log('Performance metrics:', performance);
    
    // Save the full verification report
    const reportPath = path.join(CONFIG.screenshotDir, `${timestamp}-verification-report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${reportPath}`);
    
    // Generate summary
    let passedTests = report.tests.filter(t => t.passed).length;
    console.log(`\n===== VERIFICATION SUMMARY =====`);
    console.log(`URL: ${CONFIG.url}`);
    console.log(`Timestamp: ${new Date(timestamp).toLocaleString()}`);
    console.log(`Tests Passed: ${passedTests}/${report.tests.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Load Time: ${performance ? performance.complete + 'ms' : 'Unknown'}`);
    console.log(`===============================\n`);
    
    // Create human-readable summary file
    const summaryPath = path.join(CONFIG.screenshotDir, `${timestamp}-summary.md`);
    let summaryContent = `# Site Verification Summary\n\n`;
    summaryContent += `* **URL:** ${CONFIG.url}\n`;
    summaryContent += `* **Date:** ${new Date(timestamp).toLocaleString()}\n`;
    summaryContent += `* **Result:** ${passedTests === report.tests.length ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    summaryContent += `## Test Results\n\n`;
    report.tests.forEach(test => {
      summaryContent += `* ${test.passed ? '✅' : '❌'} **${test.name}**: ${test.passed ? 'Passed' : 'Failed'}\n`;
    });
    
    summaryContent += `\n## Performance\n\n`;
    if (performance) {
      summaryContent += `* **Time to Interactive:** ${performance.interactive}ms\n`;
      summaryContent += `* **Complete Load Time:** ${performance.complete}ms\n`;
      summaryContent += `* **Resource Count:** ${performance.resourceCount}\n`;
    } else {
      summaryContent += `* Performance metrics unavailable\n`;
    }
    
    if (consoleErrors.length > 0) {
      summaryContent += `\n## Console Errors (${consoleErrors.length})\n\n`;
      consoleErrors.forEach((error, i) => {
        summaryContent += `${i+1}. ${error.text}\n`;
      });
    }
    
    fs.writeFileSync(summaryPath, summaryContent);
    console.log(`Summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('Verification failed with error:', error);
    report.error = {
      message: error.message,
      stack: error.stack
    };
    
    // Save the error report
    const errorReportPath = path.join(CONFIG.screenshotDir, `${timestamp}-error-report.json`);
    fs.writeFileSync(errorReportPath, JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

// Run the verification
runVerification().catch(console.error);
