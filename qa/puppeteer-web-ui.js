#!/usr/bin/env node

/**
 * Puppeteer Web UI for Tesla App Testing
 * Real-time browser testing with web interface
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import puppeteer from 'puppeteer';
import http from 'http';
import path from 'path';
import fs from 'fs';
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

class PuppeteerWebUI {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.clients = new Set();
    this.browser = null;
    this.page = null;
    this.isRunning = false;
    this.results = [];
    this.screenshots = [];
    this.screenshotDir = path.join(PROJECT_ROOT, 'debug');
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async init() {
    // Setup Express middleware
    this.app.use(express.static('public'));
    this.app.use(express.json());

    // API Routes
    this.app.get('/api/status', (req, res) => {
      res.json({
        isRunning: this.isRunning,
        resultsCount: this.results.length,
        screenshotsCount: this.screenshots.length,
        browserOpen: !!this.browser
      });
    });

    this.app.get('/api/results', (req, res) => {
      res.json(this.results);
    });

    this.app.get('/api/screenshots', (req, res) => {
      res.json(this.screenshots);
    });

    this.app.post('/api/run-test', async (req, res) => {
      const { url, testName } = req.body;
      try {
        await this.runTest(url || 'http://localhost:8080', testName || 'Manual Test');
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/browser-compat-test', async (req, res) => {
      try {
        const result = await this.runBrowserCompatibilityTest();
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Serve main UI
    this.app.get('/', (req, res) => {
      res.send(this.generateHTML());
    });

    // WebSocket handling
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('🔌 Client connected to Puppeteer UI');
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'run-test') {
            await this.runTest(data.url, data.testName);
          }
        } catch (error) {
          this.broadcast({ type: 'error', message: error.message });
        }
      });
    });

    // Start server
    this.server.listen(3001, () => {
      console.log('🚀 Puppeteer Web UI running on http://localhost:3001');
    });
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  async startBrowser() {
    if (this.browser) return;

    try {
      // Enhanced Chrome/Chromium configuration for macOS
      const launchOptions = {
        headless: false, // Show browser for debugging
        devtools: true,
        defaultViewport: null, // Use full viewport
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
          '--disable-renderer-backgrounding'
        ]
      };

      // Use cross-platform Chrome detection
      const chromePath = findChrome();
      if (chromePath) {
        launchOptions.executablePath = chromePath;
        console.log(`🔧 Using Chrome at: ${chromePath}`);
      } else {
        console.log('🔧 Using default Puppeteer Chromium');
      }

      this.browser = await puppeteer.launch(launchOptions);

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1200, height: 800 });

      // Monitor page events
      this.page.on('console', msg => {
        this.broadcast({
          type: 'console',
          level: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      });

      this.page.on('pageerror', error => {
        this.broadcast({
          type: 'page-error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      });

      console.log('🌐 Browser started with DevTools');
      this.broadcast({ type: 'browser-ready' });
    } catch (error) {
      console.error('Failed to start browser:', error);
      throw error;
    }
  }

  async runTest(url = 'http://localhost:8080', testName = 'Dev Site Test') {
    this.isRunning = true;
    this.broadcast({ type: 'test-started', testName, url });

    let testPage = null;

    try {
      await this.startBrowser();

      // Create a new page for each test to avoid frame detachment issues
      testPage = await this.browser.newPage();
      await testPage.setViewport({ width: 1200, height: 800 });

      // Set up page error handlers
      testPage.on('console', msg => {
        if (msg.type() === 'error') {
          this.broadcast({ type: 'console', level: 'error', text: msg.text() });
        }
      });

      testPage.on('pageerror', error => {
        this.broadcast({ type: 'page-error', message: error.message });
      });

      const testResult = {
        name: testName,
        url,
        timestamp: new Date().toISOString(),
        steps: [],
        screenshots: [],
        errors: [],
        success: false
      };

      // Step 1: Navigate to URL with enhanced error handling
      this.broadcast({ type: 'step', message: `Loading ${url}...` });
      
      const response = await testPage.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      }).catch(error => {
        throw new Error(`Navigation failed: ${error.message}`);
      });
      
      testResult.steps.push({
        step: 'Page Load',
        status: response.ok() ? 'passed' : 'failed',
        details: `HTTP ${response.status()}`,
        timestamp: new Date().toISOString()
      });

      // Step 2: Take initial screenshot
      const screenshotPath = path.join(this.screenshotDir, `puppeteer-${Date.now()}.png`);
      await testPage.screenshot({ path: screenshotPath, fullPage: true });
      testResult.screenshots.push(screenshotPath);
      this.screenshots.push({
        path: screenshotPath,
        name: `${testName} - Page Load`,
        timestamp: new Date().toISOString()
      });

      this.broadcast({ 
        type: 'screenshot', 
        path: screenshotPath,
        name: `${testName} - Initial Load`
      });

      // Step 3: Check for React root
      this.broadcast({ type: 'step', message: 'Checking React app...' });
      const hasReactRoot = await testPage.$('#root');
      testResult.steps.push({
        step: 'React Root',
        status: hasReactRoot ? 'passed' : 'failed',
        details: hasReactRoot ? 'Found #root element' : 'Missing #root element',
        timestamp: new Date().toISOString()
      });

      // Step 4: Check page title
      const title = await testPage.title();
      testResult.steps.push({
        step: 'Page Title',
        status: title ? 'passed' : 'failed',
        details: title || 'No title found',
        timestamp: new Date().toISOString()
      });

      // Step 5: Check for Tesla data (if present)
      this.broadcast({ type: 'step', message: 'Looking for Tesla data...' });
      const teslaElements = await testPage.$$('[data-testid*="tesla"], [class*="tesla"], [class*="Tesla"]');
      testResult.steps.push({
        step: 'Tesla Elements',
        status: teslaElements.length > 0 ? 'passed' : 'info',
        details: `Found ${teslaElements.length} Tesla-related elements`,
        timestamp: new Date().toISOString()
      });

      // Step 6: Performance metrics
      const metrics = await testPage.metrics();
      testResult.steps.push({
        step: 'Performance',
        status: 'info',
        details: `JS Heap: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`,
        timestamp: new Date().toISOString()
      });

      // Final screenshot
      const finalScreenshot = `debug/puppeteer-final-${Date.now()}.png`;
      await testPage.screenshot({ path: finalScreenshot, fullPage: true });
      testResult.screenshots.push(finalScreenshot);
      
      testResult.success = testResult.steps.filter(s => s.status === 'failed').length === 0;
      this.results.push(testResult);

      this.broadcast({
        type: 'test-completed',
        result: testResult
      });

      console.log(`✅ Test completed: ${testName}`);
      return testResult;

    } catch (error) {
      console.error('Test failed:', error);
      
      const errorResult = {
        name: testName,
        url,
        timestamp: new Date().toISOString(),
        steps: [],
        screenshots: [],
        errors: [error.message],
        success: false
      };

      this.results.push(errorResult);
      this.broadcast({
        type: 'test-failed',
        error: error.message,
        result: errorResult
      });

      throw error;
    } finally {
      // Clean up the test page
      if (testPage) {
        try {
          await testPage.close();
        } catch (closeError) {
          console.log(`⚠️ Warning: Failed to close test page: ${closeError.message}`);
        }
      }
      
      this.isRunning = false;
      this.broadcast({ type: 'test-finished' });
    }
  }

  async runBrowserCompatibilityTest() {
    this.isRunning = true;
    this.broadcast({ type: 'test-started', testName: 'Browser Compatibility Test', url: 'Chrome/Chromium Detection' });

    try {
      await this.startBrowser();

      const testResult = {
        name: 'Browser Compatibility Test',
        url: 'Chrome/Chromium Detection',
        timestamp: new Date().toISOString(),
        steps: [],
        screenshots: [],
        errors: [],
        success: false
      };

      // Step 1: Check browser version
      this.broadcast({ type: 'step', message: 'Checking browser version...' });
      const userAgent = await this.page.evaluate(() => navigator.userAgent);
      const browserVersion = await this.browser.version();
      
      testResult.steps.push({
        step: 'Browser Detection',
        status: 'passed',
        details: `User Agent: ${userAgent}\nBrowser Version: ${browserVersion}`,
        timestamp: new Date().toISOString()
      });

      // Step 2: Check Chrome DevTools Protocol
      this.broadcast({ type: 'step', message: 'Testing Chrome DevTools Protocol...' });
      try {
        const client = await this.page.target().createCDPSession();
        await client.send('Runtime.enable');
        const result = await client.send('Runtime.evaluate', {
          expression: 'navigator.userAgent'
        });
        
        testResult.steps.push({
          step: 'DevTools Protocol',
          status: 'passed',
          details: `CDP Session: Active\nResult: ${result.result.value}`,
          timestamp: new Date().toISOString()
        });
        
        await client.detach();
      } catch (cdpError) {
        testResult.steps.push({
          step: 'DevTools Protocol',
          status: 'failed',
          details: `CDP Error: ${cdpError.message}`,
          timestamp: new Date().toISOString()
        });
      }

      // Step 3: Test JavaScript execution
      this.broadcast({ type: 'step', message: 'Testing JavaScript execution...' });
      const jsResult = await this.page.evaluate(() => {
        return {
          chrome: typeof window.chrome !== 'undefined',
          webdriver: navigator.webdriver,
          languages: navigator.languages,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        };
      });

      testResult.steps.push({
        step: 'JavaScript Execution',
        status: 'passed',
        details: `Chrome API: ${jsResult.chrome}\nWebDriver: ${jsResult.webdriver}\nPlatform: ${jsResult.platform}\nOnline: ${jsResult.onLine}`,
        timestamp: new Date().toISOString()
      });

      // Step 4: Test screenshot capability
      this.broadcast({ type: 'step', message: 'Testing screenshot capability...' });
      const screenshotPath = `debug/browser-compat-${Date.now()}.png`;
      await this.page.setContent(`
        <html>
          <body style="font-family: Arial; padding: 20px; background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);">
            <h1 style="color: white; text-align: center;">🚀 Puppeteer Browser Compatibility Test</h1>
            <div style="background: white; margin: 20px; padding: 20px; border-radius: 10px;">
              <h2>✅ Browser Successfully Detected</h2>
              <p><strong>User Agent:</strong> ${userAgent}</p>
              <p><strong>Browser Version:</strong> ${browserVersion}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>Chrome API Available:</strong> ${jsResult.chrome ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Platform:</strong> ${jsResult.platform}</p>
            </div>
          </body>
        </html>
      `);
      
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      testResult.screenshots.push(screenshotPath);
      this.screenshots.push({
        path: screenshotPath,
        name: 'Browser Compatibility Test',
        timestamp: new Date().toISOString()
      });

      this.broadcast({ 
        type: 'screenshot', 
        path: screenshotPath,
        name: 'Browser Compatibility Test'
      });

      testResult.steps.push({
        step: 'Screenshot Test',
        status: 'passed',
        details: `Screenshot saved: ${screenshotPath}`,
        timestamp: new Date().toISOString()
      });

      // Final result
      testResult.success = true;
      this.results.push(testResult);
      this.broadcast({ type: 'result', result: testResult });
      this.broadcast({ type: 'success', message: '✅ Browser compatibility test completed successfully!' });

      return testResult;

    } catch (error) {
      const errorMsg = `Browser compatibility test failed: ${error.message}`;
      this.broadcast({ type: 'error', message: errorMsg });
      console.error('Browser compatibility test error:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.broadcast({ type: 'test-finished' });
    }
  }

  generateHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Puppeteer Testing UI - A Whittle Wandering</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a; color: #f1f5f9; line-height: 1.6;
        }
        .header { 
            background: #1e293b; padding: 1rem; border-bottom: 1px solid #334155;
            display: flex; justify-content: space-between; align-items: center;
        }
        .header h1 { color: #3b82f6; }
        .status { 
            display: flex; gap: 1rem; align-items: center; font-size: 0.9rem;
        }
        .status-dot { 
            width: 8px; height: 8px; border-radius: 50%; 
            background: #ef4444; animation: pulse 2s infinite;
        }
        .status-dot.connected { background: #10b981; }
        .main { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; }
        .panel { 
            background: #1e293b; border-radius: 8px; padding: 1rem;
            border: 1px solid #334155;
        }
        .panel h2 { color: #3b82f6; margin-bottom: 1rem; }
        .controls { display: flex; flex-direction: column; gap: 1rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { color: #94a3b8; font-size: 0.9rem; }
        .input-group input { 
            padding: 0.5rem; border-radius: 4px; border: 1px solid #475569;
            background: #334155; color: #f1f5f9;
        }
        .btn { 
            padding: 0.75rem 1rem; border: none; border-radius: 4px;
            background: #3b82f6; color: white; cursor: pointer;
            font-weight: 500; transition: background 0.2s;
        }
        .btn:hover { background: #2563eb; }
        .btn:disabled { background: #475569; cursor: not-allowed; }
        .log { 
            background: #0f172a; border-radius: 4px; padding: 1rem;
            height: 300px; overflow-y: auto; font-family: 'Monaco', monospace;
            font-size: 0.8rem; border: 1px solid #334155;
        }
        .log-entry { 
            margin-bottom: 0.5rem; padding: 0.25rem 0;
            border-bottom: 1px solid #1e293b;
        }
        .log-entry.error { color: #ef4444; }
        .log-entry.success { color: #10b981; }
        .log-entry.info { color: #3b82f6; }
        .results { max-height: 400px; overflow-y: auto; }
        .result-item { 
            background: #0f172a; border-radius: 4px; padding: 0.75rem;
            margin-bottom: 0.5rem; border: 1px solid #334155;
        }
        .result-header { 
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 0.5rem;
        }
        .result-status { 
            padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;
        }
        .result-status.success { background: #065f46; color: #10b981; }
        .result-status.failed { background: #7f1d1d; color: #ef4444; }
        .steps { font-size: 0.8rem; }
        .step { 
            display: flex; justify-content: space-between; padding: 0.25rem 0;
            border-bottom: 1px solid #1e293b;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .screenshot { 
            background: #0f172a; border-radius: 4px; padding: 0.5rem;
            border: 1px solid #334155; text-align: center;
        }
        .screenshot img { max-width: 100%; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Puppeteer Testing Dashboard</h1>
        <div class="status">
            <div class="status-dot" id="connection-status"></div>
            <span id="status-text">Connecting...</span>
            <span id="browser-status">Browser: Closed</span>
        </div>
    </div>

    <div class="main">
        <div class="panel">
            <h2>🎮 Test Controls</h2>
            <div class="controls">
                <div class="input-group">
                    <label>Test URL:</label>
                    <input type="text" id="test-url" value="http://localhost:8080" placeholder="Enter URL to test">
                </div>
                <div class="input-group">
                    <label>Test Name:</label>
                    <input type="text" id="test-name" value="Dev Site Test" placeholder="Test description">
                </div>
                <button class="btn" id="run-test" onclick="runTest()">🚀 Run Test</button>
                <button class="btn" id="quick-tests" onclick="runQuickTests()">⚡ Quick Tests</button>
                <button class="btn" id="browser-compat" onclick="runBrowserCompatTest()" style="background: #8b5cf6;">🌐 Browser Compatibility</button>
            </div>
            
            <h3 style="margin-top: 2rem; color: #3b82f6;">🏃‍♂️ Quick Actions</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn" onclick="testUrl('http://localhost:8080')">Local Dev</button>
                <button class="btn" onclick="testUrl('http://localhost:8080')">Alt Port</button>
                <button class="btn" onclick="testUrl('https://81e929d7.awhittlewandering-frontend.pages.dev')">Production</button>
                <button class="btn" onclick="testApi()">API Test</button>
            </div>
        </div>

        <div class="panel">
            <h2>📊 Live Results</h2>
            <div class="results" id="results-container">
                <p style="color: #64748b;">No tests run yet. Click "Run Test" to start.</p>
            </div>
        </div>

        <div class="panel">
            <h2>📋 Live Log</h2>
            <div class="log" id="live-log">
                <div class="log-entry info">[INFO] Puppeteer UI initialized</div>
                <div class="log-entry info">[INFO] Waiting for WebSocket connection...</div>
            </div>
        </div>

        <div class="panel">
            <h2>📸 Screenshots</h2>
            <div class="screenshots" id="screenshots-container">
                <p style="color: #64748b;">Screenshots will appear here after running tests.</p>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        let isConnected = false;

        function connect() {
            ws = new WebSocket('ws://localhost:3001');
            
            ws.onopen = () => {
                isConnected = true;
                updateStatus('connected', 'Connected');
                addLog('WebSocket connected', 'success');
            };

            ws.onclose = () => {
                isConnected = false;
                updateStatus('disconnected', 'Disconnected');
                addLog('WebSocket disconnected', 'error');
                setTimeout(connect, 5000);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };
        }

        function updateStatus(status, text) {
            const dot = document.getElementById('connection-status');
            const statusText = document.getElementById('status-text');
            
            dot.className = 'status-dot ' + (status === 'connected' ? 'connected' : '');
            statusText.textContent = text;
        }

        function addLog(message, type = 'info') {
            const log = document.getElementById('live-log');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            entry.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        function handleMessage(data) {
            switch(data.type) {
                case 'browser-ready':
                    document.getElementById('browser-status').textContent = 'Browser: Open';
                    addLog('Browser ready for testing', 'success');
                    break;
                case 'test-started':
                    addLog(\`Starting test: \${data.testName} on \${data.url}\`, 'info');
                    document.getElementById('run-test').disabled = true;
                    break;
                case 'step':
                    addLog(\`STEP: \${data.message}\`, 'info');
                    break;
                case 'test-completed':
                    addLog(\`Test completed: \${data.result.name}\`, 'success');
                    addResult(data.result);
                    break;
                case 'test-failed':
                    addLog(\`Test failed: \${data.error}\`, 'error');
                    break;
                case 'test-finished':
                    document.getElementById('run-test').disabled = false;
                    break;
                case 'screenshot':
                    addScreenshot(data);
                    break;
                case 'console':
                    addLog(\`CONSOLE[\${data.level}]: \${data.text}\`, data.level === 'error' ? 'error' : 'info');
                    break;
                case 'page-error':
                    addLog(\`PAGE ERROR: \${data.message}\`, 'error');
                    break;
            }
        }

        function addResult(result) {
            const container = document.getElementById('results-container');
            if (container.children.length === 1 && container.children[0].tagName === 'P') {
                container.innerHTML = '';
            }

            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-item';
            
            const stepsHtml = result.steps.map(step => \`
                <div class="step">
                    <span>\${step.step}</span>
                    <span style="color: \${step.status === 'passed' ? '#10b981' : step.status === 'failed' ? '#ef4444' : '#3b82f6'}">\${step.status}</span>
                </div>
            \`).join('');

            resultDiv.innerHTML = \`
                <div class="result-header">
                    <strong>\${result.name}</strong>
                    <span class="result-status \${result.success ? 'success' : 'failed'}">
                        \${result.success ? 'PASSED' : 'FAILED'}
                    </span>
                </div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem;">
                    \${new Date(result.timestamp).toLocaleString()} • \${result.url}
                </div>
                <div class="steps">\${stepsHtml}</div>
            \`;
            
            container.insertBefore(resultDiv, container.firstChild);
        }

        function addScreenshot(data) {
            const container = document.getElementById('screenshots-container');
            if (container.children.length === 1 && container.children[0].tagName === 'P') {
                container.innerHTML = '';
            }

            const screenshotDiv = document.createElement('div');
            screenshotDiv.className = 'screenshot';
            screenshotDiv.innerHTML = \`
                <h4>\${data.name}</h4>
                <p style="font-size: 0.8rem; color: #94a3b8;">\${new Date().toLocaleString()}</p>
                <p style="font-size: 0.8rem; color: #64748b;">Path: \${data.path}</p>
            \`;
            container.appendChild(screenshotDiv);
        }

        function runTest() {
            const url = document.getElementById('test-url').value;
            const name = document.getElementById('test-name').value;
            
            if (ws && isConnected) {
                ws.send(JSON.stringify({
                    type: 'run-test',
                    url: url,
                    testName: name
                }));
            } else {
                addLog('Not connected to server', 'error');
            }
        }

        function runBrowserCompatTest() {
            if (ws && isConnected) {
                addLog('Starting browser compatibility test...', 'info');
                fetch('/api/browser-compat-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }).then(response => response.json())
                  .then(data => {
                    if (data.success) {
                        addLog('✅ Browser compatibility test initiated', 'success');
                    } else {
                        addLog('❌ Browser compatibility test failed', 'error');
                    }
                  }).catch(err => {
                    addLog(\`❌ Error: \${err.message}\`, 'error');
                  });
            } else {
                addLog('Not connected to server', 'error');
            }
        }

        function testUrl(url) {
            document.getElementById('test-url').value = url;
            document.getElementById('test-name').value = \`Test: \${url}\`;
            runTest();
        }

        function testApi() {
            testUrl('https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/health');
        }

        function runQuickTests() {
            const tests = [
                'http://localhost:8080',
                'http://localhost:8080', 
                'https://81e929d7.awhittlewandering-frontend.pages.dev'
            ];
            
            tests.forEach((url, index) => {
                setTimeout(() => {
                    testUrl(url);
                }, index * 5000);
            });
        }

        // Initialize connection
        connect();
    </script>
</body>
</html>`;
  }

  async stop() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    this.server.close();
  }
}

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const ui = new PuppeteerWebUI();
  
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Puppeteer UI...');
    await ui.stop();
    process.exit(0);
  });

  ui.init().catch(console.error);
}

export { PuppeteerWebUI };
