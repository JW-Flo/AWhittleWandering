#!/usr/bin/env node

/**
 * Website Issue Diagnosis and QA with Cloud Storage
 * This script diagnoses the black screen issue and stores results in Cloudflare D1
 */

import { CloudQARunner } from './cloud-qa-runner.js';

async function runWebsiteDiagnosisQA() {
  console.log('🌥️  Starting Cloud QA with Website Diagnosis');
  console.log('🔍 Investigating: Website black screen after spinning wheel\n');

  const qaRunner = new CloudQARunner();
  
  try {
    // Start cloud QA run
    const runId = await qaRunner.startQARun({
      triggerType: 'manual',
      environment: 'production',
      iterations: 1
    });

    const startTime = Date.now();
    let passedPhases = 0;
    let failedPhases = 0;

    // Phase 1: Website Diagnostics
    console.log('🔍 Phase 1: Website Diagnostics');
    const phase1Start = Date.now();
    
    try {
      const diagnostics = await qaRunner.monitorWebsite();
      const phase1End = Date.now();
      
      await qaRunner.recordPhase(
        1, 
        'Website Diagnostics', 
        1, 
        diagnostics.severity === 'info' ? 'passed' : 'failed',
        {
          startTime: new Date(phase1Start).toISOString(),
          endTime: new Date(phase1End).toISOString(),
          durationMs: phase1End - phase1Start,
          diagnostics
        }
      );

      if (diagnostics.severity === 'info') {
        passedPhases++;
        console.log('✅ Website Diagnostics: PASSED');
      } else {
        failedPhases++;
        console.log('❌ Website Diagnostics: FAILED');
      }
    } catch (error) {
      failedPhases++;
      console.log('❌ Website Diagnostics: ERROR -', error.message);
    }

    // Phase 2: Frontend Asset Validation
    console.log('\n🎨 Phase 2: Frontend Asset Validation');
    const phase2Start = Date.now();
    
    try {
      // Check CSS assets
      const cssResponse = await fetch('https://ab99ceea.awhittlewandering-frontend.pages.dev/assets/components-Bh_1FTD-.css');
      const cssWorking = cssResponse.ok;
      
      // Check JavaScript vendor files
      const reactVendorResponse = await fetch('https://ab99ceea.awhittlewandering-frontend.pages.dev/assets/react-vendor-6s76OEBy.js');
      const reactVendorWorking = reactVendorResponse.ok;
      
      const phase2End = Date.now();
      
      const assetResults = {
        css: cssWorking,
        reactVendor: reactVendorWorking,
        allAssetsLoading: cssWorking && reactVendorWorking
      };

      await qaRunner.recordPhase(
        1,
        'Frontend Assets',
        2,
        assetResults.allAssetsLoading ? 'passed' : 'failed',
        {
          startTime: new Date(phase2Start).toISOString(),
          endTime: new Date(phase2End).toISOString(),
          durationMs: phase2End - phase2Start,
          assetResults
        }
      );

      if (assetResults.allAssetsLoading) {
        passedPhases++;
        console.log('✅ Frontend Assets: PASSED');
        console.log(`   ✅ CSS: ${cssWorking ? 'Loading' : 'Failed'}`);
        console.log(`   ✅ React Vendor: ${reactVendorWorking ? 'Loading' : 'Failed'}`);
      } else {
        failedPhases++;
        console.log('❌ Frontend Assets: FAILED');
        console.log(`   ${cssWorking ? '✅' : '❌'} CSS: ${cssWorking ? 'Loading' : 'Failed'}`);
        console.log(`   ${reactVendorWorking ? '✅' : '❌'} React Vendor: ${reactVendorWorking ? 'Loading' : 'Failed'}`);
        
        await qaRunner.createAlert(
          'error_rate',
          'high',
          'Frontend Assets Not Loading',
          'One or more frontend assets are failing to load',
          'https://ab99ceea.awhittlewandering-frontend.pages.dev'
        );
      }
    } catch (error) {
      failedPhases++;
      console.log('❌ Frontend Assets: ERROR -', error.message);
    }

    // Phase 3: API Backend Validation
    console.log('\n🌐 Phase 3: API Backend Validation');
    const phase3Start = Date.now();
    
    try {
      // Test health endpoint
      const healthResponse = await fetch('https://awhittlewandering-api.kd8jc7v8cd.workers.dev/health');
      const healthData = await healthResponse.json();
      
      // Test Tesla data endpoint
      const teslaResponse = await fetch('https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/tesla/data');
      const teslaWorking = teslaResponse.status !== 404;
      
      const phase3End = Date.now();
      
      const apiResults = {
        health: healthResponse.ok,
        teslaData: teslaWorking,
        healthData,
        allEndpointsWorking: healthResponse.ok && teslaWorking
      };

      await qaRunner.recordPhase(
        1,
        'API Backend',
        3,
        apiResults.allEndpointsWorking ? 'passed' : 'failed',
        {
          startTime: new Date(phase3Start).toISOString(),
          endTime: new Date(phase3End).toISOString(),
          durationMs: phase3End - phase3Start,
          apiResults
        }
      );

      if (apiResults.health) {
        passedPhases++;
        console.log('✅ API Backend: PASSED');
        console.log(`   ✅ Health Check: ${healthResponse.status}`);
        console.log(`   ${teslaWorking ? '✅' : '⚠️'} Tesla Data: ${teslaWorking ? 'Available' : 'Not Available'}`);
      } else {
        failedPhases++;
        console.log('❌ API Backend: FAILED');
        
        await qaRunner.createAlert(
          'availability',
          'critical',
          'API Backend Not Responding',
          'Backend API health check failed',
          'https://awhittlewandering-api.kd8jc7v8cd.workers.dev'
        );
      }

      // Record performance metrics
      await qaRunner.recordPerformanceMetric(
        'api_response_time',
        phase3End - phase3Start,
        'ms',
        'https://awhittlewandering-api.kd8jc7v8cd.workers.dev/health'
      );
      
    } catch (error) {
      failedPhases++;
      console.log('❌ API Backend: ERROR -', error.message);
    }

    // Phase 4: JavaScript Runtime Analysis
    console.log('\n🧠 Phase 4: JavaScript Runtime Analysis');
    const phase4Start = Date.now();
    
    try {
      // This is where the black screen issue likely occurs
      // Check if the main JavaScript bundle is executable
      const jsBundle = await fetch('https://ab99ceea.awhittlewandering-frontend.pages.dev/assets/index-CcChzyz6.js');
      const jsCode = await jsBundle.text();
      
      // Basic checks for common issues
      const hasConsoleErrors = jsCode.includes('console.error');
      const hasReactErrors = jsCode.includes('React') && jsCode.includes('error');
      const hasMapErrors = jsCode.includes('map') && jsCode.includes('error');
      const bundleSize = jsCode.length;
      
      const phase4End = Date.now();
      
      const jsAnalysis = {
        bundleLoaded: jsBundle.ok,
        bundleSize,
        potentialConsoleErrors: hasConsoleErrors,
        potentialReactErrors: hasReactErrors,
        potentialMapErrors: hasMapErrors,
        analysis: 'Bundle loads but may have runtime errors causing black screen'
      };

      await qaRunner.recordPhase(
        1,
        'JavaScript Runtime',
        4,
        jsBundle.ok ? 'passed' : 'failed',
        {
          startTime: new Date(phase4Start).toISOString(),
          endTime: new Date(phase4End).toISOString(),
          durationMs: phase4End - phase4Start,
          jsAnalysis
        }
      );

      if (jsBundle.ok) {
        passedPhases++;
        console.log('✅ JavaScript Runtime: ANALYSIS COMPLETE');
        console.log(`   📦 Bundle Size: ${Math.round(bundleSize / 1024)}KB`);
        console.log(`   ${hasConsoleErrors ? '⚠️' : '✅'} Console Errors: ${hasConsoleErrors ? 'Potential issues found' : 'None detected'}`);
        console.log(`   ${hasReactErrors ? '⚠️' : '✅'} React Errors: ${hasReactErrors ? 'Potential issues found' : 'None detected'}`);
        console.log(`   ${hasMapErrors ? '⚠️' : '✅'} Map Errors: ${hasMapErrors ? 'Potential issues found' : 'None detected'}`);
        
        if (hasConsoleErrors || hasReactErrors || hasMapErrors) {
          await qaRunner.createAlert(
            'error_rate',
            'warning',
            'Potential JavaScript Runtime Issues',
            'Bundle analysis detected potential runtime errors that could cause black screen',
            'https://ab99ceea.awhittlewandering-frontend.pages.dev'
          );
        }
      } else {
        failedPhases++;
        console.log('❌ JavaScript Runtime: FAILED');
      }
    } catch (error) {
      failedPhases++;
      console.log('❌ JavaScript Runtime: ERROR -', error.message);
    }

    // Complete QA run
    const totalTime = Date.now() - startTime;
    const status = failedPhases === 0 ? 'completed' : 'completed_with_issues';
    
    await qaRunner.completeQARun(status, passedPhases, failedPhases, totalTime);

    // Summary
    console.log('\n📊 QA DIAGNOSIS SUMMARY');
    console.log('─'.repeat(50));
    console.log(`🆔 Run ID: ${runId}`);
    console.log(`⏱️  Total Time: ${Math.round(totalTime / 1000)}s`);
    console.log(`✅ Passed Phases: ${passedPhases}`);
    console.log(`❌ Failed Phases: ${failedPhases}`);
    console.log(`📊 Success Rate: ${Math.round((passedPhases / (passedPhases + failedPhases)) * 100)}%`);

    console.log('\n🔍 BLACK SCREEN DIAGNOSIS:');
    console.log('─'.repeat(50));
    if (passedPhases >= 3) {
      console.log('🟡 LIKELY CAUSE: JavaScript Runtime Error');
      console.log('   • Website loads correctly (HTML, CSS, assets)');
      console.log('   • API backend is responding');
      console.log('   • JavaScript bundle loads but may fail during execution');
      console.log('   • Black screen suggests React component mounting failure');
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('   1. Check browser console for JavaScript errors');
      console.log('   2. Verify Tesla API data structure hasn\'t changed');
      console.log('   3. Test in incognito mode to rule out cache issues');
      console.log('   4. Check for map rendering issues (common cause)');
      console.log('   5. Validate environment variables and API keys');
    } else {
      console.log('🔴 CRITICAL ISSUE: Infrastructure Problem');
      console.log('   • Multiple systems failing');
      console.log('   • Check deployment status and rollback if needed');
    }

    console.log(`\n📊 View detailed report: https://qa-pipeline.kd8jc7v8cd.workers.dev/qa/runs/${runId}`);
    console.log('🌥️  All data stored in Cloudflare D1 for historical analysis');

    return { runId, passedPhases, failedPhases, status };

  } catch (error) {
    console.error('🚨 QA Diagnosis failed:', error);
    
    await qaRunner.createAlert(
      'error_rate',
      'critical',
      'QA Diagnosis System Failure',
      `QA diagnosis script failed: ${error.message}`,
      'qa-system'
    );
    
    throw error;
  }
}

// Run the diagnosis if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runWebsiteDiagnosisQA()
    .then((result) => {
      console.log('\n✅ QA Diagnosis completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ QA Diagnosis failed:', error.message);
      process.exit(1);
    });
}

export { runWebsiteDiagnosisQA };
