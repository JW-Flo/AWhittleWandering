import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Custom middleware to simulate Cloudflare Function for local development
const simulateCloudflareFunction = (req, res, next) => {
  if (req.url === '/route') {
    try {
      // Import the function handler from our route.js file
      const functionPath = path.resolve('../../functions/route.js');
      delete require.cache[require.resolve(functionPath)]; // Clear cache to get latest changes
      const routeHandler = require(functionPath);

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
  plugins: [],
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
    open: true,
    middleware: [simulateCloudflareFunction]
  }
});
