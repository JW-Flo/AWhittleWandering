#!/usr/bin/env node

/**
 * Chrome/Chromium Detection Test
 * Verifies that Puppeteer can find and use Chrome properly
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function testChromeDetection() {
  console.log('🔍 Testing Chrome/Chromium Detection...\n');

  // Check for Chrome executable paths
  const possiblePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];

  console.log('📂 Checking for Chrome/Chromium installations:');
  let foundPath = null;
  for (const path of possiblePaths) {
    const exists = fs.existsSync(path);
    console.log(`  ${exists ? '✅' : '❌'} ${path}`);
    if (exists && !foundPath) {
      foundPath = path;
    }
  }

  console.log('\n🚀 Launching Puppeteer with detected configuration...');

  const launchOptions = {
    headless: false,
    devtools: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=800,600'
    ]
  };

  if (foundPath) {
    launchOptions.executablePath = foundPath;
    console.log(`🔧 Using Chrome at: ${foundPath}`);
  } else {
    console.log('🔧 Using default Puppeteer Chromium');
  }

  try {
    const browser = await puppeteer.launch(launchOptions);
    const version = await browser.version();
    console.log(`✅ Browser launched successfully!`);
    console.log(`📋 Version: ${version}`);

    const page = await browser.newPage();
    
    // Test basic functionality
    await page.goto('data:text/html,<h1>Puppeteer Test Success!</h1><p>Chrome/Chromium is working correctly.</p>');
    
    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log(`🌐 User Agent: ${userAgent}`);

    const jsResult = await page.evaluate(() => ({
      chrome: typeof window.chrome !== 'undefined',
      webdriver: navigator.webdriver,
      platform: navigator.platform
    }));

    console.log(`🔧 Chrome API Available: ${jsResult.chrome ? '✅ Yes' : '❌ No'}`);
    console.log(`🤖 WebDriver: ${jsResult.webdriver}`);
    console.log(`💻 Platform: ${jsResult.platform}`);

    // Take a test screenshot
    await page.screenshot({ path: 'debug/chrome-test.png' });
    console.log('📸 Test screenshot saved to: debug/chrome-test.png');

    console.log('\n🎉 Chrome/Chromium detection test completed successfully!');
    
    // Keep browser open for 3 seconds to verify visually
    setTimeout(async () => {
      await browser.close();
      console.log('🛑 Browser closed.');
    }, 3000);

  } catch (error) {
    console.error('❌ Browser launch failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('  • Make sure Chrome or Chromium is installed');
    console.error('  • Check if any security software is blocking browser launch');
    console.error('  • Try running with sudo if on Linux');
    console.error('  • Verify no other instances of Chrome are running');
  }
}

testChromeDetection().catch(console.error);
