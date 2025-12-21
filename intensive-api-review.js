#!/usr/bin/env node

/**
 * Intensive API Review and Credential Validation
 * Comprehensive analysis of all API integrations and credential requirements
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class IntensiveAPIReview {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      apis: {},
      credentials: {},
      configuration: {},
      issues: [],
      recommendations: []
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

  // 1. Identify all API integrations
  identifyAPIIntegrations() {
    this.log('Identifying all API integrations...', 'TEST');
    
    const apis = {
      tessie: {
        name: 'Tessie API',
        baseUrl: 'https://api.tessie.com',
        endpoints: [],
        usedIn: [],
        credentials: ['TESSIE_API_KEY'],
        required: true,
        priority: 1
      },
      mapbox: {
        name: 'Mapbox API',
        baseUrl: 'https://api.mapbox.com',
        endpoints: [],
        usedIn: [],
        credentials: ['MAPBOX_ACCESS_TOKEN'],
        required: true,
        priority: 2
      },
      openweather: {
        name: 'OpenWeather API',
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        endpoints: [],
        usedIn: [],
        credentials: ['OPENWEATHER_API_KEY'],
        required: true,
        priority: 3
      },
      backend: {
        name: 'Backend API',
        baseUrl: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev',
        endpoints: [],
        usedIn: [],
        credentials: [],
        required: true,
        priority: 0
      }
    };

    // Scan frontend for API usage
    this.log('  Scanning frontend code...');
    const frontendFiles = [
      'frontend/src/hooks/useTessieApi.ts',
      'frontend/src/hooks/useUnifiedTessieApi.ts',
      'frontend/src/hooks/useWeatherApi.ts',
      'frontend/src/services/weatherService.ts',
      'frontend/src/lib/mapbox-loader.ts',
      'frontend/src/lib/api-config.ts'
    ];

    frontendFiles.forEach(file => {
      const filePath = join(__dirname, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        
        if (content.includes('api.tessie.com') || content.includes('TESSIE')) {
          apis.tessie.usedIn.push(file);
          if (content.includes('/vehicles')) apis.tessie.endpoints.push('/vehicles');
          if (content.includes('/drives')) apis.tessie.endpoints.push('/drives');
          if (content.includes('/charges')) apis.tessie.endpoints.push('/charges');
        }
        
        if (content.includes('api.mapbox.com') || content.includes('MAPBOX')) {
          apis.mapbox.usedIn.push(file);
          if (content.includes('/geocoding')) apis.mapbox.endpoints.push('/geocoding');
          if (content.includes('/directions')) apis.mapbox.endpoints.push('/directions');
        }
        
        if (content.includes('openweathermap.org') || content.includes('OPENWEATHER')) {
          apis.openweather.usedIn.push(file);
          if (content.includes('/weather')) apis.openweather.endpoints.push('/weather');
          if (content.includes('/onecall')) apis.openweather.endpoints.push('/onecall');
        }
      }
    });

    // Scan backend for API usage
    this.log('  Scanning backend code...');
    const backendFiles = [
      'backend/edge-worker/src/ingestion/tessie-ingest.ts',
      'backend/edge-worker/src/utils/geocode.ts',
      'backend/edge-worker/src/index.ts'
    ];

    backendFiles.forEach(file => {
      const filePath = join(__dirname, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        
        if (content.includes('api.tessie.com') || content.includes('TESSIE_API_KEY')) {
          apis.tessie.usedIn.push(file);
        }
        
        if (content.includes('api.mapbox.com') || content.includes('MAPBOX_ACCESS_TOKEN')) {
          apis.mapbox.usedIn.push(file);
        }
        
        if (content.includes('openweathermap.org') || content.includes('OPENWEATHER_API_KEY')) {
          apis.openweather.usedIn.push(file);
        }
      }
    });

    this.results.apis = apis;
    this.log(`  Found ${Object.keys(apis).length} API integrations`, 'SUCCESS');
  }

  // 2. Check credential configuration
  checkCredentialConfiguration() {
    this.log('Checking credential configuration...', 'TEST');
    
    const credentials = {
      TESSIE_API_KEY: {
        required: true,
        priority: 1,
        locations: {
          github: false,
          cloudflare: false,
          local: false,
          code: false
        },
        usedIn: [],
        status: 'missing'
      },
      MAPBOX_ACCESS_TOKEN: {
        required: true,
        priority: 2,
        locations: {
          github: false,
          cloudflare: false,
          local: false,
          code: false
        },
        usedIn: [],
        status: 'missing'
      },
      OPENWEATHER_API_KEY: {
        required: true,
        priority: 3,
        locations: {
          github: false,
          cloudflare: false,
          local: false,
          code: false
        },
        usedIn: [],
        status: 'missing'
      },
      JWT_SECRET: {
        required: true,
        priority: 4,
        locations: {
          github: false,
          cloudflare: false,
          local: false,
          code: false
        },
        usedIn: [],
        status: 'missing'
      },
      TESLA_VIN: {
        required: true,
        priority: 5,
        locations: {
          github: false,
          cloudflare: false,
          local: false,
          code: false
        },
        usedIn: [],
        status: 'missing'
      },
      CLOUDFLARE_API_TOKEN: {
        required: false,
        priority: 6,
        locations: {
          github: false,
          cloudflare: false,
          local: false,
          code: false
        },
        usedIn: [],
        status: 'missing'
      }
    };

    // Check GitHub Secrets (if gh CLI available)
    this.log('  Checking GitHub Secrets...');
    try {
      const ghAvailable = execSync('which gh', { encoding: 'utf8' }).trim();
      if (ghAvailable) {
        try {
          const secretList = execSync('gh secret list', { encoding: 'utf8', cwd: __dirname });
          Object.keys(credentials).forEach(key => {
            if (secretList.includes(key)) {
              credentials[key].locations.github = true;
            }
          });
        } catch (e) {
          this.log('    ⚠️  GitHub CLI not authenticated or no access', 'WARNING');
        }
      }
    } catch (e) {
      this.log('    ⚠️  GitHub CLI not available', 'WARNING');
    }

    // Check Cloudflare Workers secrets
    this.log('  Checking Cloudflare Workers secrets...');
    try {
      const wranglerPath = join(__dirname, 'backend/edge-worker');
      if (existsSync(join(wranglerPath, 'wrangler.toml'))) {
        try {
          const secretList = execSync('npx wrangler secret list', { 
            encoding: 'utf8', 
            cwd: wranglerPath,
            timeout: 10000
          });
          Object.keys(credentials).forEach(key => {
            if (secretList.includes(key)) {
              credentials[key].locations.cloudflare = true;
            }
          });
        } catch (e) {
          this.log('    ⚠️  Could not check Cloudflare secrets (may need auth)', 'WARNING');
        }
      }
    } catch (e) {
      this.log('    ⚠️  Wrangler not available or not authenticated', 'WARNING');
    }

    // Check local .dev.vars
    this.log('  Checking local .dev.vars...');
    const devVarsPath = join(__dirname, 'backend/edge-worker/.dev.vars');
    if (existsSync(devVarsPath)) {
      const devVars = readFileSync(devVarsPath, 'utf8');
      Object.keys(credentials).forEach(key => {
        if (devVars.includes(key) && !devVars.includes(`${key}=your_`) && !devVars.includes(`${key}=replace_`)) {
          credentials[key].locations.local = true;
        }
      });
    } else {
      this.log('    ⚠️  .dev.vars file not found', 'WARNING');
    }

    // Check code for hardcoded credentials (security issue)
    this.log('  Checking for hardcoded credentials in code...');
    const codeFiles = [
      'frontend/src/lib/auth.ts',
      'backend/edge-worker/src/index.ts',
      'backend/edge-worker/wrangler.toml'
    ];
    
    codeFiles.forEach(file => {
      const filePath = join(__dirname, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        Object.keys(credentials).forEach(key => {
          // Check for actual values (not just variable names)
          const regex = new RegExp(`${key}\\s*=\\s*['"]([^'"]{10,})['"]`, 'i');
          if (regex.test(content)) {
            credentials[key].locations.code = true;
            this.log(`    ❌ Hardcoded ${key} found in ${file}`, 'ERROR');
            this.results.issues.push({
              severity: 'CRITICAL',
              type: 'hardcoded_credential',
              credential: key,
              file: file,
              message: `Hardcoded credential found in code - security risk!`
            });
          }
        });
      }
    });

    // Determine status for each credential
    Object.keys(credentials).forEach(key => {
      const cred = credentials[key];
      const hasAny = cred.locations.github || cred.locations.cloudflare || cred.locations.local;
      
      if (cred.locations.code) {
        cred.status = 'hardcoded_insecure';
      } else if (cred.locations.github && cred.locations.cloudflare) {
        cred.status = 'configured';
      } else if (cred.locations.github) {
        cred.status = 'github_only';
      } else if (cred.locations.cloudflare) {
        cred.status = 'cloudflare_only';
      } else if (cred.locations.local) {
        cred.status = 'local_only';
      } else {
        cred.status = 'missing';
        if (cred.required) {
          this.results.issues.push({
            severity: 'CRITICAL',
            type: 'missing_credential',
            credential: key,
            message: `Required credential ${key} is not configured`
          });
        }
      }
    });

    this.results.credentials = credentials;
  }

  // 3. Test API endpoints
  async testAPIEndpoints() {
    this.log('Testing API endpoints...', 'TEST');
    
    const tests = {
      tessie: {
        name: 'Tessie API',
        baseUrl: 'https://api.tessie.com',
        endpoints: [
          { path: '/vehicles', method: 'GET', requiresAuth: true }
        ],
        results: []
      },
      mapbox: {
        name: 'Mapbox API',
        baseUrl: 'https://api.mapbox.com',
        endpoints: [
          { path: '/geocoding/v5/mapbox.places/0,0.json', method: 'GET', requiresAuth: true }
        ],
        results: []
      },
      openweather: {
        name: 'OpenWeather API',
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        endpoints: [
          { path: '/weather?lat=0&lon=0&appid=test', method: 'GET', requiresAuth: true }
        ],
        results: []
      },
      backend: {
        name: 'Backend API',
        baseUrl: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev',
        endpoints: [
          { path: '/health', method: 'GET', requiresAuth: false },
          { path: '/api/v1/health', method: 'GET', requiresAuth: false },
          { path: '/api/v1/unified-data', method: 'GET', requiresAuth: false },
          { path: '/api/v1/config', method: 'GET', requiresAuth: false }
        ],
        results: []
      }
    };

    for (const [apiName, api] of Object.entries(tests)) {
      this.log(`  Testing ${api.name}...`);
      
      for (const endpoint of api.endpoints) {
        try {
          const url = `${api.baseUrl}${endpoint.path}`;
          const startTime = Date.now();
          
          const response = await fetch(url, {
            method: endpoint.method,
            headers: endpoint.requiresAuth ? {
              'Authorization': 'Bearer test_key'
            } : {},
            signal: AbortSignal.timeout(10000)
          });
          
          const duration = Date.now() - startTime;
          
          api.results.push({
            endpoint: endpoint.path,
            status: response.status,
            ok: response.ok,
            duration,
            requiresAuth: endpoint.requiresAuth,
            authWorking: endpoint.requiresAuth ? (response.status === 401 || response.status === 403) : true
          });
          
          if (response.ok || (endpoint.requiresAuth && (response.status === 401 || response.status === 403))) {
            this.log(`    ✅ ${endpoint.path} - ${response.status} (${duration}ms)`, 'SUCCESS');
          } else {
            this.log(`    ⚠️  ${endpoint.path} - ${response.status} (${duration}ms)`, 'WARNING');
          }
        } catch (error) {
          api.results.push({
            endpoint: endpoint.path,
            error: error.message,
            duration: Date.now() - startTime
          });
          this.log(`    ❌ ${endpoint.path} - ${error.message}`, 'ERROR');
        }
      }
    }

    this.results.configuration.apiTests = tests;
  }

  // 4. Generate recommendations
  generateRecommendations() {
    this.log('Generating recommendations...', 'TEST');
    
    const recommendations = [];

    // Check each credential
    Object.entries(this.results.credentials).forEach(([key, cred]) => {
      if (cred.status === 'missing' && cred.required) {
        recommendations.push({
          priority: 'CRITICAL',
          credential: key,
          action: `Add ${key} to GitHub Secrets and sync to Cloudflare Workers`,
          steps: [
            `1. Go to GitHub: Settings → Secrets → Actions`,
            `2. Add ${key} as a repository secret`,
            `3. Run sync-secrets workflow or: ./scripts/sync-secrets-from-github.sh`
          ]
        });
      } else if (cred.status === 'github_only') {
        recommendations.push({
          priority: 'HIGH',
          credential: key,
          action: `Sync ${key} from GitHub Secrets to Cloudflare Workers`,
          steps: [
            `1. Run: cd backend/edge-worker && npx wrangler secret put ${key}`,
            `2. Or trigger sync-secrets workflow in GitHub Actions`
          ]
        });
      } else if (cred.status === 'cloudflare_only') {
        recommendations.push({
          priority: 'MEDIUM',
          credential: key,
          action: `Add ${key} to GitHub Secrets for centralized management`,
          steps: [
            `1. Go to GitHub: Settings → Secrets → Actions`,
            `2. Add ${key} as a repository secret`,
            `3. This enables automatic sync and better management`
          ]
        });
      } else if (cred.status === 'hardcoded_insecure') {
        recommendations.push({
          priority: 'CRITICAL',
          credential: key,
          action: `Remove hardcoded ${key} from code immediately`,
          steps: [
            `1. Remove hardcoded value from code`,
            `2. Add ${key} to GitHub Secrets`,
            `3. Use environment variables or secrets instead`,
            `4. Rotate the credential if it was exposed`
          ]
        });
      }
    });

    // Check API connectivity
    if (this.results.configuration.apiTests) {
      Object.entries(this.results.configuration.apiTests).forEach(([apiName, api]) => {
        const failedTests = api.results.filter(r => r.error || (!r.ok && !r.authWorking));
        if (failedTests.length > 0) {
          recommendations.push({
            priority: 'HIGH',
            api: apiName,
            action: `Fix ${api.name} connectivity issues`,
            issues: failedTests.map(t => `${t.endpoint}: ${t.error || `Status ${t.status}`}`)
          });
        }
      });
    }

    this.results.recommendations = recommendations;
  }

  // 5. Generate report
  generateReport() {
    this.log('Generating comprehensive report...', 'TEST');
    
    const report = {
      summary: {
        totalAPIs: Object.keys(this.results.apis).length,
        totalCredentials: Object.keys(this.results.credentials).length,
        configuredCredentials: Object.values(this.results.credentials).filter(c => 
          c.status === 'configured' || c.status === 'github_only' || c.status === 'cloudflare_only'
        ).length,
        missingCredentials: Object.values(this.results.credentials).filter(c => 
          c.status === 'missing' && c.required
        ).length,
        criticalIssues: this.results.issues.filter(i => i.severity === 'CRITICAL').length
      },
      credentials: this.results.credentials,
      apis: this.results.apis,
      issues: this.results.issues,
      recommendations: this.results.recommendations,
      timestamp: this.results.timestamp
    };

    return report;
  }

  // 6. Print report
  printReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('INTENSIVE API REVIEW & CREDENTIAL VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Generated: ${report.timestamp}`);
    console.log('\n📊 SUMMARY:');
    console.log(`  Total APIs: ${report.summary.totalAPIs}`);
    console.log(`  Total Credentials: ${report.summary.totalCredentials}`);
    console.log(`  Configured: ${report.summary.configuredCredentials}`);
    console.log(`  Missing: ${report.summary.missingCredentials}`);
    console.log(`  Critical Issues: ${report.summary.criticalIssues}`);

    console.log('\n🔐 CREDENTIAL STATUS:');
    Object.entries(report.credentials).forEach(([key, cred]) => {
      const statusIcon = {
        'configured': '✅',
        'github_only': '⚠️',
        'cloudflare_only': '⚠️',
        'local_only': '⚠️',
        'missing': '❌',
        'hardcoded_insecure': '🚨'
      }[cred.status] || '❓';
      
      console.log(`  ${statusIcon} ${key}: ${cred.status}`);
      if (cred.locations.github) console.log(`      → GitHub: ✅`);
      if (cred.locations.cloudflare) console.log(`      → Cloudflare: ✅`);
      if (cred.locations.local) console.log(`      → Local (.dev.vars): ✅`);
      if (cred.locations.code) console.log(`      → Code: 🚨 HARDCODED (SECURITY RISK!)`);
    });

    if (report.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      report.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.severity}] ${issue.type}: ${issue.credential || issue.api || 'N/A'}`);
        console.log(`     ${issue.message}`);
        if (issue.file) console.log(`     File: ${issue.file}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. [${rec.priority}] ${rec.credential || rec.api || 'General'}`);
        console.log(`     Action: ${rec.action}`);
        if (rec.steps) {
          rec.steps.forEach(step => console.log(`     ${step}`));
        }
        if (rec.issues) {
          console.log(`     Issues:`);
          rec.issues.forEach(issue => console.log(`       - ${issue}`));
        }
      });
    }

    console.log('\n' + '='.repeat(80));
  }

  // Main execution
  async run() {
    this.log('Starting Intensive API Review...', 'INFO');
    
    this.identifyAPIIntegrations();
    this.checkCredentialConfiguration();
    await this.testAPIEndpoints();
    this.generateRecommendations();
    
    const report = this.generateReport();
    this.printReport(report);
    
    // Save report
    const reportPath = join(__dirname, 'intensive-api-review-report.json');
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\nReport saved to: ${reportPath}`, 'SUCCESS');
    
    return report;
  }
}

// Run the review
const reviewer = new IntensiveAPIReview();
reviewer.run().then(report => {
  const exitCode = report.summary.missingCredentials > 0 || report.summary.criticalIssues > 0 ? 1 : 0;
  process.exit(exitCode);
}).catch(error => {
  console.error('❌ Review failed:', error);
  process.exit(1);
});
