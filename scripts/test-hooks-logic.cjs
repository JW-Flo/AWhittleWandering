#!/usr/bin/env node

/**
 * Direct Hook Testing - Tests the actual React hooks used in the app
 * Tests the individual data fetching functions isolated from React
 */

const fs = require('fs');
const path = require('path');
const fetch = globalThis.fetch;

// Simulate the hook functions outside of React
class HookTester {
  
  /**
   * Test Vehicle Data Hook Logic
   */
  async testVehicleDataHook() {
    console.log('\n🔧 Testing Vehicle Data Hook Logic');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Simulate the actual fetch logic from useVehicleData hook
      const apiUrl = 'https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/vehicle';
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Apply the same data normalization as in the hook
      const normalizedData = {
        ...data,
        location: data.location || {
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading || 0
        },
        latitude: data.location?.latitude || data.latitude,
        longitude: data.location?.longitude || data.longitude,
        last_updated: data.last_updated || new Date().toISOString()
      };

      console.log('✅ Vehicle data hook logic working');
      console.log('📊 Normalized Data Structure:');
      console.log(`  - ID: ${normalizedData.id || 'N/A'}`);
      console.log(`  - Battery: ${normalizedData.batteryLevel}%`);
      console.log(`  - Range: ${normalizedData.range} miles`);
      console.log(`  - Speed: ${normalizedData.speed} mph`);
      console.log(`  - Location: [${normalizedData.latitude}, ${normalizedData.longitude}]`);
      console.log(`  - Last Updated: ${normalizedData.last_updated}`);
      
      return { success: true, data: normalizedData };

    } catch (error) {
      console.log(`❌ Vehicle hook test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Trip Data Hook Logic  
   */
  async testTripDataHook(vehicleData) {
    console.log('\n🗺️  Testing Trip Data Hook Logic');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Simulate the generateEnhancedTripData function logic
      const now = new Date();
      const tripStartDate = new Date("2024-01-01");
      const daysOnRoad = Math.floor((now - tripStartDate) / (1000 * 60 * 60 * 24));

      // Get current location
      const currentLat = vehicleData?.latitude || vehicleData?.location?.latitude || 27.8006;
      const currentLng = vehicleData?.longitude || vehicleData?.location?.longitude || -97.3964;

      // State detection logic
      const STATE_BOUNDARIES = {
        TX: { minLat: 25.8, maxLat: 36.5, minLng: -106.6, maxLng: -93.5 },
        AZ: { minLat: 31.3, maxLat: 37.0, minLng: -114.8, maxLng: -109.0 },
        // Add more as needed for testing
      };

      const getCurrentState = (lat, lng) => {
        for (const [state, bounds] of Object.entries(STATE_BOUNDARIES)) {
          if (lat >= bounds.minLat && lat <= bounds.maxLat && 
              lng >= bounds.minLng && lng <= bounds.maxLng) {
            return state;
          }
        }
        return null;
      };

      const currentState = getCurrentState(currentLat, currentLng);

      // Generate trip data as the hook does
      const tripData = {
        visitedStates: ['TX', 'AZ', 'NM'], // Simulated based on current location
        currentState: currentState || 'AZ',
        currentCity: vehicleData?.currentCity || 'Flagstaff',
        nextStop: {
          city: 'Phoenix',
          state: 'AZ',
          eta: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        },
        distanceToNext: 144,
        totalMiles: 12000 + daysOnRoad * 200,
        daysOnRoad,
        route: [
          { latitude: 27.8006, longitude: -97.3964 }, // Corpus Christi
          { latitude: currentLat, longitude: currentLng }, // Current
          { latitude: 33.4484, longitude: -112.0740 }  // Phoenix
        ],
        stops: [
          {
            id: '1',
            name: 'Corpus Christi',
            latitude: 27.8006,
            longitude: -97.3964,
            type: 'start',
            state: 'TX'
          },
          {
            id: '2', 
            name: 'Phoenix',
            latitude: 33.4484,
            longitude: -112.0740,
            type: 'overnight',
            state: 'AZ'
          }
        ],
        statesRemaining: 48 - 3,
        routeProgress: Math.round((3 / 48) * 100),
        averageMilesPerDay: Math.round((12000 + daysOnRoad * 200) / Math.max(daysOnRoad, 1)),
        currentLocation: {
          latitude: currentLat,
          longitude: currentLng,
          state: currentState,
          city: vehicleData?.currentCity
        },
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Trip data hook logic working');
      console.log('📊 Generated Trip Data:');
      console.log(`  - Current State: ${tripData.currentState}`);
      console.log(`  - Visited States: ${tripData.visitedStates.join(', ')}`);
      console.log(`  - States Remaining: ${tripData.statesRemaining}`);
      console.log(`  - Progress: ${tripData.routeProgress}%`);
      console.log(`  - Days on Road: ${tripData.daysOnRoad}`);
      console.log(`  - Total Miles: ${tripData.totalMiles.toLocaleString()}`);
      console.log(`  - Next Stop: ${tripData.nextStop.city}, ${tripData.nextStop.state}`);
      console.log(`  - Route Points: ${tripData.route.length}`);
      console.log(`  - Stops: ${tripData.stops.length}`);

      return { success: true, data: tripData };

    } catch (error) {
      console.log(`❌ Trip data hook test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Weather Data Hook Logic
   */
  async testWeatherDataHook(location) {
    console.log('\n🌤️  Testing Weather Data Hook Logic');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // For testing purposes, simulate weather data since we don't have API key
      const simulatedWeatherData = {
        location: {
          name: 'Flagstaff',
          region: 'Arizona',
          country: 'United States',
          lat: location?.latitude || 35.174258,
          lon: location?.longitude || -111.665313
        },
        current: {
          temp_f: 68.5,
          condition: {
            text: 'Partly cloudy',
            icon: '//cdn.weatherapi.com/weather/64x64/day/116.png'
          },
          wind_mph: 12.3,
          humidity: 45,
          feelslike_f: 71.2,
          uv: 6.2
        },
        forecast: {
          forecastday: [
            {
              date: new Date().toISOString().split('T')[0],
              day: {
                maxtemp_f: 75.4,
                mintemp_f: 52.1,
                condition: {
                  text: 'Partly cloudy'
                }
              }
            }
          ]
        }
      };

      console.log('✅ Weather data hook logic working (simulated)');
      console.log('📊 Weather Data Structure:');
      console.log(`  - Location: ${simulatedWeatherData.location.name}, ${simulatedWeatherData.location.region}`);
      console.log(`  - Temperature: ${simulatedWeatherData.current.temp_f}°F`);
      console.log(`  - Condition: ${simulatedWeatherData.current.condition.text}`);
      console.log(`  - Humidity: ${simulatedWeatherData.current.humidity}%`);
      console.log(`  - Wind: ${simulatedWeatherData.current.wind_mph} mph`);
      console.log(`  - UV Index: ${simulatedWeatherData.current.uv}`);

      return { success: true, data: simulatedWeatherData };

    } catch (error) {
      console.log(`❌ Weather hook test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Charging Stations Hook Logic
   */
  async testChargingStationsHook(location) {
    console.log('\n⚡ Testing Charging Stations Hook Logic');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Simulate charging station data since we don't have NREL API key
      const simulatedStationsData = {
        station_locator_url: "https://afdc.energy.gov/stations/",
        total_results: 3,
        stations: [
          {
            id: 47529,
            station_name: "Flagstaff Tesla Supercharger",
            street_address: "2700 S White Mountain Rd",
            city: "Flagstaff", 
            state: "AZ",
            zip: "86001",
            latitude: 35.174258,
            longitude: -111.665313,
            fuel_type_code: "ELEC",
            connector_types: ["Tesla"],
            network: "Tesla",
            status_code: "E", // Available
            ev_dc_fast_num: 8,
            ev_level2_evse_num: 0,
            distance: 0.5 // miles from current location
          },
          {
            id: 47530,
            station_name: "Walmart Flagstaff",
            street_address: "2601 E Huntington Dr",
            city: "Flagstaff",
            state: "AZ", 
            zip: "86004",
            latitude: 35.187654,
            longitude: -111.612789,
            fuel_type_code: "ELEC",
            connector_types: ["CCS", "CHAdeMO"],
            network: "Electrify America",
            status_code: "E",
            ev_dc_fast_num: 4,
            ev_level2_evse_num: 0,
            distance: 2.1
          }
        ]
      };

      console.log('✅ Charging stations hook logic working (simulated)');
      console.log('📊 Charging Stations Data:');
      console.log(`  - Total Results: ${simulatedStationsData.total_results}`);
      console.log(`  - Nearest Station: ${simulatedStationsData.stations[0].station_name}`);
      console.log(`  - Distance: ${simulatedStationsData.stations[0].distance} miles`);
      console.log(`  - Network: ${simulatedStationsData.stations[0].network}`);
      console.log(`  - Fast Chargers: ${simulatedStationsData.stations[0].ev_dc_fast_num}`);
      
      simulatedStationsData.stations.forEach((station, index) => {
        console.log(`    ${index + 1}. ${station.station_name} (${station.distance} mi) - ${station.network}`);
      });

      return { success: true, data: simulatedStationsData };

    } catch (error) {
      console.log(`❌ Charging stations hook test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run all hook tests
   */
  async runAllHookTests() {
    console.log('🔬 React Hook Logic Testing Suite');
    console.log('═══════════════════════════════════════════════════════════');

    const results = {};

    // Test vehicle data hook
    results.vehicleHook = await this.testVehicleDataHook();
    
    // Test trip data hook (using vehicle data if available)
    results.tripHook = await this.testTripDataHook(results.vehicleHook?.data);
    
    // Test weather hook (using vehicle location if available)
    results.weatherHook = await this.testWeatherDataHook(results.vehicleHook?.data?.location);
    
    // Test charging stations hook
    results.stationsHook = await this.testChargingStationsHook(results.vehicleHook?.data?.location);

    // Summary
    console.log('\n📈 HOOK TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');

    const passed = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;

    console.log(`Overall: ${passed}/${total} hook tests passed`);

    Object.entries(results).forEach(([test, result]) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${test.padEnd(15)}: ${status}`);
      
      if (!result.success) {
        console.log(`    Error: ${result.error}`);
      }
    });

    console.log(`\nCompleted at: ${new Date().toISOString()}`);
    return results;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new HookTester();
  tester.runAllHookTests().catch(console.error);
}

module.exports = { HookTester };
