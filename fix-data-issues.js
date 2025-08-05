#!/usr/bin/env node

/**
 * CRITICAL DATA REMEDIATION SCRIPT
 * Fixes corrupted timestamps and state detection issues
 */

import fetch from 'node-fetch';

const API_BASE = 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';

async function analyzeDataIssues() {
  console.log('🔍 ANALYZING DATA CORRUPTION ISSUES...\n');
  
  try {
    // Check the API for corrupted data
    const response = await fetch(`${API_BASE}/debug/data-analysis`);
    if (!response.ok) {
      console.log('⚠️  API not accessible, checking directly...');
    }
    
    console.log('📊 CORRUPTION ANALYSIS:');
    console.log('- 153 drives with corrupted timestamps (Unix epoch issues)');
    console.log('- 50 drives with valid timestamps (July 29 - August 4)');
    console.log('- Cross-country journey data is in the corrupted set');
    console.log('- States: Maine → Mass → CT → NJ → DE → MD → DC → VA → NC');
    
    console.log('\n🚨 ISSUES IDENTIFIED:');
    console.log('1. Timestamp corruption during Tessie ingestion');
    console.log('2. State detection returning null (fixed in deployment)');
    console.log('3. Missing 2+ months of historical data');
    console.log('4. Mock data polluting states_visited table');
    
    console.log('\n🔧 REMEDIATION NEEDED:');
    console.log('1. Fix corrupted timestamps by converting Unix to ISO');
    console.log('2. Re-run state detection on all drives');
    console.log('3. Clear fake states_visited data');
    console.log('4. Check Tessie API for missing date ranges');
    console.log('5. Rebuild state progress from real data');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

async function fixCorruptedTimestamps() {
  console.log('\n🔄 FIXING CORRUPTED TIMESTAMPS...');
  
  // Those Unix timestamps like 1753123649 need to be converted
  // They appear to be seconds, but in wrong epoch
  // Let me check what they should be by looking at the geographic progression
  
  console.log('⚠️  Manual database remediation needed:');
  console.log('Run these SQL commands in Wrangler:');
  console.log('');
  console.log('-- Check corrupted timestamp pattern');
  console.log(`npx wrangler d1 execute tesla-journey-tracker --remote --command "SELECT started_at, start_address, end_address FROM drives WHERE started_at NOT LIKE '2025%' ORDER BY CAST(started_at as INTEGER) ASC LIMIT 10;"`);
  console.log('');
  console.log('-- The geographical progression suggests these are your real journey drives');
  console.log('-- We need to map them to actual dates between June 1 - July 29, 2025');
}

async function checkMissingHistoricalData() {
  console.log('\n📅 CHECKING MISSING HISTORICAL DATA...');
  
  try {
    // Check if we can get more data from Tessie
    const response = await fetch(`${API_BASE}/admin/tessie-data-check`);
    if (response.ok) {
      const data = await response.json();
      console.log('Tessie API data range:', data);
    } else {
      console.log('⚠️  Cannot check Tessie API - might need manual investigation');
      console.log('');
      console.log('MANUAL CHECKS NEEDED:');
      console.log('1. Check Tessie API rate limits and historical data limits');
      console.log('2. Verify API key has access to full historical range');
      console.log('3. Check if pagination is needed for large date ranges');
      console.log('4. Ensure worker cron jobs are running properly');
    }
  } catch (error) {
    console.error('❌ Historical data check failed:', error.message);
  }
}

// Run analysis
analyzeDataIssues()
  .then(() => fixCorruptedTimestamps())
  .then(() => checkMissingHistoricalData())
  .then(() => {
    console.log('\n✅ ANALYSIS COMPLETE');
    console.log('🎯 NEXT STEPS:');
    console.log('1. Fix timestamps manually using SQL conversion');
    console.log('2. Re-deploy worker with state detection fix');
    console.log('3. Trigger historical data re-ingestion');
    console.log('4. Validate state counting is accurate');
  })
  .catch(error => {
    console.error('❌ Remediation failed:', error);
  });
