/**
 * Tesla API Integration Example
 * 
 * This example demonstrates how to use the Credential Manager and API Manager
 * together to securely and reliably access the Tesla API with circuit breaking,
 * caching, and credential management.
 */

import { CredentialManager, OnePasswordSource, EnvSource } from '../credential-manager';
import { TeslaApiClient } from '../api-manager';
import * as dotenv from 'dotenv';

// Define Tesla API response types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TeslaVehicle {
  id: string;
  display_name: string;
  vin: string;
  state: string;
  [key: string]: unknown;
}

interface TeslaClimateState {
  inside_temp: number;
  outside_temp: number;
  is_climate_on: boolean;
  [key: string]: unknown;
}

interface TeslaVehicleState {
  locked: boolean;
  odometer: number;
  car_version: string;
  [key: string]: unknown;
}

interface TeslaDriveState {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  [key: string]: unknown;
}

interface TeslaChargeState {
  battery_level: number;
  battery_range: number;
  charging_state: string;
  time_to_full_charge: number;
  [key: string]: unknown;
}

interface TeslaVehicleData {
  drive_state: TeslaDriveState;
  charge_state: TeslaChargeState;
  climate_state: TeslaClimateState;
  vehicle_state: TeslaVehicleState;
  [key: string]: unknown;
}

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting Tesla API integration example...');
  
  // Create credential sources in priority order
  const sources = [
    // Primary: 1Password Connect API
    new OnePasswordSource(
      process.env.ONEPASSWORD_CONNECT_URL || '', 
      process.env.ONEPASSWORD_VAULT_ID || '', 
      process.env.ONEPASSWORD_CONNECT_TOKEN || ''
    ),
    // Fallback: Environment variables
    new EnvSource()
  ];

  // Initialize the credential manager
  const credentialManager = new CredentialManager(sources);
  
  // Initialize the Tesla API client with the credential manager
  const teslaClient = new TeslaApiClient(credentialManager);
  
  try {
    // Get list of vehicles
    console.log('Fetching vehicles...');
    const vehicles = await teslaClient.getVehicles() as { response: TeslaVehicle[] };
    
    if (!vehicles?.response || vehicles.response.length === 0) {
      console.log('No vehicles found');
      return;
    }
    
    console.log(`Found ${vehicles.response.length} vehicles`);
    
    // Get data for the first vehicle
    const vehicleId = vehicles.response[0].id;
    console.log(`Fetching data for vehicle ${vehicleId}...`);
    
    const vehicleData = await teslaClient.getVehicleData(vehicleId) as { response: TeslaVehicleData };
    
    // Log vehicle location
    if (vehicleData?.response && vehicleData.response.drive_state) {
      const location = {
        latitude: vehicleData.response.drive_state.latitude,
        longitude: vehicleData.response.drive_state.longitude,
        speed: vehicleData.response.drive_state.speed,
        heading: vehicleData.response.drive_state.heading
      };
      
      console.log('Vehicle location:', location);
      
      // Log battery status
      if (vehicleData.response.charge_state) {
        const batteryStatus = {
          level: vehicleData.response.charge_state.battery_level,
          range: vehicleData.response.charge_state.battery_range,
          charging: vehicleData.response.charge_state.charging_state,
          timeToFullCharge: vehicleData.response.charge_state.time_to_full_charge
        };
        
        console.log('Battery status:', batteryStatus);
      }
      
      // Demonstrate caching by fetching the data again
      console.log('Fetching vehicle data again (should use cache)...');
      const startTime = Date.now();
      await teslaClient.getVehicleData(vehicleId) as { response: TeslaVehicleData };
      const endTime = Date.now();
      console.log(`Second request took ${endTime - startTime}ms (cached)`);
    } else {
      console.log('Vehicle data not available');
    }
  } catch (error) {
    console.error('Error accessing Tesla API:', error);
    
    // Check for credential issues
    const apiKey = await credentialManager.getCredential('TESLA_API_KEY');
    const accessToken = await credentialManager.getCredential('TESLA_ACCESS_TOKEN');
    
    if (!apiKey) {
      console.error('Missing Tesla API key - check credentials');
    }
    
    if (!accessToken) {
      console.error('Missing Tesla access token - check credentials');
    }
  }
}

// Run the example
if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
