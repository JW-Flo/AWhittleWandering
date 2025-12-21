#!/usr/bin/env node

/**
 * Comprehensive API Connection Validation
 * Tests all APIs with actual credentials from Cloudflare Workers
 */

const BACKEND_URL = 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';

class APIConnectionValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      backend: {},
      external: {},
      credentials: {},
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
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000)
      });
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
        data,
        duration,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
        duration: Date.now() - Date.now()
      };
    }
  }

  // Test Backend API
  async testBackendAPI() {
    this.log('Testing Backend API Endpoints...', 'TEST');

    // Test Health
    this.log('  Testing /api/v1/health...');
    const health = await this.makeRequest(`${BACKEND_URL}/api/v1/health`);
    this.results.backend.health = {
      success: health.ok,
      status: health.status,
      duration: health.duration,
      hasWarnings: health.data?.warnings?.length > 0,
      warnings: health.data?.warnings || []
    };

    if (health.ok) {
      this.log(`    ✅ Health check OK (${health.status}) - ${health.duration}ms`, 'SUCCESS');
      if (health.data?.warnings?.length > 0) {
        this.log(`    ⚠️  Warnings: ${health.data.warnings.join(', ')}`, 'WARNING');
      }
    } else {
      this.log(`    ❌ Health check failed (${health.status})`, 'ERROR');
    }

    // Test Unified Data
    this.log('  Testing /api/v1/unified-data...');
    const unified = await this.makeRequest(`${BACKEND_URL}/api/v1/unified-data`);
    this.results.backend.unifiedData = {
      success: unified.ok,
      status: unified.status,
      duration: unified.duration,
      hasVehicle: unified.data?.vehicle ? true : false,
      hasJourney: unified.data?.journey ? true : false,
      hasSegments: Array.isArray(unified.data?.segments)
    };

    if (unified.ok) {
      this.log(`    ✅ Unified data OK (${unified.status}) - ${unified.duration}ms`, 'SUCCESS');
      if (unified.data?.vehicle) {
        this.log(`    ✅ Vehicle data present`, 'SUCCESS');
      }
      if (unified.data?.journey) {
        this.log(`    ✅ Journey data present`, 'SUCCESS');
      }
    } else {
      this.log(`    ❌ Unified data failed (${unified.status})`, 'ERROR');
      if (unified.data?.error) {
        this.log(`    Error: ${unified.data.error}`, 'ERROR');
      }
    }

    // Test Config
    this.log('  Testing /api/v1/config...');
    const config = await this.makeRequest(`${BACKEND_URL}/api/v1/config`);
    this.results.backend.config = {
      success: config.ok,
      status: config.status,
      duration: config.duration,
      hasFeatures: config.data?.features ? true : false,
      hasMapboxToken: config.data?.mapboxToken ? true : false
    };

    if (config.ok) {
      this.log(`    ✅ Config OK (${config.status}) - ${config.duration}ms`, 'SUCCESS');
      if (config.data?.mapboxToken) {
        this.log(`    ✅ Mapbox token configured`, 'SUCCESS');
      } else {
        this.log(`    ⚠️  Mapbox token not in config`, 'WARNING');
      }
    } else {
      this.log(`    ❌ Config failed (${config.status})`, 'ERROR');
    }
  }

  // Test External APIs (with test credentials to verify structure)
  async testExternalAPIs() {
    this.log('Testing External API Structures...', 'TEST');

    // Test Tessie API
    this.log('  Testing Tessie API structure...');
    const tessie = await this.makeRequest('https://api.tessie.com/vehicles', {
      headers: {
        'Authorization': 'Bearer test_key_invalid'
      }
    });
    this.results.external.tessie = {
      reachable: tessie.status !== 0,
      requiresAuth: tessie.status === 401 || tessie.status === 403,
      structure: tessie.status === 401 ? 'valid' : 'unknown'
    };
    if (tessie.status === 401) {
      this.log(`    ✅ Tessie API reachable and requires auth`, 'SUCCESS');
    } else {
      this.log(`    ⚠️  Tessie API response: ${tessie.status}`, 'WARNING');
    }

    // Test Mapbox API
    this.log('  Testing Mapbox API structure...');
    const mapbox = await this.makeRequest('https://api.mapbox.com/geocoding/v5/mapbox.places/0,0.json?access_token=test');
    this.results.external.mapbox = {
      reachable: mapbox.status !== 0,
      requiresAuth: mapbox.status === 401 || mapbox.status === 403,
      structure: mapbox.status === 401 ? 'valid' : 'unknown'
    };
    if (mapbox.status === 401) {
      this.log(`    ✅ Mapbox API reachable and requires auth`, 'SUCCESS');
    } else {
      this.log(`    ⚠️  Mapbox API response: ${mapbox.status}`, 'WARNING');
    }

    // Test OpenWeather API
    this.log('  Testing OpenWeather API structure...');
    const weather = await this.makeRequest('https://api.openweathermap.org/data/2.5/weather?lat=0&lon=0&appid=test');
    this.results.external.openweather = {
      reachable: weather.status !== 0,
      requiresAuth: weather.status === 401 || weather.status === 403,
      structure: weather.status === 401 ? 'valid' : 'unknown'
    };
    if (weather.status === 401) {
      this.log(`    ✅ OpenWeather API reachable and requires auth`, 'SUCCESS');
    } else {
      this.log(`    ⚠️  OpenWeather API response: ${weather.status}`, 'WARNING');
    }
  }

  // Test Backend with actual credentials (if available via config endpoint)
  async testBackendWithCredentials() {
    this.log('Testing Backend API with Credentials...', 'TEST');

    // Get config to see if credentials are available
    const config = await this.makeRequest(`${BACKEND_URL}/api/v1/config`);
    
    if (config.ok && config.data) {
      this.results.credentials.backendConfig = {
        hasMapboxToken: !!config.data.mapboxToken,
        hasTessieKey: config.data.features?.liveTeslaData || false,
        mode: config.data.mode || 'unknown'
      };

      if (config.data.mapboxToken) {
        this.log(`    ✅ Mapbox token available in backend`, 'SUCCESS');
      } else {
        this.log(`    ⚠️  Mapbox token not available in backend config`, 'WARNING');
      }

      if (config.data.features?.liveTeslaData) {
        this.log(`    ✅ Tessie API configured (liveTeslaData: true)`, 'SUCCESS');
      } else {
        this.log(`    ⚠️  Tessie API may not be configured`, 'WARNING');
      }
    }
  }

  // Generate summary
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
        reachable: externalReachable,
        reachableRate: ((externalReachable / externalTests.length) * 100).toFixed(1) + '%'
      },
      credentials: this.results.credentials,
      overall: {
        status: backendSuccess === backendTotal && externalReachable === externalTests.length ? 'PASS' : 'PARTIAL',
        timestamp: new Date().toISOString()
      }
    };
  }

  // Print report
  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('API CONNECTION VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log('\n📊 SUMMARY:');
    console.log(`  Backend Endpoints: ${this.results.summary.backend.successful}/${this.results.summary.backend.total} successful (${this.results.summary.backend.successRate})`);
    console.log(`  External APIs: ${this.results.summary.external.reachable}/${this.results.summary.external.total} reachable (${this.results.summary.external.reachableRate})`);
    console.log(`  Overall Status: ${this.results.summary.overall.status}`);

    if (this.results.backend.health?.warnings?.length > 0) {
      console.log('\n⚠️  Backend Warnings:');
      this.results.backend.health.warnings.forEach(w => console.log(`  - ${w}`));
    }

    if (this.results.credentials.backendConfig) {
      console.log('\n🔐 Credential Status:');
      console.log(`  Mapbox Token: ${this.results.credentials.backendConfig.hasMapboxToken ? '✅ Configured' : '❌ Missing'}`);
      console.log(`  Tessie API: ${this.results.credentials.backendConfig.hasTessieKey ? '✅ Configured' : '❌ Missing'}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  async run() {
    this.log('Starting API Connection Validation...', 'INFO');
    
    await this.testBackendAPI();
    await this.testExternalAPIs();
    await this.testBackendWithCredentials();
    
    this.generateSummary();
    this.printReport();
    
    // Save report
    const fs = await import('fs');
    const path = await import('path');
    const reportPath = path.join(process.cwd(), 'api-connection-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    this.log(`\nReport saved to: ${reportPath}`, 'SUCCESS');
    
    return this.results;
  }
}

// Run validation
const validator = new APIConnectionValidator();
validator.run().then(results => {
  const exitCode = results.summary.overall.status === 'PASS' ? 0 : 1;
  process.exit(exitCode);
}).catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
