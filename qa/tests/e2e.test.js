/**
 * End-to-End Testing with Puppeteer
 * Comprehensive user journey testing for the Tesla dashboard
 */

import puppeteer from 'puppeteer';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get project root dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SCREENSHOT_DIR = path.join(PROJECT_ROOT, 'debug');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const FRONTEND_URL = 'https://ab99ceea.awhittlewandering-frontend.pages.dev';
const API_URL = 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';

class E2ETestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.networkRequests = [];
    this.performanceMetrics = {};
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport for consistent testing
    await this.page.setViewport({ width: 1200, height: 800 });

    // Monitor errors and network
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.errors.push(`Console error: ${msg.text()}`);
      }
    });

    this.page.on('pageerror', error => {
      this.errors.push(`Page error: ${error.message}`);
    });

    this.page.on('requestfailed', request => {
      this.errors.push(`Failed request: ${request.url()} - ${request.failure().errorText}`);
    });

    this.page.on('response', response => {
      this.networkRequests.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type']
      });
    });

    // Set up performance monitoring
    await this.page.coverage.startJSCoverage();
    await this.page.coverage.startCSSCoverage();
  }

  async teardown() {
    if (this.page) {
      const jsCoverage = await this.page.coverage.stopJSCoverage();
      const cssCoverage = await this.page.coverage.stopCSSCoverage();
      
      this.performanceMetrics.coverage = {
        js: this.calculateCoverage(jsCoverage),
        css: this.calculateCoverage(cssCoverage)
      };
    }

    if (this.browser) {
      await this.browser.close();
    }
  }

  calculateCoverage(coverage) {
    let totalBytes = 0;
    let usedBytes = 0;

    for (const entry of coverage) {
      totalBytes += entry.text.length;
      for (const range of entry.ranges) {
        usedBytes += range.end - range.start - 1;
      }
    }

    return totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      this.errors.push(`Element not found: ${selector}`);
      return false;
    }
  }

  async takeScreenshot(name) {
    const timestamp = Date.now();
    const fileName = path.join(SCREENSHOT_DIR, `${name}-${timestamp}.png`);
    
    await this.page.screenshot({ 
      path: fileName, 
      fullPage: true 
    });
    
    return fileName;
  }

  async measurePageLoad() {
    const startTime = Date.now();
    
    const response = await this.page.goto(FRONTEND_URL, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    
    // Get Core Web Vitals
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'FCP') vitals.fcp = entry.value;
            if (entry.name === 'LCP') vitals.lcp = entry.value;
            if (entry.name === 'FID') vitals.fid = entry.value;
            if (entry.name === 'CLS') vitals.cls = entry.value;
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    return {
      loadTime,
      responseStatus: response.status(),
      metrics
    };
  }
}

describe('End-to-End Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

  afterAll(async () => {
    if (e2eRunner) {
      await e2eRunner.teardown();
    }
  });

  describe('Initial Page Load', () => {
    it('should load the main dashboard successfully', async () => {
      const loadMetrics = await e2eRunner.measurePageLoad();
      
      expect(loadMetrics.responseStatus).toBe(200);
      expect(loadMetrics.loadTime).toBeLessThan(10000); // Load within 10 seconds
      
      // Take screenshot for visual verification
      await e2eRunner.takeScreenshot('dashboard-loaded');
      
      // Check for critical elements
      const hasHeader = await e2eRunner.waitForElement('[data-testid="dashboard-header"]');
      const hasContent = await e2eRunner.waitForElement('[data-testid="dashboard-content"]');
      
      expect(hasHeader).toBe(true);
      expect(hasContent).toBe(true);
    }, 30000);

    it('should not have any critical JavaScript errors', async () => {
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      // Wait a bit for any async errors to surface
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const criticalErrors = e2eRunner.errors.filter(error => 
        error.includes('Uncaught') || 
        error.includes('TypeError') || 
        error.includes('ReferenceError')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });

    it('should load all critical resources', async () => {
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      const failedRequests = e2eRunner.networkRequests.filter(req => req.status >= 400);
      const criticalFailures = failedRequests.filter(req => 
        req.url.includes('.js') || 
        req.url.includes('.css') || 
        req.url.includes(API_URL)
      );
      
      expect(criticalFailures).toHaveLength(0);
    });
  });

  describe('Tesla Data Integration', () => {
    it('should fetch and display Tesla data', async () => {
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      // Wait for Tesla data to load
      const dataLoaded = await e2eRunner.waitForElement('[data-testid="tesla-data"]');
      expect(dataLoaded).toBe(true);
      
      // Check for specific data elements
      const batteryLevel = await e2eRunner.page.$('[data-testid="battery-level"]');
      const range = await e2eRunner.page.$('[data-testid="vehicle-range"]');
      const odometer = await e2eRunner.page.$('[data-testid="odometer"]');
      
      expect(batteryLevel).toBeTruthy();
      expect(range).toBeTruthy();
      expect(odometer).toBeTruthy();
      
      // Verify data is numeric and reasonable
      const batteryText = await e2eRunner.page.$eval('[data-testid="battery-level"]', el => el.textContent);
      const batteryValue = parseInt(batteryText.replace(/\D/g, ''));
      
      expect(batteryValue).toBeGreaterThanOrEqual(0);
      expect(batteryValue).toBeLessThanOrEqual(100);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API failure by intercepting requests
      await e2eRunner.page.setRequestInterception(true);
      
      e2eRunner.page.on('request', (request) => {
        if (request.url().includes('/api/tesla-data')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      // Should show error state
      const errorMessage = await e2eRunner.waitForElement('[data-testid="error-message"]');
      expect(errorMessage).toBe(true);
      
      // Should have retry button
      const retryButton = await e2eRunner.waitForElement('[data-testid="retry-button"]');
      expect(retryButton).toBe(true);
    });

    it('should auto-refresh data periodically', async () => {
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      // Wait for initial data load
      await e2eRunner.waitForElement('[data-testid="tesla-data"]');
      
      // Count initial API requests
      const initialRequests = e2eRunner.networkRequests.filter(req => 
        req.url.includes('/api/tesla-data')
      ).length;
      
      // Wait for auto-refresh (30 seconds + buffer)
      await new Promise(resolve => setTimeout(resolve, 35000));
      
      // Count requests after wait
      const finalRequests = e2eRunner.networkRequests.filter(req => 
        req.url.includes('/api/tesla-data')
      ).length;
      
      expect(finalRequests).toBeGreaterThan(initialRequests);
    }, 45000);
  });

  describe('User Interactions', () => {
    it('should handle refresh button clicks', async () => {
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      await e2eRunner.waitForElement('[data-testid="refresh-button"]');
      
      const initialRequests = e2eRunner.networkRequests.filter(req => 
        req.url.includes('/api/tesla-data')
      ).length;
      
      // Click refresh button
      await e2eRunner.page.click('[data-testid="refresh-button"]');
      
      // Wait for new request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalRequests = e2eRunner.networkRequests.filter(req => 
        req.url.includes('/api/tesla-data')
      ).length;
      
      expect(finalRequests).toBeGreaterThan(initialRequests);
    });

    it('should toggle map visibility', async () => {
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      // Check if map toggle exists
      const mapToggle = await e2eRunner.waitForElement('[data-testid="map-toggle"]');
      if (mapToggle) {
        await e2eRunner.page.click('[data-testid="map-toggle"]');
        
        // Check if map becomes visible
        const map = await e2eRunner.waitForElement('[data-testid="tesla-map"]');
        expect(map).toBe(true);
      }
    });

    it('should handle keyboard navigation', async () => {
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      // Tab through interactive elements
      await e2eRunner.page.keyboard.press('Tab');
      
      const focusedElement = await e2eRunner.page.evaluate(() => {
        return document.activeElement.tagName;
      });
      
      expect(['BUTTON', 'A', 'INPUT'].includes(focusedElement)).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile viewport', async () => {
      await e2eRunner.page.setViewport({ width: 375, height: 667 });
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      await e2eRunner.takeScreenshot('mobile-view');
      
      // Check mobile layout
      const mobileMenu = await e2eRunner.page.$('[data-testid="mobile-menu"]');
      expect(mobileMenu).toBeTruthy();
      
      // Ensure content is still accessible
      const hasData = await e2eRunner.waitForElement('[data-testid="tesla-data"]');
      expect(hasData).toBe(true);
    });

    it('should work on tablet viewport', async () => {
      await e2eRunner.page.setViewport({ width: 768, height: 1024 });
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      await e2eRunner.takeScreenshot('tablet-view');
      
      const hasData = await e2eRunner.waitForElement('[data-testid="tesla-data"]');
      expect(hasData).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should meet Core Web Vitals thresholds', async () => {
      const loadMetrics = await e2eRunner.measurePageLoad();
      
      // Core Web Vitals thresholds
      if (loadMetrics.metrics.lcp) {
        expect(loadMetrics.metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
      }
      if (loadMetrics.metrics.fid) {
        expect(loadMetrics.metrics.fid).toBeLessThan(100); // FID < 100ms
      }
      if (loadMetrics.metrics.cls) {
        expect(loadMetrics.metrics.cls).toBeLessThan(0.1); // CLS < 0.1
      }
    });

    it('should have reasonable bundle size', async () => {
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      const jsRequests = e2eRunner.networkRequests.filter(req => 
        req.url.includes('.js') && req.status === 200
      );
      
      // Calculate total JS size (rough estimate)
      const totalJSRequests = jsRequests.length;
      expect(totalJSRequests).toBeLessThan(20); // Reasonable number of JS files
    });

    it('should not have memory leaks', async () => {
      const initialMemory = await e2eRunner.page.metrics();
      
      // Simulate user activity
      for (let i = 0; i < 10; i++) {
        await e2eRunner.page.click('[data-testid="refresh-button"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const finalMemory = await e2eRunner.page.metrics();
      
      // Memory should not increase dramatically
      const memoryIncrease = finalMemory.JSHeapUsedSize - initialMemory.JSHeapUsedSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.JSHeapUsedSize) * 100;
      
      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
    });
  });

  describe('User Journey', () => {
    it('should complete full user journey successfully', async () => {
      // Step 1: Load dashboard
      await e2eRunner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      await e2eRunner.takeScreenshot('journey-1-dashboard');
      
      // Step 2: View Tesla data
      const dataVisible = await e2eRunner.waitForElement('[data-testid="tesla-data"]');
      expect(dataVisible).toBe(true);
      
      // Step 3: Refresh data
      await e2eRunner.page.click('[data-testid="refresh-button"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await e2eRunner.takeScreenshot('journey-2-refreshed');
      
      // Step 4: Toggle map (if available)
      const mapToggle = await e2eRunner.page.$('[data-testid="map-toggle"]');
      if (mapToggle) {
        await e2eRunner.page.click('[data-testid="map-toggle"]');
        await e2eRunner.takeScreenshot('journey-3-map');
      }
      
      // Step 5: Verify no errors occurred
      const criticalErrors = e2eRunner.errors.filter(error => 
        error.includes('Uncaught') || error.includes('TypeError')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });
});

// Export utilities for recursive pipeline
export const e2eTestUtils = {
  async quickHealthCheck() {
    const runner = new E2ETestRunner();
    
    try {
      await runner.setup();
      
      const response = await runner.page.goto(FRONTEND_URL, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      const success = response.status() === 200;
      const hasContent = await runner.waitForElement('[data-testid="dashboard-content"]', 5000);
      
      return {
        success,
        hasContent,
        errors: runner.errors,
        responseStatus: response.status()
      };
      
    } finally {
      await runner.teardown();
    }
  },

  async captureScreenshot(name = 'qa-screenshot') {
    const runner = new E2ETestRunner();
    
    try {
      await runner.setup();
      await runner.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      return await runner.takeScreenshot(name);
    } finally {
      await runner.teardown();
    }
  },

  async measurePerformance() {
    const runner = new E2ETestRunner();
    
    try {
      await runner.setup();
      const metrics = await runner.measurePageLoad();
      return metrics;
    } finally {
      await runner.teardown();
    }
  }
};
