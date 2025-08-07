#!/usr/bin/env node

/**
 * Quick Dev Site Verification with Puppeteer
 * Tests if the local development web app is displaying correctly
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get project root dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname);

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

  return null; // Let Puppeteer find Chrome automatically
}

const LOCAL_URL = 'http://localhost:8080';
const TEST_TIMEOUT = 30000;

class DevSiteValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.screenshots = [];
    this.debugDir = path.join(PROJECT_ROOT, 'debug');
    
    // Ensure debug directory exists
    if (!fs.existsSync(this.debugDir)) {
      fs.mkdirSync(this.debugDir, { recursive: true });
    }
  }

  async setup() {
    console.log('🚀 Launching Chrome browser...');
    
    const launchOptions = {
      headless: false, // Show browser for debugging
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: { width: 1200, height: 800 }
    };

    // Add Chrome executable path if found
    const chromePath = findChrome();
    if (chromePath) {
      launchOptions.executablePath = chromePath;
      console.log(`🌐 Using Chrome at: ${chromePath}`);
    } else {
      console.log('🌐 Using system default Chrome');
    }

    this.browser = await puppeteer.launch(launchOptions);

    this.page = await this.browser.newPage();

    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.errors.push(`Console error: ${msg.text()}`);
        console.log(`❌ Console error: ${msg.text()}`);
      } else if (msg.type() === 'warn') {
        console.log(`⚠️  Console warning: ${msg.text()}`);
      }
    });

    this.page.on('pageerror', error => {
      this.errors.push(`Page error: ${error.message}`);
      console.log(`❌ Page error: ${error.message}`);
    });

    this.page.on('requestfailed', request => {
      this.errors.push(`Failed request: ${request.url()}`);
      console.log(`❌ Failed request: ${request.url()}`);
    });
  }

  async takeScreenshot(name) {
    const timestamp = Date.now();
    const fileName = path.join(this.debugDir, `${name}-${timestamp}.png`);
    
    await this.page.screenshot({ 
      path: fileName, 
      fullPage: true 
    });
    
    this.screenshots.push(fileName);
    console.log(`📸 Screenshot saved: ${fileName}`);
    return fileName;
  }

  async testPageLoad() {
    console.log(`🌐 Testing page load: ${LOCAL_URL}`);
    
    try {
      const response = await this.page.goto(LOCAL_URL, {
        waitUntil: 'networkidle0',
        timeout: TEST_TIMEOUT
      });

      console.log(`✅ Page loaded with status: ${response.status()}`);
      await this.takeScreenshot('page-loaded');

      return response.status() === 200;
    } catch (error) {
      console.log(`❌ Page load failed: ${error.message}`);
      await this.takeScreenshot('page-load-failed');
      return false;
    }
  }

  async checkCriticalElements() {
    console.log('🔍 Checking for critical page elements...');
    
    const checks = [
      { selector: 'title', name: 'Page title' },
      { selector: '#root', name: 'React root element' },
      { selector: 'main', name: 'Main content area' },
      { selector: 'header', name: 'Header section' },
    ];

    let allElementsFound = true;

    for (const check of checks) {
      try {
        await this.page.waitForSelector(check.selector, { timeout: 5000 });
        console.log(`✅ Found: ${check.name}`);
      } catch (error) {
        console.log(`❌ Missing: ${check.name} (${check.selector})`);
        allElementsFound = false;
      }
    }

    await this.takeScreenshot('elements-check');
    return allElementsFound;
  }

  async checkAPIConnectivity() {
    console.log('🔌 Testing API connectivity...');
    
    // Wait for any API calls to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if there are any network errors
    const apiErrors = this.errors.filter(error => 
      error.includes('api') || error.includes('fetch') || error.includes('xhr')
    );

    if (apiErrors.length === 0) {
      console.log('✅ No API connectivity errors detected');
      return true;
    } else {
      console.log(`❌ API errors detected: ${apiErrors.length}`);
      apiErrors.forEach(error => console.log(`   - ${error}`));
      return false;
    }
  }

  async checkTeslaData() {
    console.log('🚗 Checking for Tesla data display...');
    
    try {
      // Look for common Tesla data indicators
      const teslaSelectors = [
        '[data-testid*="tesla"]',
        '[data-testid*="battery"]',
        '[data-testid*="vehicle"]',
        'text*="Tesla"',
        'text*="Battery"',
        'text*="Range"',
        'text*="Odometer"'
      ];

      let dataFound = false;
      for (const selector of teslaSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            console.log(`✅ Found Tesla data element: ${selector}`);
            dataFound = true;
            break;
          }
        } catch (e) {
          // Continue checking other selectors
        }
      }

      if (!dataFound) {
        // Check page content for Tesla-related text
        const pageContent = await this.page.content();
        const teslaKeywords = ['tesla', 'battery', 'range', 'charging', 'odometer'];
        
        for (const keyword of teslaKeywords) {
          if (pageContent.toLowerCase().includes(keyword)) {
            console.log(`✅ Found Tesla keyword in content: ${keyword}`);
            dataFound = true;
            break;
          }
        }
      }

      await this.takeScreenshot('tesla-data-check');
      return dataFound;
    } catch (error) {
      console.log(`❌ Error checking Tesla data: ${error.message}`);
      return false;
    }
  }

  async runFullValidation() {
    console.log('🧪 Starting full dev site validation...\n');
    
    const results = {
      pageLoad: false,
      criticalElements: false,
      apiConnectivity: false,
      teslaData: false,
      overallSuccess: false
    };

    try {
      await this.setup();
      
      results.pageLoad = await this.testPageLoad();
      results.criticalElements = await this.checkCriticalElements();
      results.apiConnectivity = await this.checkAPIConnectivity();
      results.teslaData = await this.checkTeslaData();
      
      results.overallSuccess = results.pageLoad && results.criticalElements;
      
    } catch (error) {
      console.log(`❌ Validation error: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }

    return results;
  }

  async generateReport(results) {
    console.log('\n📊 DEV SITE VALIDATION REPORT');
    console.log('================================');
    console.log(`Page Load: ${results.pageLoad ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Critical Elements: ${results.criticalElements ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`API Connectivity: ${results.apiConnectivity ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Tesla Data: ${results.teslaData ? '✅ PASS' : '❌ FAIL'}`);
    console.log('================================');
    console.log(`Overall Status: ${results.overallSuccess ? '✅ SITE IS WORKING' : '❌ SITE HAS ISSUES'}`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS DETECTED:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.screenshots.length > 0) {
      console.log('\n📸 SCREENSHOTS CAPTURED:');
      this.screenshots.forEach(screenshot => {
        console.log(`- ${screenshot}`);
      });
    }

    console.log(`\n🌐 Test URL: ${LOCAL_URL}`);
    console.log(`⏰ Test completed at: ${new Date().toISOString()}`);
  }
}

// Run the validation
async function main() {
  const validator = new DevSiteValidator();
  
  try {
    const results = await validator.runFullValidation();
    await validator.generateReport(results);
    
    // Exit with appropriate code
    process.exit(results.overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Fatal error during validation:', error);
    process.exit(1);
  }
}

// Auto-run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DevSiteValidator };
