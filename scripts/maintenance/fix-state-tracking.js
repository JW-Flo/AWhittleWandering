#!/usr/bin/env node

/**
 * Tesla State Tracking Data Remediation Script
 * 
 * This script fixes the broken state tracking by:
 * 1. Clearing fake/mock states data
 * 2. Re-processing existing drives with fixed state detection
 * 3. Rebuilding accurate state progress tracking
 */

const BASE_URL = 'https://api.awhittlewandering.com';

async function makeApiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function clearFakeStatesData() {
  console.log('🧹 Step 1: Clearing fake states data...');
  
  // This will require a new endpoint to clean the data
  console.log('📝 Note: Manual database cleanup needed:');
  console.log('   DELETE FROM states_visited WHERE total_miles_in_state = 100;');
  console.log('   DELETE FROM states_progress WHERE total_miles = 100;');
}

async function reprocessDrivesWithStateDetection() {
  console.log('🔄 Step 2: Re-processing drives with fixed state detection...');
  
  try {
    // Trigger drive reprocessing
    const result = await makeApiCall('/api/v1/admin/reprocess-drives', 'POST');
    console.log('✅ Drives reprocessed:', result);
  } catch (error) {
    console.log('📝 Note: Reprocessing endpoint needed. Manual steps:');
    console.log('   1. Update existing drives with proper start_state/end_state');
    console.log('   2. Rebuild states_visited from real drive data');
    console.log('   3. Recalculate states_progress accurately');
  }
}

async function validateStateTracking() {
  console.log('🔍 Step 3: Validating corrected state tracking...');
  
  try {
    const journeyData = await makeApiCall('/api/v1/unified-data');
    
    console.log('📊 Journey Statistics:');
    console.log(`   States Visited: ${journeyData.overview?.statesVisited || 'Unknown'}`);
    console.log(`   Total Miles: ${journeyData.overview?.totalMiles || 'Unknown'}`);
    console.log(`   Current State: ${journeyData.overview?.currentState || 'Unknown'}`);
    
    // Check for remaining mock data
    if (journeyData.overview?.statesVisited === 30) {
      console.log('⚠️  Warning: May still contain mock data (exactly 30 states)');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

async function getCurrentLocation() {
  console.log('📍 Step 4: Checking current location accuracy...');
  
  try {
    const liveData = await makeApiCall('/api/v1/live-data');
    console.log('🚗 Current Vehicle Status:');
    console.log(`   Location: ${liveData.location || 'Unknown'}`);
    console.log(`   State: ${liveData.state || 'Unknown'}`);
    console.log(`   Battery: ${liveData.batteryLevel || 'Unknown'}%`);
    
  } catch (error) {
    console.error('❌ Live data check failed:', error.message);
  }
}

async function main() {
  console.log('🚀 TESLA STATE TRACKING DATA REMEDIATION');
  console.log('=========================================');
  console.log('');
  
  try {
    await clearFakeStatesData();
    console.log('');
    
    await reprocessDrivesWithStateDetection();
    console.log('');
    
    await validateStateTracking();
    console.log('');
    
    await getCurrentLocation();
    console.log('');
    
    console.log('🎯 REMEDIATION SUMMARY:');
    console.log('✅ State detection function fixed (deployed)');
    console.log('📝 Manual database cleanup needed');
    console.log('🔄 Drive reprocessing required');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('1. Run manual SQL cleanup commands');
    console.log('2. Trigger drive reprocessing');  
    console.log('3. Validate state counts match your actual journey');
    console.log('4. Test frontend state progress display');
    
  } catch (error) {
    console.error('❌ Remediation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
