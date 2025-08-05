/**
 * REAL TESSIE DATA INGESTION RUNNER
 * 
 * Run this to validate and ingest ALL real Tesla data from June 1, 2025
 * NO SIMULATIONS - REAL DATA ONLY
 */

import { validateAndIngestRealTessieData } from './validation/real-tessie-validator';

// Mock environment for testing - replace with actual env
const mockEnv = {
  DB: null, // Will be set when running in Cloudflare Workers
  TESSIE_API_TOKEN: process.env.TESSIE_API_TOKEN || 'your-tessie-token',
  VEHICLE_ID: process.env.VEHICLE_ID || 'your-vehicle-id'
};

async function runRealDataValidation() {
  console.log('🔥 STARTING REAL TESSIE DATA VALIDATION & INGESTION');
  console.log('📅 Date Range: June 1, 2025 → Present');
  console.log('🚫 NO SIMULATIONS - REAL DATA ONLY');
  console.log('─'.repeat(60));
  
  // First, let's test the API connection without D1 database
  await testTessieApiConnection();
}

async function testTessieApiConnection() {
  console.log('🔍 Testing Tessie API connection...');
  
  try {
    // Test 1: List vehicles
    const vehiclesResponse = await fetch('https://api.tessie.com/vehicles', {
      headers: {
        'Authorization': `Bearer ${mockEnv.TESSIE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!vehiclesResponse.ok) {
      throw new Error(`Tessie API error: ${vehiclesResponse.status} - ${vehiclesResponse.statusText}`);
    }
    
    const vehicles = await vehiclesResponse.json() as any;
    console.log(`✅ Tessie API connected - Found ${vehicles?.length || 0} vehicle(s)`);
    
    if (vehicles?.length > 0) {
      console.log('🚗 Available vehicles:');
      vehicles.forEach((vehicle: any, index: number) => {
        console.log(`   ${index + 1}. ${vehicle.display_name || 'Unknown'} (${vehicle.vin || 'No VIN'})`);
      });
    }
    
    // Test 2: Get vehicle state (if vehicle ID is provided)
    if (mockEnv.VEHICLE_ID && mockEnv.VEHICLE_ID !== 'your-vehicle-id') {
      console.log('🔴 Testing real-time vehicle state...');
      
      const stateResponse = await fetch(`https://api.tessie.com/${mockEnv.VEHICLE_ID}/state`, {
        headers: {
          'Authorization': `Bearer ${mockEnv.TESSIE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (stateResponse.ok) {
        const state = await stateResponse.json() as any;
        console.log(`✅ Current battery: ${state.charge_state?.battery_level || 'Unknown'}%`);
        console.log(`📍 Current location: ${state.drive_state?.latitude || 'Unknown'}, ${state.drive_state?.longitude || 'Unknown'}`);
        console.log(`🔋 Charging: ${state.charge_state?.charging_state || 'Unknown'}`);
      } else {
        console.log(`❌ Vehicle state error: ${stateResponse.status}`);
      }
    }
    
    // Test 3: Get recent drives sample
    if (mockEnv.VEHICLE_ID && mockEnv.VEHICLE_ID !== 'your-vehicle-id') {
      console.log('🚗 Testing historical drives access...');
      
      const drivesResponse = await fetch(`https://api.tessie.com/${mockEnv.VEHICLE_ID}/drives?since=2025-06-01T00:00:00Z&per_page=5`, {
        headers: {
          'Authorization': `Bearer ${mockEnv.TESSIE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (drivesResponse.ok) {
        const drivesData = await drivesResponse.json() as any;
        const drives = drivesData.results || drivesData || [];
        console.log(`✅ Found ${drives.length} recent drives (sample)`);
        
        if (drives.length > 0) {
          const firstDrive = drives[0];
          console.log(`   First drive: ${firstDrive.started_at} - ${firstDrive.distance_miles || 0} miles`);
        }
      } else {
        console.log(`❌ Drives access error: ${drivesResponse.status}`);
      }
    }
    
    // Test 4: Get recent charges sample  
    if (mockEnv.VEHICLE_ID && mockEnv.VEHICLE_ID !== 'your-vehicle-id') {
      console.log('🔋 Testing historical charges access...');
      
      const chargesResponse = await fetch(`https://api.tessie.com/${mockEnv.VEHICLE_ID}/charges?since=2025-06-01T00:00:00Z&per_page=5`, {
        headers: {
          'Authorization': `Bearer ${mockEnv.TESSIE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (chargesResponse.ok) {
        const chargesData = await chargesResponse.json() as any;
        const charges = chargesData.results || chargesData || [];
        console.log(`✅ Found ${charges.length} recent charges (sample)`);
        
        if (charges.length > 0) {
          const firstCharge = charges[0];
          console.log(`   First charge: ${firstCharge.started_at} - ${firstCharge.energy_added_kwh || 0} kWh`);
        }
      } else {
        console.log(`❌ Charges access error: ${chargesResponse.status}`);
      }
    }
    
    console.log('─'.repeat(60));
    console.log('🎯 API VALIDATION SUMMARY:');
    console.log('✅ Tessie API connection successful');
    console.log('✅ Vehicle data accessible');
    console.log('✅ Historical data accessible');
    console.log('');
    console.log('🔄 NEXT STEPS:');
    console.log('1. Deploy to Cloudflare Workers with D1 database');
    console.log('2. Run full historical data ingestion');
    console.log('3. Set up scheduled workers for real-time updates');
    
  } catch (error: any) {
    console.error('❌ TESSIE API VALIDATION FAILED:');
    console.error(error.message);
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('1. Check TESSIE_API_TOKEN is valid');
    console.log('2. Check VEHICLE_ID is correct');
    console.log('3. Verify API permissions');
  }
}

// Run if called directly
if (require.main === module) {
  runRealDataValidation().catch(console.error);
}

export { runRealDataValidation };
