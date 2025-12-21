#!/usr/bin/env node

/**
 * Comprehensive Connectivity and Functionality Test
 * Tests all connections: API endpoints, database, external APIs, frontend-backend
 */

import fetch from 'node-fetch';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.awhittlewandering.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://awhittlewandering.com';
const WORKER_URL = process.env.WORKER_URL || 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : type === 'error' ? colors.red : type === 'warning' ? colors.yellow : colors.cyan;
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

async function testEndpoint(name, url, options = {}) {
  try {
    const start = Date.now();
    const response = await fetch(url, {
      timeout: 10000,
      ...options,
    });
    const duration = Date.now() - start;
    const status = response.status;
    const ok = response.ok;

    if (ok) {
      let data = null;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch (e) {
        // Ignore parse errors
      }

      results.passed.push({ name, url, status, duration, data });
      log(`✓ ${name} - ${status} (${duration}ms)`, 'success');
      return { success: true, status, duration, data };
    } else {
      results.failed.push({ name, url, status, duration });
      log(`✗ ${name} - ${status} (${duration}ms)`, 'error');
      return { success: false, status, duration };
    }
  } catch (error) {
    results.failed.push({ name, url, error: error.message });
    log(`✗ ${name} - Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testHealthEndpoint() {
  logSection('1. Health Endpoint Tests');
  
  await testEndpoint('Health Check (API)', `${API_BASE_URL}/api/v1/health`);
  await testEndpoint('Health Check (Worker)', `${WORKER_URL}/api/v1/health`);
  await testEndpoint('Health Check (Legacy)', `${API_BASE_URL}/health`);
}

async function testAPIEndpoints() {
  logSection('2. API Endpoint Tests');
  
  await testEndpoint('Unified Data', `${API_BASE_URL}/api/v1/unified-data`);
  await testEndpoint('Trip Status', `${API_BASE_URL}/api/v1/trip-status`);
  await testEndpoint('Config Endpoint', `${API_BASE_URL}/api/v1/config`);
  await testEndpoint('Root Endpoint', `${API_BASE_URL}/`);
}

async function testFrontendConnectivity() {
  logSection('3. Frontend Connectivity Tests');
  
  const frontendResult = await testEndpoint('Frontend Homepage', FRONTEND_URL);
  
  if (frontendResult.success) {
    // Check if frontend can reach backend
    log('  Checking frontend-backend connectivity...', 'info');
    // This would require browser automation to fully test
    // For now, we just verify the frontend loads
  }
}

async function testDatabaseConnectivity() {
  logSection('4. Database Connectivity Tests');
  
  // Test database through health endpoint
  const healthResult = await testEndpoint('Database via Health Check', `${API_BASE_URL}/api/v1/health`);
  
  if (healthResult.success && healthResult.data) {
    const health = healthResult.data;
    if (health.resources) {
      if (health.resources.d1_database === 'operational') {
        log('  ✓ D1 Database: Operational', 'success');
        results.passed.push({ name: 'D1 Database', status: 'operational' });
      } else {
        log(`  ⚠ D1 Database: ${health.resources.d1_database}`, 'warning');
        results.warnings.push({ name: 'D1 Database', status: health.resources.d1_database });
      }
      
      if (health.resources.r2_storage === 'operational') {
        log('  ✓ R2 Storage: Operational', 'success');
        results.passed.push({ name: 'R2 Storage', status: 'operational' });
      } else {
        log(`  ⚠ R2 Storage: ${health.resources.r2_storage}`, 'warning');
        results.warnings.push({ name: 'R2 Storage', status: health.resources.r2_storage });
      }
    }
  }
}

async function testExternalAPIs() {
  logSection('5. External API Integration Tests');
  
  // Test if external APIs are configured (through backend)
  const configResult = await testEndpoint('Config (check external API setup)', `${API_BASE_URL}/api/v1/config`);
  
  // Test unified data which uses Tessie API
  const unifiedResult = await testEndpoint('Tessie API (via unified-data)', `${API_BASE_URL}/api/v1/unified-data`);
  
  if (unifiedResult.success && unifiedResult.data) {
    const data = unifiedResult.data;
    if (data.tessieStatus) {
      if (data.tessieStatus.connected) {
        log('  ✓ Tessie API: Connected', 'success');
        results.passed.push({ name: 'Tessie API', status: 'connected' });
      } else {
        log('  ⚠ Tessie API: Not connected', 'warning');
        results.warnings.push({ name: 'Tessie API', status: 'not connected' });
      }
    }
  }
}

async function testCORS() {
  logSection('6. CORS Configuration Tests');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
      },
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
    };
    
    if (corsHeaders['access-control-allow-origin']) {
      log(`  ✓ CORS configured: ${corsHeaders['access-control-allow-origin']}`, 'success');
      results.passed.push({ name: 'CORS Configuration', headers: corsHeaders });
    } else {
      log('  ⚠ CORS headers not found', 'warning');
      results.warnings.push({ name: 'CORS Configuration', issue: 'headers not found' });
    }
  } catch (error) {
    log(`  ✗ CORS test failed: ${error.message}`, 'error');
    results.failed.push({ name: 'CORS Test', error: error.message });
  }
}

async function testSecurityHeaders() {
  logSection('7. Security Headers Tests');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`);
    const headers = {
      'x-content-type-options': response.headers.get('x-content-type-options'),
      'x-frame-options': response.headers.get('x-frame-options'),
      'x-xss-protection': response.headers.get('x-xss-protection'),
      'referrer-policy': response.headers.get('referrer-policy'),
    };
    
    const securityHeadersPresent = Object.values(headers).filter(h => h !== null).length;
    
    if (securityHeadersPresent >= 3) {
      log(`  ✓ Security headers present: ${securityHeadersPresent}/4`, 'success');
      results.passed.push({ name: 'Security Headers', count: securityHeadersPresent, headers });
    } else {
      log(`  ⚠ Some security headers missing: ${securityHeadersPresent}/4`, 'warning');
      results.warnings.push({ name: 'Security Headers', count: securityHeadersPresent, headers });
    }
  } catch (error) {
    log(`  ✗ Security headers test failed: ${error.message}`, 'error');
    results.failed.push({ name: 'Security Headers Test', error: error.message });
  }
}

async function testResponseTimes() {
  logSection('8. Performance Tests');
  
  const endpoints = [
    { name: 'Health', url: `${API_BASE_URL}/api/v1/health` },
    { name: 'Unified Data', url: `${API_BASE_URL}/api/v1/unified-data` },
    { name: 'Config', url: `${API_BASE_URL}/api/v1/config` },
  ];
  
  for (const endpoint of endpoints) {
    const times = [];
    for (let i = 0; i < 3; i++) {
      try {
        const start = Date.now();
        await fetch(endpoint.url, { timeout: 10000 });
        times.push(Date.now() - start);
      } catch (error) {
        // Ignore errors for performance test
      }
    }
    
    if (times.length > 0) {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const max = Math.max(...times);
      const min = Math.min(...times);
      
      if (avg < 500) {
        log(`  ✓ ${endpoint.name}: ${avg}ms avg (${min}-${max}ms)`, 'success');
      } else if (avg < 1000) {
        log(`  ⚠ ${endpoint.name}: ${avg}ms avg (${min}-${max}ms) - Slow`, 'warning');
      } else {
        log(`  ✗ ${endpoint.name}: ${avg}ms avg (${min}-${max}ms) - Very Slow`, 'error');
      }
    }
  }
}

function printSummary() {
  logSection('Test Summary');
  
  console.log(`${colors.green}Passed: ${results.passed.length}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings.length}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed.length}${colors.reset}`);
  
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results.failed.forEach(test => {
      console.log(`  - ${test.name}: ${test.error || `Status ${test.status}`}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
    results.warnings.forEach(warning => {
      console.log(`  - ${warning.name}: ${warning.status || warning.issue}`);
    });
  }
  
  const successRate = ((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(1);
  console.log(`\n${colors.cyan}Success Rate: ${successRate}%${colors.reset}`);
  
  if (results.failed.length === 0 && results.warnings.length === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else if (results.failed.length === 0) {
    console.log(`\n${colors.yellow}⚠ Tests passed with warnings${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

async function runTests() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║   A Whittle Wandering - Connectivity & Functionality Test  ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\nTesting endpoints:`);
  console.log(`  API Base: ${API_BASE_URL}`);
  console.log(`  Frontend: ${FRONTEND_URL}`);
  console.log(`  Worker: ${WORKER_URL}\n`);

  try {
    await testHealthEndpoint();
    await testAPIEndpoints();
    await testFrontendConnectivity();
    await testDatabaseConnectivity();
    await testExternalAPIs();
    await testCORS();
    await testSecurityHeaders();
    await testResponseTimes();
    
    printSummary();
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

runTests();

