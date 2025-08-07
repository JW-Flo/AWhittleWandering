#!/usr/bin/env node

/**
 * Simple Dev Site Verification
 * Tests if the local and production sites are working
 */

import fetch from 'node-fetch';
import fs from 'fs';

const TESTS = [
  {
    name: 'Local Dev Server',
    url: 'http://localhost:8080/',
    timeout: 5000
  },
  {
    name: 'Production Frontend',
    url: 'https://81e929d7.awhittlewandering-frontend.pages.dev/',
    timeout: 10000
  },
  {
    name: 'Development API Health',
    url: 'https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/health',
    timeout: 10000
  },
  {
    name: 'Production API Health',
    url: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health',
    timeout: 10000
  },
  {
    name: 'Development Tesla Data',
    url: 'https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/unified-data',
    timeout: 15000
  }
];

class SiteVerifier {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  async testEndpoint(test) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), test.timeout);
      
      const start = Date.now();
      const response = await fetch(test.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AWhittleWandering-DevTest/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;
      
      let content = '';
      let isJson = false;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          content = await response.json();
          isJson = true;
        } else {
          const text = await response.text();
          content = text.substring(0, 200); // First 200 chars
        }
      } catch (parseError) {
        content = 'Failed to parse response';
      }
      
      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        ok: response.ok,
        responseTime,
        isJson,
        content,
        error: null
      };
      
      this.results.push(result);
      
      if (response.ok) {
        console.log(`   ✅ Status: ${response.status} (${responseTime}ms)`);
        if (isJson && content.status) {
          console.log(`   📊 Content: ${JSON.stringify(content).substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ Status: ${response.status} (${responseTime}ms)`);
        this.errors.push(`${test.name}: HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      
      const result = {
        name: test.name,
        url: test.url,
        status: 0,
        ok: false,
        responseTime: 0,
        isJson: false,
        content: '',
        error: error.message
      };
      
      this.results.push(result);
      this.errors.push(`${test.name}: ${error.message}`);
    }
    
    console.log('');
  }

  async runAllTests() {
    console.log('🚀 Starting Dev Site Verification...\n');
    
    for (const test of TESTS) {
      await this.testEndpoint(test);
    }
    
    this.generateReport();
  }

  generateReport() {
    const passed = this.results.filter(r => r.ok).length;
    const total = this.results.length;
    const successRate = Math.round((passed / total) * 100);
    
    console.log('📊 VERIFICATION REPORT');
    console.log('========================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('');
    
    // Group results by status
    const working = this.results.filter(r => r.ok);
    const failing = this.results.filter(r => !r.ok);
    
    if (working.length > 0) {
      console.log('✅ WORKING SERVICES:');
      working.forEach(r => {
        console.log(`   • ${r.name}: ${r.status} (${r.responseTime}ms)`);
      });
      console.log('');
    }
    
    if (failing.length > 0) {
      console.log('❌ FAILING SERVICES:');
      failing.forEach(r => {
        const errorMsg = r.error || `HTTP ${r.status}`;
        console.log(`   • ${r.name}: ${errorMsg}`);
      });
      console.log('');
    }
    
    // Tesla data specific check
    const teslaDataTest = this.results.find(r => r.name === 'Development Tesla Data');
    if (teslaDataTest && teslaDataTest.ok && teslaDataTest.isJson) {
      const data = teslaDataTest.content;
      if (data.tessieStatus) {
        console.log('🚗 TESLA DATA STATUS:');
        console.log(`   Connected: ${data.tessieStatus.connected ? '✅' : '❌'}`);
        console.log(`   Data Freshness: ${data.tessieStatus.dataFreshness || 'unknown'}`);
        if (data.tessieStatus.error) {
          console.log(`   Error: ${data.tessieStatus.error}`);
        }
        console.log('');
      }
    }
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    
    const localFailed = this.results.find(r => r.name === 'Local Dev Server' && !r.ok);
    if (localFailed) {
      console.log('   • Local dev server not running - run: npm run dev:frontend');
    }
    
    const apiFailed = this.results.filter(r => r.name.includes('API') && !r.ok);
    if (apiFailed.length > 0) {
      console.log('   • API issues detected - check API configurations');
    }
    
    if (successRate < 80) {
      console.log('   • Multiple services failing - review deployment status');
    } else if (successRate === 100) {
      console.log('   • All services working correctly! 🎉');
    }
    
    console.log('');
    
    // Save detailed results
    const reportFile = 'debug/verification-report.json';
    try {
      fs.writeFileSync(reportFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: { total, passed, failed: total - passed, successRate },
        results: this.results,
        errors: this.errors
      }, null, 2));
      console.log(`📄 Detailed report saved to: ${reportFile}`);
    } catch (saveError) {
      console.log(`⚠️  Could not save report: ${saveError.message}`);
    }
    
    console.log('');
    console.log(`🔗 URLs Tested:`);
    this.results.forEach(r => {
      const status = r.ok ? '✅' : '❌';
      console.log(`   ${status} ${r.url}`);
    });
  }
}

async function main() {
  const verifier = new SiteVerifier();
  await verifier.runAllTests();
  
  // Exit with appropriate code
  const allPassed = verifier.errors.length === 0;
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
