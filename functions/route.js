/**
 * 48 Continental USA Trip Data Route Handler
 * 
 * This serverless function provides real-time data integration for:
 * - Tesla vehicle status via Tesla API
 * - Route information via MapBox API
 * - Weather data via OpenWeather API
 * - Trip statistics based on planned itinerary
 */

/* global Response */

// Mock data for development purposes
module.exports.onRequestGet = async () => {
  // Generate slightly different data each time to simulate movement
  const now = new Date();
  const batteryLevel = 65 + Math.floor(Math.sin(now.getMinutes() / 10) * 15);
  const speed = Math.floor(Math.random() * 65);
  const power = speed > 0 ? 10 + Math.floor(Math.random() * 20) : 0;
  const range = (batteryLevel / 100) * 330; // 330 mile max range
  const currentTemp = 68 + Math.floor(Math.sin(now.getMinutes() / 15) * 10);
  
  // Current state data - simulate Missouri driving toward Iowa
  const currentState = "Missouri";
  const nextState = "Iowa";
  const currentLat = 40.3786 + (Math.random() * 0.05 - 0.025);
  const currentLng = -94.7147 + (Math.random() * 0.05 - 0.025);
  const visitedStates = ["Texas", "Oklahoma", "Kansas", "Missouri"];
  
  // Timeline representing past and upcoming states
  const timeline = [
    {
      location: "Kansas City, Missouri",
      date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      description: "Enjoying the city views and BBQ"
    },
    {
      location: "Des Moines, Iowa",
      date: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      description: "Planning to visit the State Capitol"
    },
    {
      location: "Minneapolis, Minnesota",
      date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      description: "Looking forward to the Twin Cities"
    },
    {
      location: "Madison, Wisconsin",
      date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      description: "Will explore the university area"
    }
  ];
  
  // Route coordinates - simplified route from Missouri to Iowa
  const route = {
    type: "LineString",
    coordinates: [
      [-94.7147, 40.3786], // Starting point
      [-94.6680, 40.5987],
      [-94.6398, 40.7121],
      [-94.5846, 40.8245],
      [-94.5110, 40.9368],
      [-94.3977, 41.0245],
      [-94.2123, 41.1988],
      [-94.0112, 41.3248],
      [-93.8001, 41.4987],
      [-93.6659, 41.6005], // Des Moines area
      [-93.5128, 41.6841],
      [-93.3647, 41.7789],
      [-93.2010, 41.9056],
      [-93.0502, 42.0347],
      [-92.9098, 42.1679],
      [-92.7613, 42.3012],
      [-92.6248, 42.4410],
      [-92.4893, 42.5847],
      [-92.3553, 42.7286],
      [-92.2229, 42.8726],
      [-92.0925, 43.0166],
      [-91.9631, 43.1607],
      [-91.8350, 43.3048],
      [-91.7085, 43.4489],
      [-91.5820, 43.5930] // End point
    ]
  };
  
  // Mock weather data
  const weatherData = {
    temperature: currentTemp,
    condition: currentTemp > 75 ? "Sunny" : "Partly Cloudy",
    icon: currentTemp > 75 ? "01d" : "02d",
    humidity: 45 + Math.floor(Math.random() * 20),
    windSpeed: 5 + Math.floor(Math.random() * 10)
  };
  
  // Construct response object
  const responseData = {
    timestamp: now.toISOString(),
    vehicle: {
      batteryLevel,
      range,
      speed,
      power
    },
    weather: weatherData,
    location: {
      current: `${timeline[0].location}`,
      next: `${timeline[1].location}`,
      eta: timeline[1].date,
      currentLat,
      currentLng
    },
    trip: {
      route,
      timeline,
      distanceToNext: 168,
      durationToNext: 180,
      chargingStops: 1,
      visitedStates
    }
  };
  
  // Return JSON response
  return new Response(JSON.stringify(responseData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
};
