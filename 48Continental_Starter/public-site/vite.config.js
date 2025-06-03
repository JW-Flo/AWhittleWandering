/* eslint-env node */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Import simulated data generators from our API
const SIMULATED_API_PATH = '../../src/api';

// API simulation middleware for local development
const simulateApiEndpoints = async (req, res, next) => {
  // Define API endpoint handlers
  const apiHandlers = {
    '/api/vehicle': async () => {
      // Import simulated vehicle data generator directly from simulation file
      const { generateSimulatedVehicleData } = await import(`${SIMULATED_API_PATH}/vehicleSimulation.js`);
      return generateSimulatedVehicleData();
    },
    '/api/weather': async () => {
      // Import simulated weather data generator
      const { generateSimulatedWeatherData } = await import(`${SIMULATED_API_PATH}/weatherApi.js`);
      return generateSimulatedWeatherData();
    },
    '/api/trip': async () => {
      // Import simulated trip data generator directly from simulation file
      const { generateSimulatedTripData } = await import(`${SIMULATED_API_PATH}/tripSimulation.js`);
      return generateSimulatedTripData();
    },
    '/api/charging': async () => {
      // Import simulated charging data generator
      const { generateSimulatedChargingStations } = await import(`${SIMULATED_API_PATH}/chargingApi.js`);
      // Use center of USA as default coordinates
      return generateSimulatedChargingStations(39.8283, -98.5795, 50);
    }
  };

  // Check if the request is for one of our API endpoints
  const handler = apiHandlers[req.url];
  if (handler) {
    try {
      // Generate simulated data
      Promise.resolve(handler())
        .then(data => {
          // Set headers and send JSON response
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(data));
        })
        .catch(error => {
          console.error(`Error in API simulation (${req.url}):`, error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        });
    } catch (error) {
      console.error(`Failed to execute API simulation (${req.url}):`, error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  } else if (req.url === '/route') {
    try {
      // Import the function handler from our route.js file
      const functionPath = path.resolve('../../functions/route.js');
      // Clear cache using dynamic import instead of require
      const routeHandler = await import(functionPath);

      // Execute the function
      Promise.resolve(routeHandler.onRequestGet())
        .then(response => {
          // Extract content and headers from Cloudflare Response
          return response.text().then(body => ({
            body,
            headers: Object.fromEntries(response.headers)
          }));
        })
        .then(({ body, headers }) => {
          // Set headers
          Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
          
          // Send response
          res.statusCode = 200;
          res.end(body);
        })
        .catch(error => {
          console.error('Error in route function:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        });
    } catch (error) {
      console.error('Failed to execute function:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  } else {
    next();
  }
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'simulate-api-plugin',
      configureServer(server) {
        server.middlewares.use(simulateApiEndpoints);
      }
    }
  ],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
