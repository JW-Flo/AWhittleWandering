#!/usr/bin/env node
/**
 * Comprehensive Platform Functionality Audit
 * Tests every API endpoint, function, data point, and component
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use native fetch if available (Node 18+), otherwise require node-fetch
let fetch;
try {
  // Try native fetch first
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
  } else {
    // Fallback to node-fetch
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default || nodeFetch;
  }
} catch (e) {
  // If node-fetch not available, use native fetch
  fetch = globalThis.fetch;
}

const API_BASE_URL = process.env.API_BASE_URL || 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const results = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  endpoints: [],
  functions: [],
  dataPoints: [],
  integrations: [],
  components: [],
  errors: []
};

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function recordTest(category, name, status, details = {}) {
  const test = {
    category,
    name,
    status, // 'pass', 'fail', 'warning'
    details,
    timestamp: new Date().toISOString()
  };
  
  results.summary.total++;
  if (status === 'pass') results.summary.passed++;
  else if (status === 'fail') results.summary.failed++;
  else if (status === 'warning') results.summary.warnings++;
  
  if (category === 'endpoint') results.endpoints.push(test);
  else if (category === 'function') results.functions.push(test);
  else if (category === 'data') results.dataPoints.push(test);
  else if (category === 'integration') results.integrations.push(test);
  else if (category === 'component') results.components.push(test);
  
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  log(`${icon} [${category.toUpperCase()}] ${name}: ${status}`, 
      status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow');
  
  if (details.error) {
    log(`   Error: ${details.error}`, 'red');
    results.errors.push({ category, name, error: details.error });
  }
  if (details.warning) {
    log(`   Warning: ${details.warning}`, 'yellow');
  }
}

async function testEndpoint(method, path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(ADMIN_TOKEN && { 'X-Admin-Token': ADMIN_TOKEN }),
        ...(options.headers || {})
      },
      ...(options.body && { body: JSON.stringify(options.body) })
    });
    
    const responseTime = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    let data;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (e) {
      data = null;
    }
    
    const success = response.ok && (options.expectedStatus ? response.status === options.expectedStatus : true);
    
    return {
      success,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// ============================================
// API ENDPOINT TESTS
// ============================================

async function testEndpoints() {
  log('\n🔍 Testing API Endpoints...', 'cyan');
  
  // Root endpoint
  const root = await testEndpoint('GET', '/');
  recordTest('endpoint', 'GET /', root.success ? 'pass' : 'fail', {
    status: root.status,
    responseTime: root.responseTime,
    hasEndpoints: root.data?.endpoints ? 'yes' : 'no',
    error: root.error
  });
  
  // Health endpoints
  const health = await testEndpoint('GET', '/api/v1/health');
  recordTest('endpoint', 'GET /api/v1/health', health.success ? 'pass' : 'fail', {
    status: health.status,
    responseTime: health.responseTime,
    statusValue: health.data?.status,
    resources: health.data?.resources,
    warnings: health.data?.warnings,
    error: health.error
  });
  
  const healthSimple = await testEndpoint('GET', '/health');
  recordTest('endpoint', 'GET /health', healthSimple.success ? 'pass' : 'fail', {
    status: healthSimple.status,
    responseTime: healthSimple.responseTime,
    error: healthSimple.error
  });
  
  // Unified Data endpoint
  const unified = await testEndpoint('GET', '/api/v1/unified-data');
  recordTest('endpoint', 'GET /api/v1/unified-data', unified.success ? 'pass' : 'fail', {
    status: unified.status,
    responseTime: unified.responseTime,
    hasVehicle: !!unified.data?.vehicle,
    hasJourney: !!unified.data?.journey,
    hasSegments: Array.isArray(unified.data?.segments),
    segmentCount: unified.data?.segments?.length || 0,
    error: unified.error
  });
  
  // Unified Data with revalidate
  const unifiedRevalidate = await testEndpoint('GET', '/api/v1/unified-data?revalidate=true');
  recordTest('endpoint', 'GET /api/v1/unified-data?revalidate=true', unifiedRevalidate.success ? 'pass' : 'fail', {
    status: unifiedRevalidate.status,
    responseTime: unifiedRevalidate.responseTime,
    error: unifiedRevalidate.error
  });
  
  // Telemetry endpoints
  const telemetryStatus = await testEndpoint('GET', '/api/v1/telemetry/status');
  recordTest('endpoint', 'GET /api/v1/telemetry/status', telemetryStatus.success ? 'pass' : 'fail', {
    status: telemetryStatus.status,
    responseTime: telemetryStatus.responseTime,
    hasDrives: telemetryStatus.data?.drives !== undefined,
    hasCharges: telemetryStatus.data?.charges !== undefined,
    error: telemetryStatus.error
  });
  
  const telemetryPost = await testEndpoint('POST', '/api/v1/telemetry', {
    body: {
      vin: 'TEST_VIN',
      timestamp: new Date().toISOString(),
      battery_level: 80,
      latitude: 41.1669,
      longitude: -73.3891
    }
  });
  recordTest('endpoint', 'POST /api/v1/telemetry', telemetryPost.success ? 'pass' : 'fail', {
    status: telemetryPost.status,
    responseTime: telemetryPost.responseTime,
    acknowledged: telemetryPost.data?.ok,
    error: telemetryPost.error
  });
  
  // Trip Status endpoints
  const tripStatus = await testEndpoint('GET', '/api/v1/trip-status');
  recordTest('endpoint', 'GET /api/v1/trip-status', tripStatus.success ? 'pass' : 'fail', {
    status: tripStatus.status,
    responseTime: tripStatus.responseTime,
    hasTripId: !!tripStatus.data?.tripId,
    hasStatus: !!tripStatus.data?.status,
    error: tripStatus.error
  });
  
  const tripConfig = await testEndpoint('GET', '/api/v1/trip-status/config');
  recordTest('endpoint', 'GET /api/v1/trip-status/config', tripConfig.success ? 'pass' : 'fail', {
    status: tripConfig.status,
    responseTime: tripConfig.responseTime,
    hasFeatures: !!tripConfig.data?.features,
    hasMapboxToken: tripConfig.data?.mapboxToken !== undefined,
    error: tripConfig.error
  });
  
  // Admin endpoints
  const adminStatus = await testEndpoint('GET', '/api/v1/admin/status');
  recordTest('endpoint', 'GET /api/v1/admin/status', adminStatus.success ? 'pass' : 'fail', {
    status: adminStatus.status,
    responseTime: adminStatus.responseTime,
    dbAvailable: adminStatus.data?.dbAvailable,
    tessieConfigured: adminStatus.data?.tessieConfigured,
    error: adminStatus.error
  });
  
  const adminCacheClear = await testEndpoint('POST', '/api/v1/admin/cache/clear');
  recordTest('endpoint', 'POST /api/v1/admin/cache/clear', adminCacheClear.success ? 'pass' : 'fail', {
    status: adminCacheClear.status,
    responseTime: adminCacheClear.responseTime,
    success: adminCacheClear.data?.success,
    error: adminCacheClear.error
  });
  
  const adminCronMetrics = await testEndpoint('GET', '/api/v1/admin/cron/metrics');
  recordTest('endpoint', 'GET /api/v1/admin/cron/metrics', adminCronMetrics.success ? 'pass' : 'fail', {
    status: adminCronMetrics.status,
    responseTime: adminCronMetrics.responseTime,
    hasMetrics: adminCronMetrics.data?.ok,
    metricCount: adminCronMetrics.data?.count,
    error: adminCronMetrics.error
  });
  
  // Config endpoint
  const config = await testEndpoint('GET', '/api/v1/config');
  recordTest('endpoint', 'GET /api/v1/config', config.success ? 'pass' : 'fail', {
    status: config.status,
    responseTime: config.responseTime,
    hasFeatures: !!config.data?.features,
    hasApiVersion: !!config.data?.apiVersion,
    error: config.error
  });
  
  // Legacy endpoints
  const legacyUnified = await testEndpoint('GET', '/unified-data');
  recordTest('endpoint', 'GET /unified-data (legacy)', legacyUnified.status === 308 || legacyUnified.success ? 'pass' : 'fail', {
    status: legacyUnified.status,
    isRedirect: legacyUnified.status === 308,
    error: legacyUnified.error
  });
  
  const legacyTripStatus = await testEndpoint('GET', '/trip-status');
  recordTest('endpoint', 'GET /trip-status (legacy)', legacyTripStatus.status === 308 || legacyTripStatus.success ? 'pass' : 'fail', {
    status: legacyTripStatus.status,
    isRedirect: legacyTripStatus.status === 308,
    error: legacyTripStatus.error
  });
  
  // Auth endpoints
  const authLogin = await testEndpoint('POST', '/api/v1/auth', {
    body: { action: 'login', username: 'test', password: 'test123' }
  });
  recordTest('endpoint', 'POST /api/v1/auth (login)', authLogin.success ? 'pass' : 'fail', {
    status: authLogin.status,
    responseTime: authLogin.responseTime,
    acknowledged: authLogin.data?.ok,
    error: authLogin.error
  });
  
  const authRegister = await testEndpoint('POST', '/api/v1/auth', {
    body: { action: 'register', username: 'test', password: 'test123' }
  });
  recordTest('endpoint', 'POST /api/v1/auth (register)', authRegister.success ? 'pass' : 'fail', {
    status: authRegister.status,
    responseTime: authRegister.responseTime,
    acknowledged: authRegister.data?.ok,
    error: authRegister.error
  });
  
  // Legacy /drop endpoint
  const drop = await testEndpoint('POST', '/drop', {
    body: { action: 'login' }
  });
  recordTest('endpoint', 'POST /drop (legacy)', drop.success ? 'pass' : 'fail', {
    status: drop.status,
    responseTime: drop.responseTime,
    hasDeprecation: drop.headers['deprecation'] === 'true',
    error: drop.error
  });
  
  // Joiner endpoint
  const joiner = await testEndpoint('POST', '/api/joiner');
  recordTest('endpoint', 'POST /api/joiner', joiner.success ? 'pass' : 'fail', {
    status: joiner.status,
    responseTime: joiner.responseTime,
    hasUserId: !!joiner.data?.userId,
    hasLog: Array.isArray(joiner.data?.log),
    error: joiner.error
  });
  
  // Connectors endpoint
  const connectors = await testEndpoint('GET', '/api/connectors');
  recordTest('endpoint', 'GET /api/connectors', connectors.success ? 'pass' : 'fail', {
    status: connectors.status,
    responseTime: connectors.responseTime,
    hasConnectors: Array.isArray(connectors.data?.connectors),
    connectorCount: connectors.data?.connectors?.length || 0,
    error: connectors.error
  });
}

// ============================================
// DATA POINT TESTS
// ============================================

async function testDataPoints() {
  log('\n📊 Testing Data Points...', 'cyan');
  
  // Test unified data structure
  const unified = await testEndpoint('GET', '/api/v1/unified-data');
  if (unified.success && unified.data) {
    const data = unified.data;
    
    // Vehicle data
    if (data.vehicle) {
      recordTest('data', 'Vehicle Data Available', 'pass', {
        hasVin: !!data.vehicle.vin,
        hasLocation: !!data.vehicle.location,
        hasBattery: !!data.vehicle.battery,
        hasState: !!data.vehicle.state
      });
      
      if (data.vehicle.location) {
        recordTest('data', 'Vehicle Location Coordinates', 
          (data.vehicle.location.latitude && data.vehicle.location.longitude) ? 'pass' : 'warning', {
          latitude: data.vehicle.location.latitude,
          longitude: data.vehicle.location.longitude,
          warning: (!data.vehicle.location.latitude || !data.vehicle.location.longitude) ? 'Missing coordinates' : undefined
        });
      }
      
      if (data.vehicle.battery) {
        recordTest('data', 'Vehicle Battery Data', 
          (data.vehicle.battery.level !== undefined && data.vehicle.battery.range !== undefined) ? 'pass' : 'warning', {
          level: data.vehicle.battery.level,
          range: data.vehicle.battery.range,
          warning: (data.vehicle.battery.level === undefined || data.vehicle.battery.range === undefined) ? 'Missing battery data' : undefined
        });
      }
    } else {
      recordTest('data', 'Vehicle Data Available', 'warning', {
        warning: 'No vehicle data in response'
      });
    }
    
    // Journey data
    if (data.journey) {
      recordTest('data', 'Journey Data Available', 'pass', {
        hasId: !!data.journey.id,
        hasName: !!data.journey.name,
        hasStatus: !!data.journey.status,
        hasStats: !!data.journey.stats
      });
      
      if (data.journey.stats) {
        recordTest('data', 'Journey Statistics', 'pass', {
          totalMiles: data.journey.stats.totalMiles,
          statesVisited: data.journey.stats.statesVisited,
          totalDrives: data.journey.stats.totalDrives,
          totalCharges: data.journey.stats.totalCharges
        });
      }
    }
    
    // Segments data
    if (Array.isArray(data.segments)) {
      recordTest('data', 'Drive Segments Available', data.segments.length > 0 ? 'pass' : 'warning', {
        segmentCount: data.segments.length,
        warning: data.segments.length === 0 ? 'No segments found' : undefined
      });
      
      if (data.segments.length > 0) {
        const firstSegment = data.segments[0];
        recordTest('data', 'Segment Data Structure', 
          (firstSegment.id && firstSegment.startTime && firstSegment.distance !== undefined) ? 'pass' : 'warning', {
          hasId: !!firstSegment.id,
          hasStartTime: !!firstSegment.startTime,
          hasDistance: firstSegment.distance !== undefined,
          hasLocation: !!firstSegment.startLocation,
          warning: (!firstSegment.id || !firstSegment.startTime || firstSegment.distance === undefined) ? 'Incomplete segment data' : undefined
        });
      }
    }
    
    // Milestones data
    if (Array.isArray(data.milestones)) {
      recordTest('data', 'Milestones Available', 'pass', {
        milestoneCount: data.milestones.length
      });
    }
  }
  
  // Test telemetry status data
  const telemetry = await testEndpoint('GET', '/api/v1/telemetry/status');
  if (telemetry.success && telemetry.data) {
    recordTest('data', 'Telemetry Statistics', 'pass', {
      drives: telemetry.data.drives,
      charges: telemetry.data.charges,
      statesVisited: telemetry.data.statesVisited,
      lastDriveAt: telemetry.data.lastDriveAt,
      lastChargeAt: telemetry.data.lastChargeAt
    });
  }
  
  // Test health data
  const health = await testEndpoint('GET', '/api/v1/health');
  if (health.success && health.data) {
    recordTest('data', 'Health Check Data', 'pass', {
      status: health.data.status,
      resources: health.data.resources,
      ingestion: health.data.ingestion ? 'available' : 'missing',
      performance: health.data.performance ? 'available' : 'missing'
    });
    
    if (health.data.ingestion) {
      recordTest('data', 'Data Ingestion Metrics', 'pass', {
        vehicleStateAge: health.data.ingestion.vehicleState?.ageSeconds,
        driveDataAge: health.data.ingestion.drives?.ageSeconds,
        chargeDataAge: health.data.ingestion.charges?.ageSeconds,
        statesVisited: health.data.ingestion.statesVisited
      });
    }
    
    if (health.data.resources) {
      recordTest('data', 'Resource Availability', 
        (health.data.resources.d1_database === 'operational' && health.data.resources.r2_storage === 'operational') ? 'pass' : 'warning', {
        d1Database: health.data.resources.d1_database,
        r2Storage: health.data.resources.r2_storage,
        analyticsEngine: health.data.resources.analytics_engine,
        queueSystem: health.data.resources.queue_system,
        warning: (health.data.resources.d1_database !== 'operational' || health.data.resources.r2_storage !== 'operational') ? 'Some resources not operational' : undefined
      });
    }
  }
}

// ============================================
// INTEGRATION TESTS
// ============================================

async function testIntegrations() {
  log('\n🔌 Testing External Integrations...', 'cyan');
  
  // Test Tessie API integration (via health check)
  const health = await testEndpoint('GET', '/api/v1/health');
  if (health.success && health.data) {
    const tessieConfigured = health.data.resources?.tessie_api || 
                            (await testEndpoint('GET', '/api/v1/admin/status')).data?.tessieConfigured;
    
    recordTest('integration', 'Tessie API Configuration', tessieConfigured ? 'pass' : 'warning', {
      configured: tessieConfigured,
      warning: !tessieConfigured ? 'Tessie API not configured' : undefined
    });
  }
  
  // Test Mapbox integration (via config)
  const config = await testEndpoint('GET', '/api/v1/trip-status/config');
  if (config.success && config.data) {
    const mapboxConfigured = config.data.mapboxToken !== null && config.data.mapboxToken !== undefined;
    recordTest('integration', 'Mapbox Integration', mapboxConfigured ? 'pass' : 'warning', {
      configured: mapboxConfigured,
      hasToken: config.data.mapboxToken !== null,
      warning: !mapboxConfigured ? 'Mapbox token not configured' : undefined
    });
  }
  
  // Test database connectivity
  const adminStatus = await testEndpoint('GET', '/api/v1/admin/status');
  if (adminStatus.success && adminStatus.data) {
    recordTest('integration', 'D1 Database Connectivity', adminStatus.data.dbAvailable ? 'pass' : 'fail', {
      available: adminStatus.data.dbAvailable,
      error: !adminStatus.data.dbAvailable ? 'Database not available' : undefined
    });
  }
  
  // Test cache functionality
  const cacheClear = await testEndpoint('POST', '/api/v1/admin/cache/clear');
  recordTest('integration', 'Cache System', cacheClear.success ? 'pass' : 'warning', {
    functional: cacheClear.success,
    warning: !cacheClear.success ? 'Cache clear failed' : undefined
  });
}

// ============================================
// FUNCTION TESTS
// ============================================

async function testFunctions() {
  log('\n⚙️  Testing Core Functions...', 'cyan');
  
  // Test caching with revalidate
  const unified1 = await testEndpoint('GET', '/api/v1/unified-data');
  const unified2 = await testEndpoint('GET', '/api/v1/unified-data');
  const unified3 = await testEndpoint('GET', '/api/v1/unified-data?revalidate=true');
  
  recordTest('function', 'Response Caching', 
    (unified1.responseTime && unified2.responseTime && unified2.responseTime < unified3.responseTime) ? 'pass' : 'warning', {
    firstRequest: unified1.responseTime,
    cachedRequest: unified2.responseTime,
    revalidatedRequest: unified3.responseTime,
    cacheWorking: unified2.responseTime < unified3.responseTime,
    warning: unified2.responseTime >= unified3.responseTime ? 'Cache may not be working optimally' : undefined
  });
  
  // Test error handling
  const invalidTelemetry = await testEndpoint('POST', '/api/v1/telemetry', {
    body: { invalid: 'data' }
  });
  recordTest('function', 'Error Handling', invalidTelemetry.status === 400 ? 'pass' : 'fail', {
    status: invalidTelemetry.status,
    hasError: !!invalidTelemetry.data?.error,
    error: invalidTelemetry.status !== 400 ? 'Expected 400 for invalid data' : undefined
  });
  
  // Test CORS headers
  const corsTest = await testEndpoint('GET', '/api/v1/health', {
    headers: { 'Origin': 'https://awhittlewandering.com' }
  });
  recordTest('function', 'CORS Headers', corsTest.headers['access-control-allow-origin'] ? 'pass' : 'warning', {
    hasCorsHeader: !!corsTest.headers['access-control-allow-origin'],
    warning: !corsTest.headers['access-control-allow-origin'] ? 'CORS headers not present' : undefined
  });
  
  // Test rate limiting (if applicable)
  const rateLimitTest = await Promise.all([
    testEndpoint('GET', '/api/v1/health'),
    testEndpoint('GET', '/api/v1/health'),
    testEndpoint('GET', '/api/v1/health'),
    testEndpoint('GET', '/api/v1/health'),
    testEndpoint('GET', '/api/v1/health')
  ]);
  
  const allSuccessful = rateLimitTest.every(r => r.success);
  recordTest('function', 'Rate Limiting', allSuccessful ? 'pass' : 'warning', {
    allRequestsSuccessful: allSuccessful,
    failedRequests: rateLimitTest.filter(r => !r.success).length,
    warning: !allSuccessful ? 'Some requests failed (may indicate rate limiting)' : undefined
  });
}

// ============================================
// COMPONENT TESTS (Frontend)
// ============================================

async function testComponents() {
  log('\n🎨 Testing Frontend Components...', 'cyan');
  
  // Check if frontend files exist
  const frontendPath = join(process.cwd(), 'frontend', 'src');
  
  const components = [
    'App.tsx',
    'components',
    'hooks',
    'services',
    'pages'
  ];
  
  for (const component of components) {
    const path = join(frontendPath, component);
    const exists = existsSync(path);
    recordTest('component', `Frontend ${component}`, exists ? 'pass' : 'fail', {
      exists,
      path,
      error: !exists ? `Component ${component} not found` : undefined
    });
  }
  
  // Test API configuration
  const config = await testEndpoint('GET', '/api/v1/config');
  if (config.success && config.data) {
    recordTest('component', 'API Configuration Available', 'pass', {
      hasFeatures: !!config.data.features,
      hasApiVersion: !!config.data.apiVersion,
      updateInterval: config.data.updateInterval
    });
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  log('\n🚀 Starting Comprehensive Platform Audit...', 'blue');
  log(`API Base URL: ${API_BASE_URL}`, 'cyan');
  log(`Timestamp: ${results.timestamp}\n`, 'cyan');
  
  try {
    await testEndpoints();
    await testDataPoints();
    await testIntegrations();
    await testFunctions();
    await testComponents();
    
    // Generate summary
    log('\n' + '='.repeat(60), 'blue');
    log('📋 AUDIT SUMMARY', 'blue');
    log('='.repeat(60), 'blue');
    log(`Total Tests: ${results.summary.total}`, 'cyan');
    log(`✅ Passed: ${results.summary.passed}`, 'green');
    log(`❌ Failed: ${results.summary.failed}`, 'red');
    log(`⚠️  Warnings: ${results.summary.warnings}`, 'yellow');
    
    const successRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);
    log(`\nSuccess Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
    
    // Save results to file
    const reportPath = join(process.cwd(), 'platform-audit-report.json');
    writeFileSync(reportPath, JSON.stringify(results, null, 2));
    log(`\n📄 Full report saved to: ${reportPath}`, 'cyan');
    
    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    log(`\n❌ Audit failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
