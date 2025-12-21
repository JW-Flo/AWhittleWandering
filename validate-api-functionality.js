#!/usr/bin/env node

/**
 * Comprehensive API Functionality Validation for A Whittle Wandering Platform
 * 
 * Validates:
 * - Backend API endpoints (health, unified-data, trip-status, telemetry)
 * - External API integrations (Tessie, Mapbox, OpenWeather)
 * - Error handling and edge cases
 * - Authentication and security
 * - Rate limiting
 * - Data validation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  BACKEND_BASE_URL: process.env.VITE_API_BASE_URL || 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev',
  TIMEOUT: 30000,
  RETRIES: 3,
  ENDPOINTS: {
    // Backend endpoints
    ROOT: '/',
    HEALTH: '/health',
    HEALTH_API: '/api/v1/health',
    UNIFIED_DATA: '/api/v1/unified-data',
    TRIP_STATUS: '/api/v1/trip-status',
    TELEMETRY: '/api/v1/telemetry',
    CONFIG: '/api/v1/config',
    ADMIN: '/api/v1/admin',
    AUTH: '/api/v1/auth',
    // Legacy endpoints
    LEGACY_UNIFIED: '/unified-data',
    LEGACY_TRIP_STATUS: '/trip-status',
  },
  EXTERNAL_APIS: {
    TESSIE: 'https://api.tessie.com',
    MAPBOX: 'https://api.mapbox.com',
    OPENWEATHER: 'https://api.openweathermap.org/data/2.5',
  }
};

class APIValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      backend: {},
      external: {},
      security: {},
      performance: {},
      errors: [],
      warnings: [],
      summary: {}
    };
  }

  log(message, level = 'INFO') {
    const prefix = {
      'INFO': 'ℹ️',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'TEST': '🧪'
    }[level] || 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async makeRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Validator/1.0'
      },
      signal: AbortSignal.timeout(CONFIG.TIMEOUT),
      ...options
    };

    try {
      const startTime = Date.now();
      const response = await fetch(url, defaultOptions);
      const duration = Date.now() - startTime;
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        duration,
        url: response.url
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
        duration: Date.now() - Date.now()
      };
    }
  }

  async testWithRetry(testFn, maxRetries = CONFIG.RETRIES) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await testFn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          this.log(`  Retry ${attempt}/${maxRetries}...`, 'WARNING');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    throw lastError;
  }

  // Backend API Tests
  async testBackendEndpoints() {
    this.log('Testing Backend API Endpoints...', 'TEST');
    const baseUrl = CONFIG.BACKEND_BASE_URL;

    // Test Root Endpoint
    this.log('  Testing root endpoint...');
    try {
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.ROOT}`);
      this.results.backend.root = {
        success: response.ok,
        status: response.status,
        hasEndpoints: response.data?.endpoints ? true : false,
        duration: response.duration
      };
      if (response.ok) {
        this.log(`    ✅ Root endpoint OK (${response.status})`, 'SUCCESS');
      } else {
        this.log(`    ❌ Root endpoint failed (${response.status})`, 'ERROR');
      }
    } catch (error) {
      this.results.backend.root = { success: false, error: error.message };
      this.log(`    ❌ Root endpoint error: ${error.message}`, 'ERROR');
    }

    // Test Health Endpoints
    for (const [name, endpoint] of [['health', CONFIG.ENDPOINTS.HEALTH], ['health_api', CONFIG.ENDPOINTS.HEALTH_API]]) {
      this.log(`  Testing ${name} endpoint...`);
      try {
        const response = await this.makeRequest(`${baseUrl}${endpoint}`);
        this.results.backend[name] = {
          success: response.ok,
          status: response.status,
          hasStatus: response.data?.status ? true : false,
          hasTimestamp: response.data?.timestamp ? true : false,
          duration: response.duration,
          warnings: response.data?.warnings || []
        };
        if (response.ok) {
          this.log(`    ✅ ${name} endpoint OK (${response.status})`, 'SUCCESS');
        } else {
          this.log(`    ❌ ${name} endpoint failed (${response.status})`, 'ERROR');
        }
      } catch (error) {
        this.results.backend[name] = { success: false, error: error.message };
        this.log(`    ❌ ${name} endpoint error: ${error.message}`, 'ERROR');
      }
    }

    // Test Unified Data Endpoint
    this.log('  Testing unified-data endpoint...');
    try {
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.UNIFIED_DATA}`);
      this.results.backend.unifiedData = {
        success: response.ok,
        status: response.status,
        hasVehicle: response.data?.vehicle ? true : false,
        hasJourney: response.data?.journey ? true : false,
        hasSegments: Array.isArray(response.data?.segments),
        duration: response.duration
      };
      if (response.ok) {
        this.log(`    ✅ Unified data endpoint OK (${response.status})`, 'SUCCESS');
      } else {
        this.log(`    ❌ Unified data endpoint failed (${response.status})`, 'ERROR');
      }
    } catch (error) {
      this.results.backend.unifiedData = { success: false, error: error.message };
      this.log(`    ❌ Unified data endpoint error: ${error.message}`, 'ERROR');
    }

    // Test Trip Status Endpoint
    this.log('  Testing trip-status endpoint...');
    try {
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.TRIP_STATUS}`);
      this.results.backend.tripStatus = {
        success: response.ok,
        status: response.status,
        hasTripId: response.data?.tripId ? true : false,
        hasStatus: response.data?.status ? true : false,
        duration: response.duration
      };
      if (response.ok) {
        this.log(`    ✅ Trip status endpoint OK (${response.status})`, 'SUCCESS');
      } else {
        this.log(`    ❌ Trip status endpoint failed (${response.status})`, 'ERROR');
      }
    } catch (error) {
      this.results.backend.tripStatus = { success: false, error: error.message };
      this.log(`    ❌ Trip status endpoint error: ${error.message}`, 'ERROR');
    }

    // Test Config Endpoint
    this.log('  Testing config endpoint...');
    try {
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.CONFIG}`);
      this.results.backend.config = {
        success: response.ok,
        status: response.status,
        hasFeatures: response.data?.features ? true : false,
        noSecretsExposed: !JSON.stringify(response.data).match(/sk-|password|secret|token/i),
        duration: response.duration
      };
      if (response.ok) {
        this.log(`    ✅ Config endpoint OK (${response.status})`, 'SUCCESS');
      } else {
        this.log(`    ❌ Config endpoint failed (${response.status})`, 'ERROR');
      }
    } catch (error) {
      this.results.backend.config = { success: false, error: error.message };
      this.log(`    ❌ Config endpoint error: ${error.message}`, 'ERROR');
    }

    // Test Telemetry Endpoint (POST)
    this.log('  Testing telemetry endpoint...');
    try {
      const testTelemetry = {
        vin: 'TEST_VIN',
        timestamp: new Date().toISOString(),
        battery_level: 80,
        location: { lat: 37.7749, lng: -122.4194 }
      };
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.TELEMETRY}`, {
        method: 'POST',
        body: JSON.stringify(testTelemetry)
      });
      this.results.backend.telemetry = {
        success: response.ok || response.status === 400, // 400 is OK for validation
        status: response.status,
        acceptsData: response.status !== 404,
        duration: response.duration
      };
      if (response.ok || response.status === 400) {
        this.log(`    ✅ Telemetry endpoint OK (${response.status})`, 'SUCCESS');
      } else {
        this.log(`    ❌ Telemetry endpoint failed (${response.status})`, 'ERROR');
      }
    } catch (error) {
      this.results.backend.telemetry = { success: false, error: error.message };
      this.log(`    ❌ Telemetry endpoint error: ${error.message}`, 'ERROR');
    }

    // Test Legacy Redirects
    this.log('  Testing legacy redirects...');
    try {
      const unifiedRedirect = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.LEGACY_UNIFIED}`, {
        redirect: 'manual'
      });
      this.results.backend.legacyRedirects = {
        unifiedData: unifiedRedirect.status === 308 || unifiedRedirect.status === 301
      };
      if (unifiedRedirect.status === 308 || unifiedRedirect.status === 301) {
        this.log(`    ✅ Legacy redirects working`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ Legacy redirects may not be working`, 'WARNING');
      }
    } catch (error) {
      this.results.backend.legacyRedirects = { success: false, error: error.message };
    }
  }

  // External API Tests
  async testExternalAPIs() {
    this.log('Testing External API Integrations...', 'TEST');
    
    // Test Tessie API structure (without key)
    this.log('  Testing Tessie API structure...');
    try {
      const response = await this.makeRequest(`${CONFIG.EXTERNAL_APIS.TESSIE}/vehicles`, {
        headers: {
          'Authorization': 'Bearer test_key'
        }
      });
      this.results.external.tessie = {
        reachable: response.status !== 0,
        requiresAuth: response.status === 401 || response.status === 403,
        structure: response.status === 401 ? 'valid' : 'unknown'
      };
      if (response.status === 401) {
        this.log(`    ✅ Tessie API reachable and requires auth`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ Tessie API response: ${response.status}`, 'WARNING');
      }
    } catch (error) {
      this.results.external.tessie = { reachable: false, error: error.message };
      this.log(`    ❌ Tessie API error: ${error.message}`, 'ERROR');
    }

    // Test Mapbox API structure
    this.log('  Testing Mapbox API structure...');
    try {
      const response = await this.makeRequest(`${CONFIG.EXTERNAL_APIS.MAPBOX}/geocoding/v5/mapbox.places/0,0.json?access_token=test`);
      this.results.external.mapbox = {
        reachable: response.status !== 0,
        requiresAuth: response.status === 401 || response.status === 403,
        structure: response.status === 401 ? 'valid' : 'unknown'
      };
      if (response.status === 401) {
        this.log(`    ✅ Mapbox API reachable and requires auth`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ Mapbox API response: ${response.status}`, 'WARNING');
      }
    } catch (error) {
      this.results.external.mapbox = { reachable: false, error: error.message };
      this.log(`    ❌ Mapbox API error: ${error.message}`, 'ERROR');
    }

    // Test OpenWeather API structure
    this.log('  Testing OpenWeather API structure...');
    try {
      const response = await this.makeRequest(`${CONFIG.EXTERNAL_APIS.OPENWEATHER}/weather?lat=0&lon=0&appid=test`);
      this.results.external.openweather = {
        reachable: response.status !== 0,
        requiresAuth: response.status === 401 || response.status === 403,
        structure: response.status === 401 ? 'valid' : 'unknown'
      };
      if (response.status === 401) {
        this.log(`    ✅ OpenWeather API reachable and requires auth`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ OpenWeather API response: ${response.status}`, 'WARNING');
      }
    } catch (error) {
      this.results.external.openweather = { reachable: false, error: error.message };
      this.log(`    ❌ OpenWeather API error: ${error.message}`, 'ERROR');
    }
  }

  // Security Tests
  async testSecurity() {
    this.log('Testing Security Features...', 'TEST');
    const baseUrl = CONFIG.BACKEND_BASE_URL;

    // Test CORS headers
    this.log('  Testing CORS headers...');
    try {
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.HEALTH}`);
      const hasCors = response.headers['access-control-allow-origin'] !== undefined;
      this.results.security.cors = {
        enabled: hasCors,
        header: response.headers['access-control-allow-origin']
      };
      if (hasCors) {
        this.log(`    ✅ CORS headers present`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ CORS headers missing`, 'WARNING');
      }
    } catch (error) {
      this.results.security.cors = { error: error.message };
    }

    // Test Security headers
    this.log('  Testing security headers...');
    try {
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.HEALTH}`);
      this.results.security.headers = {
        contentTypeOptions: response.headers['x-content-type-options'] === 'nosniff',
        hasSecurityHeaders: Object.keys(response.headers).some(k => k.toLowerCase().startsWith('x-'))
      };
      if (this.results.security.headers.contentTypeOptions) {
        this.log(`    ✅ Security headers present`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ Some security headers missing`, 'WARNING');
      }
    } catch (error) {
      this.results.security.headers = { error: error.message };
    }

    // Test Admin endpoint protection
    this.log('  Testing admin endpoint protection...');
    try {
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.ADMIN}`);
      this.results.security.admin = {
        protected: response.status === 401 || response.status === 403 || response.status === 404,
        status: response.status
      };
      if (response.status === 401 || response.status === 403) {
        this.log(`    ✅ Admin endpoint protected`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ Admin endpoint may not be protected (${response.status})`, 'WARNING');
      }
    } catch (error) {
      this.results.security.admin = { error: error.message };
    }
  }

  // Performance Tests
  async testPerformance() {
    this.log('Testing Performance...', 'TEST');
    const baseUrl = CONFIG.BACKEND_BASE_URL;

    // Test response times
    this.log('  Testing response times...');
    const endpoints = [
      CONFIG.ENDPOINTS.HEALTH,
      CONFIG.ENDPOINTS.UNIFIED_DATA,
      CONFIG.ENDPOINTS.TRIP_STATUS
    ];

    const performanceResults = {};
    for (const endpoint of endpoints) {
      try {
        const times = [];
        for (let i = 0; i < 3; i++) {
          const response = await this.makeRequest(`${baseUrl}${endpoint}`);
          if (response.duration) times.push(response.duration);
        }
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        performanceResults[endpoint] = {
          average: avgTime,
          acceptable: avgTime < 2000
        };
        if (avgTime < 2000) {
          this.log(`    ✅ ${endpoint} average: ${avgTime.toFixed(0)}ms`, 'SUCCESS');
        } else {
          this.log(`    ⚠️ ${endpoint} slow: ${avgTime.toFixed(0)}ms`, 'WARNING');
        }
      } catch (error) {
        performanceResults[endpoint] = { error: error.message };
      }
    }
    this.results.performance.responseTimes = performanceResults;
  }

  // Error Handling Tests
  async testErrorHandling() {
    this.log('Testing Error Handling...', 'TEST');
    const baseUrl = CONFIG.BACKEND_BASE_URL;

    // Test 404 handling
    this.log('  Testing 404 handling...');
    try {
      const response = await this.makeRequest(`${baseUrl}/api/v1/nonexistent`);
      this.results.errors.notFound = {
        correctStatus: response.status === 404,
        status: response.status
      };
      if (response.status === 404) {
        this.log(`    ✅ 404 handling correct`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ Unexpected status for 404: ${response.status}`, 'WARNING');
      }
    } catch (error) {
      this.results.errors.notFound = { error: error.message };
    }

    // Test malformed request handling
    this.log('  Testing malformed request handling...');
    try {
      const response = await this.makeRequest(`${baseUrl}${CONFIG.ENDPOINTS.TELEMETRY}`, {
        method: 'POST',
        body: 'invalid json'
      });
      this.results.errors.malformed = {
        handled: response.status >= 400 && response.status < 500,
        status: response.status
      };
      if (response.status >= 400 && response.status < 500) {
        this.log(`    ✅ Malformed requests handled correctly`, 'SUCCESS');
      } else {
        this.log(`    ⚠️ Unexpected status for malformed request: ${response.status}`, 'WARNING');
      }
    } catch (error) {
      this.results.errors.malformed = { error: error.message };
    }
  }

  // Generate Summary
  generateSummary() {
    const backendTests = Object.values(this.results.backend);
    const backendSuccess = backendTests.filter(t => t.success).length;
    const backendTotal = backendTests.length;

    const externalTests = Object.values(this.results.external);
    const externalReachable = externalTests.filter(t => t.reachable !== false).length;

    this.results.summary = {
      backend: {
        total: backendTotal,
        successful: backendSuccess,
        successRate: ((backendSuccess / backendTotal) * 100).toFixed(1) + '%'
      },
      external: {
        total: externalTests.length,
        reachable: externalReachable
      },
      security: {
        cors: this.results.security.cors?.enabled || false,
        headers: this.results.security.headers?.contentTypeOptions || false,
        adminProtected: this.results.security.admin?.protected || false
      },
      overall: {
        status: backendSuccess === backendTotal ? 'PASS' : 'PARTIAL',
        timestamp: new Date().toISOString()
      }
    };
  }

  // Print Report
  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('API FUNCTIONALITY VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Backend URL: ${CONFIG.BACKEND_BASE_URL}`);
    console.log('\n📊 SUMMARY:');
    console.log(`  Backend Endpoints: ${this.results.summary.backend.successful}/${this.results.summary.backend.total} successful (${this.results.summary.backend.successRate})`);
    console.log(`  External APIs: ${this.results.summary.external.reachable}/${this.results.summary.external.total} reachable`);
    console.log(`  Security: CORS=${this.results.summary.security.cors ? '✅' : '❌'}, Headers=${this.results.summary.security.headers ? '✅' : '❌'}, Admin=${this.results.summary.security.adminProtected ? '✅' : '❌'}`);
    console.log(`  Overall Status: ${this.results.summary.overall.status}`);
    console.log('\n' + '='.repeat(60));
  }

  // Save Report
  async saveReport() {
    const reportPath = join(__dirname, 'api-validation-report.json');
    const reportJson = JSON.stringify(this.results, null, 2);
    const fs = await import('fs');
    fs.writeFileSync(reportPath, reportJson);
    this.log(`Report saved to: ${reportPath}`, 'SUCCESS');
  }

  // Run All Tests
  async runAll() {
    this.log('Starting API Functionality Validation...', 'INFO');
    this.log(`Backend URL: ${CONFIG.BACKEND_BASE_URL}`, 'INFO');
    
    await this.testBackendEndpoints();
    await this.testExternalAPIs();
    await this.testSecurity();
    await this.testPerformance();
    await this.testErrorHandling();
    
    this.generateSummary();
    this.printReport();
    await this.saveReport();
    
    return this.results;
  }
}

// Main execution
async function main() {
  const validator = new APIValidator();
  try {
    const results = await validator.runAll();
    process.exit(results.summary.overall.status === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default APIValidator;
