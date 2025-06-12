#!/usr/bin/env node

/**
 * API Testing Suite for 48 Continental Journey
 * Tests individual API endpoints to verify live data connectivity
 */

const https = require('https');
// Use Node.js built-in fetch (Node 18+)
const fetch = globalThis.fetch;

// Color output for terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Test configurations
const API_ENDPOINTS = {
  vehicle: {
    name: 'Tessie Vehicle API',
    url: 'https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/vehicle',
    timeout: 10000,
    expectedFields: ['batteryLevel', 'range', 'latitude', 'longitude', 'speed']
  },
  weather: {
    name: 'Weather API',
    url: 'https://api.openweathermap.org/data/2.5/weather',
    params: 'q=Austin,TX&appid=test&units=imperial',
    timeout: 8000,
    expectedFields: ['main', 'weather', 'name']
  },
  routing: {
    name: 'Mapbox Directions API',
    baseUrl: 'https://api.mapbox.com/directions/v5/mapbox/driving',
    coordinates: '-97.7431,30.2672;-95.3698,29.7604', // Austin to Houston
    timeout: 8000,
    expectedFields: ['routes', 'waypoints']
  }
};

/**
 * Test Vehicle Data API (Tessie via Edge Worker)
 */
async function testVehicleAPI() {
  log('\n🚗 Testing Vehicle Data API (Tessie)', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  try {
    const startTime = Date.now();
    const response = await fetch(API_ENDPOINTS.vehicle.url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'ContinentalUSA-API-Test/1.0'
      },
      timeout: API_ENDPOINTS.vehicle.timeout
    });

    const responseTime = Date.now() - startTime;
    log(`Response Time: ${responseTime}ms`, responseTime < 2000 ? 'green' : 'yellow');
    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'green' : 'red');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for expected fields
    const missingFields = API_ENDPOINTS.vehicle.expectedFields.filter(field => 
      !(field in data) && !(data.location && field in data.location)
    );

    if (missingFields.length === 0) {
      log('✅ All expected fields present', 'green');
    } else {
      log(`⚠️  Missing fields: ${missingFields.join(', ')}`, 'yellow');
    }

    // Display key data
    log('\n📊 Vehicle Data Sample:', 'bold');
    log(`  Battery: ${data.batteryLevel || 'N/A'}%`);
    log(`  Range: ${data.range || 'N/A'} miles`);
    log(`  Speed: ${data.speed || 0} mph`);
    log(`  Location: [${data.latitude || data.location?.latitude || 'N/A'}, ${data.longitude || data.location?.longitude || 'N/A'}]`);
    log(`  Last Updated: ${data.last_updated || 'N/A'}`);

    return {
      success: true,
      responseTime,
      dataFields: Object.keys(data),
      sampleData: {
        battery: data.batteryLevel,
        range: data.range,
        location: [data.latitude || data.location?.latitude, data.longitude || data.location?.longitude]
      }
    };

  } catch (error) {
    log(`❌ Vehicle API Test Failed: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Weather Data API
 */
async function testWeatherAPI() {
  log('\n🌤️  Testing Weather Data API', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  // Note: This would need a real API key for testing
  const apiKey = process.env.OPENWEATHER_API_KEY || 'demo_key';
  const testUrl = `${API_ENDPOINTS.weather.url}?q=Austin,TX&appid=${apiKey}&units=imperial`;

  try {
    const startTime = Date.now();
    const response = await fetch(testUrl, {
      timeout: API_ENDPOINTS.weather.timeout
    });

    const responseTime = Date.now() - startTime;
    log(`Response Time: ${responseTime}ms`, responseTime < 2000 ? 'green' : 'yellow');
    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'green' : 'red');

    if (response.status === 401) {
      log('⚠️  API Key required - set OPENWEATHER_API_KEY environment variable', 'yellow');
      return {
        success: false,
        error: 'API key required',
        needsApiKey: true
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    log('✅ Weather API responding', 'green');
    log('\n📊 Weather Data Sample:', 'bold');
    log(`  Location: ${data.name}, ${data.sys?.country || 'Unknown'}`);
    log(`  Temperature: ${data.main?.temp || 'N/A'}°F`);
    log(`  Conditions: ${data.weather?.[0]?.description || 'N/A'}`);
    log(`  Humidity: ${data.main?.humidity || 'N/A'}%`);

    return {
      success: true,
      responseTime,
      dataFields: Object.keys(data),
      sampleData: {
        location: data.name,
        temperature: data.main?.temp,
        conditions: data.weather?.[0]?.description
      }
    };

  } catch (error) {
    log(`❌ Weather API Test Failed: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Routing/Directions API (Mapbox)
 */
async function testRoutingAPI() {
  log('\n🗺️  Testing Routing/Directions API (Mapbox)', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  // Note: This would need a real Mapbox token for testing
  const mapboxToken = process.env.MAPBOX_TOKEN || 'pk.demo_token';
  const testUrl = `${API_ENDPOINTS.routing.baseUrl}/${API_ENDPOINTS.routing.coordinates}?access_token=${mapboxToken}&geometries=geojson`;

  try {
    const startTime = Date.now();
    const response = await fetch(testUrl, {
      timeout: API_ENDPOINTS.routing.timeout
    });

    const responseTime = Date.now() - startTime;
    log(`Response Time: ${responseTime}ms`, responseTime < 3000 ? 'green' : 'yellow');
    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'green' : 'red');

    if (response.status === 401) {
      log('⚠️  Mapbox token required - set MAPBOX_TOKEN environment variable', 'yellow');
      return {
        success: false,
        error: 'Mapbox token required',
        needsToken: true
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      log('✅ Routing API responding with route data', 'green');
      
      const route = data.routes[0];
      log('\n📊 Route Data Sample:', 'bold');
      log(`  Distance: ${Math.round(route.distance * 0.000621371)} miles`);
      log(`  Duration: ${Math.round(route.duration / 60)} minutes`);
      log(`  Waypoints: ${data.waypoints?.length || 0}`);
      log(`  Geometry Points: ${route.geometry?.coordinates?.length || 0}`);
    } else {
      log('⚠️  No routes returned', 'yellow');
    }

    return {
      success: true,
      responseTime,
      routesFound: data.routes?.length || 0,
      sampleData: data.routes?.[0] ? {
        distance: Math.round(data.routes[0].distance * 0.000621371),
        duration: Math.round(data.routes[0].duration / 60)
      } : null
    };

  } catch (error) {
    log(`❌ Routing API Test Failed: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Trip Itinerary Data (Local CSV/JSON)
 */
async function testItineraryData() {
  log('\n📋 Testing Trip Itinerary Data (Local)', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  const fs = require('fs');
  const path = require('path');

  try {
    // Check for itinerary files
    const dataDir = path.join(__dirname, '../data');
    const files = fs.readdirSync(dataDir).filter(f => 
      f.includes('itinerary') && (f.endsWith('.json') || f.endsWith('.csv'))
    );

    log(`Found ${files.length} itinerary files:`, 'green');
    files.forEach(file => log(`  - ${file}`));

    // Test loading JSON itinerary
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (jsonFiles.length > 0) {
      const itineraryPath = path.join(dataDir, jsonFiles[0]);
      const data = JSON.parse(fs.readFileSync(itineraryPath, 'utf8'));
      
      log('\n📊 Itinerary Data Sample:', 'bold');
      if (Array.isArray(data)) {
        log(`  Total stops: ${data.length}`);
        log(`  First stop: ${data[0]?.city || data[0]?.name}, ${data[0]?.state}`);
        log(`  Last stop: ${data[data.length-1]?.city || data[data.length-1]?.name}, ${data[data.length-1]?.state}`);
      } else {
        log(`  Data structure: ${typeof data}`);
        log(`  Keys: ${Object.keys(data).join(', ')}`);
      }

      return {
        success: true,
        filesFound: files.length,
        stopsCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        sampleData: Array.isArray(data) ? data.slice(0, 3) : data
      };
    } else {
      log('⚠️  No JSON itinerary files found', 'yellow');
      return {
        success: false,
        error: 'No JSON itinerary files found'
      };
    }

  } catch (error) {
    log(`❌ Itinerary Data Test Failed: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main test runner
 */
async function runAPITests() {
  log('🧪 48 Continental API Testing Suite', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');
  log(`Started at: ${new Date().toISOString()}`);

  const results = {};

  // Run all tests
  results.vehicle = await testVehicleAPI();
  results.weather = await testWeatherAPI();
  results.routing = await testRoutingAPI();
  results.itinerary = await testItineraryData();

  // Summary
  log('\n📈 TEST SUMMARY', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  const passed = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;

  log(`Overall: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    log(`  ${test.padEnd(12)}: ${status}`, color);
    
    if (!result.success) {
      log(`    Error: ${result.error}`, 'red');
    }
  });

  // Recommendations
  log('\n💡 RECOMMENDATIONS', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');

  if (!results.vehicle.success) {
    log('  • Vehicle API: Check edge worker deployment and Tessie API credentials');
  }
  if (results.weather.needsApiKey) {
    log('  • Weather API: Set OPENWEATHER_API_KEY environment variable');
  }
  if (results.routing.needsToken) {
    log('  • Routing API: Set MAPBOX_TOKEN environment variable');
  }
  if (!results.itinerary.success) {
    log('  • Itinerary: Ensure data files are present in ../../data/ directory');
  }

  log(`\nCompleted at: ${new Date().toISOString()}`);
  return results;
}

// Run if called directly
if (require.main === module) {
  runAPITests().catch(console.error);
}

module.exports = { runAPITests };
