const puppeteer = require('puppeteer');

async function qaPlatformContent() {
  console.log('🚀 Starting QA: Platform Content Verification\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set longer timeout for page loads
    page.setDefaultTimeout(30000);

    console.log('📱 Testing Frontend: https://e3300f83.awhittlewandering-frontend.pages.dev');

    // Test frontend loading
    await page.goto('https://e3300f83.awhittlewandering-frontend.pages.dev', {
      waitUntil: 'networkidle0'
    });

    // Check page title
    const title = await page.title();
    console.log(`✅ Page Title: "${title}"`);

    // Check if React app loaded
    const hasReactRoot = await page.$('#root');
    console.log(`✅ React Root Element: ${hasReactRoot ? 'Found' : 'Missing'}`);

    // Check for basic content
    const content = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.length : 0;
    });
    console.log(`✅ Root Content Length: ${content} characters`);

    // Check for meta tags
    const metaDescription = await page.$eval('meta[name="description"]', el => el.content);
    console.log(`✅ Meta Description: "${metaDescription}"`);

    // Check for Open Graph tags
    const ogTitle = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:title"]');
      return og ? og.content : null;
    });
    console.log(`✅ Open Graph Title: "${ogTitle}"`);

    // Check for script loading
    const scripts = await page.$$eval('script[src]', scripts =>
      scripts.map(script => script.src).filter(src => src.includes('assets'))
    );
    console.log(`✅ Asset Scripts Loaded: ${scripts.length}`);

    console.log('\n📊 Testing API Endpoints...\n');

    // Test API endpoints
    const apiTests = [
      { name: 'Health Check', url: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health' },
      { name: 'Unified Data', url: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/unified-data' },
      { name: 'Config', url: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/config' }
    ];

    for (const test of apiTests) {
      try {
        const response = await page.evaluate(async (url) => {
          const res = await fetch(url);
          const data = await res.json();
          return {
            status: res.status,
            ok: res.ok,
            data: data
          };
        }, test.url);

        console.log(`✅ ${test.name}: HTTP ${response.status} ${response.ok ? 'OK' : 'FAILED'}`);

        if (test.name === 'Health Check') {
          console.log(`   Status: ${response.data.status}`);
          console.log(`   Service: ${response.data.service}`);
          console.log(`   Version: ${response.data.version}`);
        } else if (test.name === 'Unified Data') {
          console.log(`   Trip Name: ${response.data.overview?.tripName}`);
          console.log(`   Vehicle: ${response.data.overview?.vehicle}`);
          console.log(`   Days Elapsed: ${response.data.overview?.daysElapsed}`);
          console.log(`   Tessie Connected: ${response.data.tessieStatus?.connected}`);
        } else if (test.name === 'Config') {
          console.log(`   App Name: ${response.data.appName}`);
          console.log(`   API Version: ${response.data.apiVersion}`);
          console.log(`   Live Tesla Data: ${response.data.features?.liveTeslaData}`);
        }

      } catch (error) {
        console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      }
    }

    console.log('\n🎯 Testing Frontend-Backend Integration...\n');

    // Test if frontend can make API calls
    const apiCallTest = await page.evaluate(async () => {
      try {
        // Try to make a fetch call to our API
        const response = await fetch('https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health');
        const data = await response.json();
        return { success: true, status: response.status, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    if (apiCallTest.success) {
      console.log('✅ Frontend can reach API');
      console.log(`   API Response Status: ${apiCallTest.status}`);
      console.log(`   API Status: ${apiCallTest.data.status}`);
    } else {
      console.log('❌ Frontend cannot reach API');
      console.log(`   Error: ${apiCallTest.error}`);
    }

    // Take screenshot for verification
    await page.screenshot({ path: 'debug/qa-platform-verification.png', fullPage: true });
    console.log('📸 Screenshot saved: debug/qa-platform-verification.png');

    console.log('\n🎉 QA Complete: Platform Content Verification');

  } catch (error) {
    console.error('❌ QA Failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the QA
qaPlatformContent().catch(console.error);