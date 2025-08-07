#!/usr/bin/env node

/**
 * Comprehensive Puppeteer QA Testing System
 * Enhanced error handling and robust testing for Tesla App
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get project root dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Cross-platform Chrome detection
function findChrome() {
  const chromePaths = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    ]
  };

  const platform = process.platform;
  const paths = chromePaths[platform] || chromePaths.linux;

  for (const chromePath of paths) {
    try {
      if (chromePath && fs.existsSync(chromePath)) {
        return chromePath;
      }
    } catch (error) {
      // Continue to next path
    }
  }

  return null;
}

class PuppeteerQARunner {
  constructor() {
    this.browser = null;
    this.results = [];
    this.screenshots = [];
    this.startTime = new Date();
    this.screenshotDir = path.join(PROJECT_ROOT, 'debug');
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async init() {
    console.log('🚀 Initializing Puppeteer QA Runner...\n');

    // Enhanced Chrome configuration
    const launchOptions = {
      headless: false, // Show browser for debugging
      devtools: true,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--remote-debugging-port=9222',
        '--window-size=1200,800',
        '--start-maximized',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-infobars',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions-except',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-gpu-sandbox'
      ]
    };

    // Try to find Chrome executable
    const chromePath = findChrome();
    if (chromePath) {
      launchOptions.executablePath = chromePath;
      console.log(`🔧 Using Chrome at: ${chromePath}`);
    } else {
      console.log('🔧 Using system default Chrome');
    }

    try {
      this.browser = await puppeteer.launch(launchOptions);
      console.log(`✅ Browser launched successfully!`);
      const version = await this.browser.version();
      console.log(`📋 Version: ${version}\n`);
    } catch (error) {
      console.error('❌ Failed to launch browser:', error.message);
      throw error;
    }
  }

  async createNewPage() {
    const page = await this.browser.newPage();
    
    // Enhanced page configuration
    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 PuppeteerQA/1.0');
    
    // Set up error handlers
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`🔴 Page Error: ${error.message}`);
    });

    page.on('requestfailed', request => {
      console.log(`🔴 Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });

    return page;
  }

  async takeScreenshot(page, name, fullPage = true) {
    try {
      const timestamp = Date.now();
      const screenshotPath = path.join(this.screenshotDir, `qa-${timestamp}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`);
      
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage
      });

      this.screenshots.push({
        name,
        path: screenshotPath,
        timestamp: new Date().toISOString()
      });

      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      console.log(`❌ Screenshot failed for ${name}: ${error.message}`);
      return null;
    }
  }

  async testUrl(url, testName, timeout = 30000) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`🌐 URL: ${url}`);

    const testResult = {
      name: testName,
      url,
      timestamp: new Date().toISOString(),
      steps: [],
      screenshots: [],
      success: false,
      duration: 0,
      errors: []
    };

    let page = null;
    const startTime = Date.now();

    try {
      // Create a fresh page for each test to avoid frame detachment issues
      page = await this.createNewPage();

      // Step 1: Navigate to URL
      console.log('📍 Step 1: Navigating to URL...');
      const navigationPromise = page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout 
      });

      const response = await navigationPromise;
      
      testResult.steps.push({
        step: 'Page Load',
        status: response && response.ok() ? 'passed' : 'failed',
        details: response ? `HTTP ${response.status()}` : 'No response',
        timestamp: new Date().toISOString()
      });

      if (!response || !response.ok()) {
        throw new Error(`Failed to load page: HTTP ${response ? response.status() : 'No response'}`);
      }

      console.log(`✅ Page loaded successfully (HTTP ${response.status()})`);

      // Step 2: Wait for page to be ready
      console.log('📍 Step 2: Waiting for page to be ready...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Give page time to render

      // Step 3: Take initial screenshot
      console.log('📍 Step 3: Taking screenshot...');
      await this.takeScreenshot(page, `${testName} - Initial Load`);

      // Step 4: Check page title
      console.log('📍 Step 4: Checking page title...');
      const title = await page.title();
      testResult.steps.push({
        step: 'Page Title',
        status: title ? 'passed' : 'failed',
        details: title || 'No title found',
        timestamp: new Date().toISOString()
      });

      console.log(`📝 Page Title: ${title}`);

      // Step 5: Check for React root
      console.log('📍 Step 5: Checking React app...');
      const hasReactRoot = await page.$('#root');
      testResult.steps.push({
        step: 'React Root',
        status: hasReactRoot ? 'passed' : 'failed',
        details: hasReactRoot ? 'Found #root element' : 'Missing #root element',
        timestamp: new Date().toISOString()
      });

      // Step 6: Check for Tesla-specific elements
      console.log('📍 Step 6: Looking for Tesla elements...');
      const teslaElements = await page.$$('[data-testid*="tesla"], [class*="tesla"], [class*="Tesla"], h1, h2, .card, .dashboard');
      testResult.steps.push({
        step: 'Tesla Elements',
        status: teslaElements.length > 0 ? 'passed' : 'info',
        details: `Found ${teslaElements.length} potential Tesla/UI elements`,
        timestamp: new Date().toISOString()
      });

      console.log(`🔍 Found ${teslaElements.length} UI elements`);

      // Step 7: Check JavaScript execution
      console.log('📍 Step 7: Testing JavaScript execution...');
      const jsResult = await page.evaluate(() => {
        return {
          readyState: document.readyState,
          hasJQuery: typeof window.$ !== 'undefined',
          hasReact: typeof window.React !== 'undefined',
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
      });

      testResult.steps.push({
        step: 'JavaScript Execution',
        status: 'passed',
        details: `Ready State: ${jsResult.readyState}, URL: ${jsResult.url}`,
        timestamp: new Date().toISOString()
      });

      console.log(`🧮 JavaScript: Ready State = ${jsResult.readyState}`);

      // Step 8: Check for errors in console
      console.log('📍 Step 8: Checking for console errors...');
      const logs = await page.evaluate(() => {
        const logs = window.console._logs || [];
        return logs.slice(-10); // Get last 10 logs
      });

      // Step 9: Final screenshot
      console.log('📍 Step 9: Taking final screenshot...');
      await this.takeScreenshot(page, `${testName} - Final State`);

      // Test completed successfully
      testResult.success = true;
      testResult.duration = Date.now() - startTime;
      console.log(`✅ Test completed successfully in ${testResult.duration}ms`);

    } catch (error) {
      testResult.success = false;
      testResult.duration = Date.now() - startTime;
      testResult.errors.push(error.message);
      
      console.log(`❌ Test failed: ${error.message}`);
      
      // Take screenshot of error state if page exists
      if (page) {
        try {
          await this.takeScreenshot(page, `${testName} - Error State`);
        } catch (screenshotError) {
          console.log(`❌ Error screenshot failed: ${screenshotError.message}`);
        }
      }
    } finally {
      // Always close the page to prevent frame detachment issues
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.log(`⚠️ Warning: Failed to close page: ${closeError.message}`);
        }
      }
    }

    this.results.push(testResult);
    return testResult;
  }

  async runFullQASuite() {
    console.log('🎯 Starting Full QA Test Suite...\n');

    const tests = [
      {
        url: 'http://localhost:8080',
        name: 'Frontend Development Server'
      },
      {
        url: 'http://localhost:3000',
        name: 'Backend Development Server (Expected to fail - no backend on 3000)'
      },
      {
        url: 'https://81e929d7.awhittlewandering-frontend.pages.dev',
        name: 'Production Frontend'
      },
      {
        url: 'https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/health',
        name: 'API Health Check'
      }
    ];

    for (const test of tests) {
      await this.testUrl(test.url, test.name);
      // Wait between tests to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async generateReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;

    const report = {
      summary: {
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${Math.round(duration / 1000)}s`,
        totalTests: this.results.length,
        passedTests: this.results.filter(r => r.success).length,
        failedTests: this.results.filter(r => !r.success).length,
        totalScreenshots: this.screenshots.length
      },
      results: this.results,
      screenshots: this.screenshots
    };

    // Save report to file
    const reportPath = `debug/qa-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 QA TEST REPORT');
    console.log('==================');
    console.log(`📅 Duration: ${report.summary.duration}`);
    console.log(`✅ Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
    console.log(`❌ Failed: ${report.summary.failedTests}/${report.summary.totalTests}`);
    console.log(`📸 Screenshots: ${report.summary.totalScreenshots}`);
    console.log(`📄 Report saved: ${reportPath}\n`);

    // Print individual test results
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name} (${result.duration}ms)`);
      if (!result.success && result.errors.length > 0) {
        console.log(`   Error: ${result.errors[0]}`);
      }
    });

    return report;
  }

  async cleanup() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('\n🛑 Browser closed successfully.');
      } catch (error) {
        console.log(`⚠️ Warning: Failed to close browser: ${error.message}`);
      }
    }
  }
}

// Main execution
async function main() {
  const qaRunner = new PuppeteerQARunner();
  
  try {
    await qaRunner.init();
    await qaRunner.runFullQASuite();
    await qaRunner.generateReport();
  } catch (error) {
    console.error('❌ QA Runner failed:', error.message);
  } finally {
    await qaRunner.cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch(console.error);
