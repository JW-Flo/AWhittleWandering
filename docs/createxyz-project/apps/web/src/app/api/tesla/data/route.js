// Tesla data endpoint using Tessie API with AI-powered insights
export async function GET(request) {
  try {
    const tessieApiKey = process.env.TESSIE_API_KEY;
    const vehicleId = process.env.TESLA_VEHICLE_ID;

    if (!tessieApiKey) {
      return Response.json(
        { error: "Tessie API key not configured" },
        { status: 500 },
      );
    }

    if (!vehicleId) {
      return Response.json(
        { error: "Tesla Vehicle ID not configured" },
        { status: 500 },
      );
    }

    // Fetch vehicle state from Tessie API
    const vehicleResponse = await fetch(
      `https://api.tessie.com/${vehicleId}/state`,
      {
        headers: {
          Authorization: `Bearer ${tessieApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!vehicleResponse.ok) {
      throw new Error(`Tessie API error: ${vehicleResponse.status}`);
    }

    const vehicleData = await vehicleResponse.json();

    // Fetch historical trip data since 6/1/2025 (trip start date)
    const tripStartDate = new Date("2025-06-01T00:00:00Z");
    const now = new Date();

    // Get historical location data for the entire trip
    const historyResponse = await fetch(
      `https://api.tessie.com/${vehicleId}/location?start=${tripStartDate.toISOString()}&end=${now.toISOString()}`,
      {
        headers: {
          Authorization: `Bearer ${tessieApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    let tripWaypoints = [];
    let tripStats = {
      totalMiles: 0,
      totalTime: 0,
      chargingSessions: 0,
      startDate: tripStartDate.toISOString(),
    };

    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log(
        "Historical data received:",
        historyData.results?.length || 0,
        "points",
      );

      if (historyData.results && historyData.results.length > 0) {
        // Process historical locations into meaningful waypoints
        const locations = historyData.results;

        // Calculate total trip distance
        for (let i = 1; i < locations.length; i++) {
          const prev = locations[i - 1];
          const curr = locations[i];
          const distance = calculateDistance(prev, curr);
          tripStats.totalMiles += distance;
        }

        // Group locations by significant stops (where car was stationary for >15 mins)
        let significantStops = [];
        let currentStop = null;

        for (const location of locations) {
          if (!currentStop) {
            currentStop = { ...location, duration: 0, isCharging: false };
          } else {
            const distance = calculateDistance(currentStop, location);
            const timeDiff =
              new Date(location.timestamp) - new Date(currentStop.timestamp);

            if (distance < 0.1 && timeDiff < 900000) {
              // Same location, less than 15 mins
              currentStop.duration += timeDiff;
              // Check if this was a charging session
              if (location.charging_state === "Charging") {
                currentStop.isCharging = true;
                tripStats.chargingSessions++;
              }
            } else {
              if (currentStop.duration > 900000 || currentStop.isCharging) {
                // 15+ min stop or charging
                significantStops.push(currentStop);
              }
              currentStop = { ...location, duration: 0, isCharging: false };
            }
          }
        }

        // Add final stop
        if (
          currentStop &&
          (currentStop.duration > 900000 || currentStop.isCharging)
        ) {
          significantStops.push(currentStop);
        }

        // Convert significant stops to waypoints
        tripWaypoints = significantStops.map((stop, index) => ({
          id: `trip-${index}`,
          lat: stop.latitude,
          lng: stop.longitude,
          name: stop.address || `Stop ${index + 1}`,
          type: stop.isCharging ? "charging" : "waypoint",
          timestamp: stop.timestamp,
          address: stop.address,
          duration: Math.round(stop.duration / 60000), // minutes
          isCharging: stop.isCharging,
        }));

        tripStats.totalTime = (new Date() - tripStartDate) / (1000 * 60 * 60); // hours
      }
    }

    // Fetch nearby superchargers from current location
    try {
      const superchargerResponse = await fetch(
        `https://api.tessie.com/${vehicleId}/nearby_charging_sites`,
        {
          headers: {
            Authorization: `Bearer ${tessieApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (superchargerResponse.ok) {
        const superchargerData = await superchargerResponse.json();
        const superchargers =
          superchargerData.superchargers?.slice(0, 5).map((sc, index) => ({
            id: `supercharger-${index}`,
            lat: sc.latitude,
            lng: sc.longitude,
            name: sc.name,
            type: "supercharger",
            address: sc.address,
            available_stalls: sc.available_stalls,
            total_stalls: sc.total_stalls,
          })) || [];

        tripWaypoints = [...tripWaypoints, ...superchargers];
      }
    } catch (error) {
      console.error("Failed to fetch superchargers:", error);
    }

    // Format vehicle data with better error handling
    const formattedVehicleData = {
      batteryLevel: vehicleData.charge_state?.battery_level || 0,
      chargingState: vehicleData.charge_state?.charging_state || "Disconnected",
      chargePower: vehicleData.charge_state?.charger_power || 0,
      chargeRate: vehicleData.charge_state?.charge_rate || 0,
      location: vehicleData.drive_state
        ? {
            latitude: vehicleData.drive_state.latitude,
            longitude: vehicleData.drive_state.longitude,
          }
        : null,
      temperature: vehicleData.climate_state?.inside_temp
        ? Math.round((vehicleData.climate_state.inside_temp * 9) / 5 + 32)
        : null,
      outsideTemp: vehicleData.climate_state?.outside_temp
        ? Math.round((vehicleData.climate_state.outside_temp * 9) / 5 + 32)
        : null,
      efficiency: vehicleData.charge_state?.energy_added_rated
        ? Math.round(
            (vehicleData.charge_state.energy_added_rated * 1000) /
              Math.max(vehicleData.vehicle_state?.odometer || 1, 1),
          )
        : null,
      odometer: vehicleData.vehicle_state?.odometer || 0,
      speed: vehicleData.drive_state?.speed || 0,
      power: vehicleData.drive_state?.power || 0,
      range: vehicleData.charge_state?.battery_range || 0,
      estimatedRange: vehicleData.charge_state?.est_battery_range || 0,
      isCharging: vehicleData.charge_state?.charging_state === "Charging",
      timeToFullCharge: vehicleData.charge_state?.time_to_full_charge || 0,
      lastUpdated: new Date().toISOString(),
      // Trip statistics
      tripStats,
    };

    // Get AI-powered insights based on real data
    let aiInsights = null;
    try {
      const insightsResponse = await fetch(
        "/integrations/chat-gpt/conversationgpt4",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are an AI assistant for a Tesla road trip tracking app. The user is on a road trip that started on June 1st, 2025 from Monroe, NC. Generate concise, encouraging driving insights based on vehicle data and trip progress.",
              },
              {
                role: "user",
                content: `Current Trip Status (Started 6/1/2025 from Monroe, NC):
- Battery: ${formattedVehicleData.batteryLevel}%
- Range: ${formattedVehicleData.range} miles  
- Speed: ${formattedVehicleData.speed} mph
- ${formattedVehicleData.chargingState === "Charging" ? `Charging at ${formattedVehicleData.chargePower}kW` : `Driving/Stopped`}
- Trip Distance: ${Math.round(tripStats.totalMiles)} miles
- Charging Sessions: ${tripStats.chargingSessions}
- Trip Duration: ${Math.round(tripStats.totalTime)} hours

Generate a brief, encouraging insight about the trip progress and current status.`,
              },
            ],
            json_schema: {
              name: "tesla_trip_insights",
              schema: {
                type: "object",
                properties: {
                  insight: { type: "string" },
                  recommendation: { type: "string" },
                  efficiency_rating: { type: "string" },
                },
                required: ["insight", "recommendation", "efficiency_rating"],
                additionalProperties: false,
              },
            },
          }),
        },
      );

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        aiInsights = JSON.parse(insightsData.choices[0].message.content);
      }
    } catch (error) {
      console.error("AI insights error:", error);
    }

    // Get weather data for Monroe, NC area
    let weatherData = null;
    try {
      const weatherResponse = await fetch(
        `/integrations/weather-by-city/weather/Monroe, NC`,
      );
      if (weatherResponse.ok) {
        weatherData = await weatherResponse.json();
      }
    } catch (error) {
      console.error("Weather fetch error:", error);
    }

    return Response.json({
      vehicle: formattedVehicleData,
      waypoints: tripWaypoints,
      insights: aiInsights,
      weather: weatherData,
      success: true,
    });
  } catch (error) {
    console.error("Tesla API Error:", error);

    // Enhanced mock data for Monroe, NC area
    const mockData = {
      vehicle: {
        batteryLevel: 78,
        chargingState: "Disconnected",
        chargePower: 0,
        chargeRate: 0,
        location: {
          latitude: 35.0001 + (Math.random() - 0.5) * 0.01, // Monroe, NC coordinates
          longitude: -80.5493 + (Math.random() - 0.5) * 0.01,
        },
        temperature: 72,
        outsideTemp: 68,
        efficiency: 285,
        odometer: 15420 + Math.floor(Math.random() * 1000),
        speed: Math.floor(Math.random() * 20),
        power: 0,
        range: 312,
        estimatedRange: 298,
        isCharging: false,
        timeToFullCharge: 0,
        lastUpdated: new Date().toISOString(),
        tripStats: {
          totalMiles: Math.floor(Math.random() * 500) + 200,
          totalTime: Math.floor(Math.random() * 48) + 24,
          chargingSessions: Math.floor(Math.random() * 8) + 3,
          startDate: "2025-06-01T00:00:00Z",
        },
      },
      waypoints: [
        {
          id: "monroe-start",
          lat: 35.0001,
          lng: -80.5493,
          name: "Trip Start - Monroe, NC",
          type: "waypoint",
          timestamp: "2025-06-01T08:00:00Z",
          address: "Monroe, NC",
        },
        {
          id: "charlotte-charge",
          lat: 35.2271,
          lng: -80.8431,
          name: "Tesla Supercharger - Charlotte",
          type: "charging",
          address: "Charlotte, NC",
          duration: 45,
          isCharging: true,
        },
      ],
      insights: {
        insight: `Great progress on your road trip from Monroe! You've covered impressive miles with efficient driving.`,
        recommendation:
          "Your battery level looks good for continued travel. Consider your next charging stop based on your planned route.",
        efficiency_rating: "Excellent",
      },
      weather: {
        location: { name: "Monroe", region: "North Carolina", country: "USA" },
        current: {
          temp_f: 75,
          condition: {
            text: "Partly cloudy",
            icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
          },
          wind_mph: 8.5,
          humidity: 65,
        },
      },
      success: true,
      demo: true,
    };

    return Response.json(mockData);
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(loc1, loc2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.latitude * Math.PI) / 180) *
      Math.cos((loc2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
