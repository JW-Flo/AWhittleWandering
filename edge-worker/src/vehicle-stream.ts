/**
 * Cloudflare Worker: Tesla Vehicle WebSocket Stream
 * Provides real-time vehicle data streaming via WebSockets.
 * 
 * This endpoint creates a persistent connection to stream vehicle data
 * to connected clients in real-time.
 */

import { TeslaAPIClient } from './utils/tesla-client';
import { getToken, setToken } from './utils/tesla-tokens';

// WebSocket connections store
const CONNECTIONS = new Map<string, WebSocket>();

// Polling interval in milliseconds
const POLL_INTERVAL = 5000;

// Define Cloudflare Worker types
interface KVNamespace {
  get(key: string, options?: { type?: string }): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

// Define types for Cloudflare Workers environment
interface Env {
  TESLA_CLIENT_ID?: string;
  TESLA_CLIENT_SECRET?: string;
  TESLA_KV?: KVNamespace;
  DB?: unknown; // D1 database if available
}

/**
 * Handle HTTP request for WebSocket connection to vehicle data stream
 * @param {Request} request - The incoming request
 * @param {Env} env - Environment variables and bindings
 * @returns {Response} WebSocket upgrade response or error
 */
export async function onRequest(request: Request, env: Env): Promise<Response> {
  // Check if it's a WebSocket request
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // Get vehicle ID from URL
  const url = new URL(request.url);
  const vehicleId = url.searchParams.get('id');
  if (!vehicleId) {
    return new Response('Missing vehicle ID', { status: 400 });
  }

  // Get Tesla API tokens
  const token = await getToken(env);
  if (!token) {
    return new Response('Tesla token not set', { status: 401 });
  }

  const client = new TeslaAPIClient({
    clientId: env.TESLA_CLIENT_ID || '',
    clientSecret: env.TESLA_CLIENT_SECRET || '',
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
  });

  // Verify vehicle exists and is accessible
  try {
    const vehicles = await client.listVehicles();
    const vehicle = vehicles.find(v => v.id_s === vehicleId);
    if (!vehicle) {
      return new Response('Vehicle not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error verifying vehicle:', error);
    return new Response('Failed to verify vehicle access', { status: 500 });
  }

  // Create WebSocket pair for Cloudflare Workers
  // This is a Cloudflare Worker-specific API, not in standard TypeScript types
  // @ts-expect-error WebSocketPair is a Cloudflare Workers API
  const pair = new WebSocketPair();
  const server = pair[0];
  const client_ws = pair[1];

  // Accept the WebSocket connection
  server.accept();

  let pollInterval: number | undefined;
  let isClosed = false;

  // Set up polling to fetch and send vehicle data
  const startPolling = async (): Promise<void> => {
    try {
      // Get initial data
      const data = await client.getVehicleData(vehicleId);
      server.send(JSON.stringify(data));

      // Set up polling interval
      // @ts-expect-error - setInterval in Cloudflare Workers
      pollInterval = setInterval(async () => {
        if (isClosed) {
          if (pollInterval !== undefined) {
            clearInterval(pollInterval);
          }
          return;
        }

        try {
          const data = await client.getVehicleData(vehicleId);
          server.send(JSON.stringify(data));
        } catch (error: unknown) {
          console.error('Error fetching vehicle data:', error);
          
          // Try to refresh token if unauthorized
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('401') || errorMessage.includes('expired')) {
            try {
              const newToken = await client.refreshTokens();
              
              // Update client with new tokens
              client.updateTokens(newToken.access_token, newToken.refresh_token);
              
              // Also store the new tokens for future use
              await setToken(env, newToken);
              
              // Notify client of reconnection
              server.send(JSON.stringify({ 
                status: 'reconnecting',
                message: 'Refreshed authentication, reconnecting...'
              }));
            } catch (refreshError) {
              console.error('Failed to refresh token:', refreshError);
              server.send(JSON.stringify({ 
                error: 'authentication_failed',
                message: 'Failed to refresh authentication token'
              }));
              server.close(1011, 'Authentication failed');
            }
          } else {
            server.send(JSON.stringify({ 
              error: 'data_fetch_failed',
              message: 'Failed to fetch vehicle data'
            }));
          }
        }
      }, POLL_INTERVAL);
    } catch (error) {
      console.error('Error starting vehicle data stream:', error);
      server.send(JSON.stringify({ 
        error: 'stream_start_failed',
        message: 'Failed to start vehicle data stream'
      }));
      server.close(1011, 'Failed to start stream');
    }
  };

  // Handle WebSocket events
  server.addEventListener('close', () => {
    isClosed = true;
    if (pollInterval !== undefined) {
      clearInterval(pollInterval);
    }
    CONNECTIONS.delete(vehicleId);
    console.log(`WebSocket connection closed for vehicle ${vehicleId}`);
  });

  server.addEventListener('error', (error) => {
    console.error(`WebSocket error for vehicle ${vehicleId}:`, error);
    isClosed = true;
    if (pollInterval !== undefined) {
      clearInterval(pollInterval);
    }
    CONNECTIONS.delete(vehicleId);
  });

  // Store the connection
  CONNECTIONS.set(vehicleId, server);
  
  // Start polling for vehicle data
  startPolling();

  // Return the client WebSocket
  return new Response(null, {
    status: 101,
    // @ts-expect-error - webSocket is specific to Cloudflare Workers
    webSocket: client_ws,
  });
}
