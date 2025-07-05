/**
 * Enhanced Vehicle Stream Handler
 * 
 * Integrates the robust VehicleTracker with Cloudflare WebSockets
 * for real-time vehicle telemetry streaming with error handling,
 * reconnection logic, and data validation.
 */

import { TeslaAPIClient } from './utils/tesla-client';
import { getToken, setToken } from './utils/tesla-tokens';
import { VehicleTracker } from './utils/vehicle-tracker';
import { logError, logInfo, logWarning } from './utils/monitoring';
import type { Env } from './index';

// Store active vehicle trackers
const VEHICLE_TRACKERS = new Map<string, {
  tracker: VehicleTracker;
  connections: Map<WebSocket, string>;
  lastPoll: number;
}>();

// Store all active WebSocket connections
const WEBSOCKET_CONNECTIONS = new Map<string, WebSocket>();

// Configuration
const POLL_INTERVAL = 5000;      // 5 seconds between polls
const MAX_CONNECTIONS = 100;     // Limit total number of connections
const INACTIVE_TIMEOUT = 300000; // 5 minutes of inactivity before cleanup

/**
 * Handle HTTP request for enhanced WebSocket connection to vehicle data stream
 * @param {Request} request - The incoming request
 * @param {Env} env - Environment variables and bindings
 * @returns {Response} WebSocket upgrade response or error
 */
export async function handleVehicleStream(request: Request, env: Env): Promise<Response> {
  // Check if it's a WebSocket request
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { 
      status: 426,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  // Get vehicle ID from URL
  const url = new URL(request.url);
  const vehicleId = url.searchParams.get('id');
  
  if (!vehicleId) {
    return new Response('Missing vehicle ID parameter', { 
      status: 400,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
  
  // Check if we've reached connection limit
  if (WEBSOCKET_CONNECTIONS.size >= MAX_CONNECTIONS) {
    logWarning({
      message: "Maximum connection limit reached",
      connectionCount: WEBSOCKET_CONNECTIONS.size,
      maxConnections: MAX_CONNECTIONS
    });
    
    return new Response('Too many connections', { 
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '60'
      }
    });
  }

  // Get Tesla API tokens
  const token = await getToken(env);
  if (!token) {
    return new Response('Authentication required', { 
      status: 401,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
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
      return new Response('Vehicle not found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logError({
      message: 'Error verifying vehicle access',
      vehicleId,
      error: errorMessage
    });
    
    // Check for auth errors specifically
    if (errorMessage.includes('401') || 
        errorMessage.includes('auth') || 
        errorMessage.includes('token')) {
      return new Response('Authentication failed', { 
        status: 401,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
    
    return new Response('Failed to verify vehicle access', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  // Create WebSocket pair for Cloudflare Workers
  // Using any type for Cloudflare Workers specific API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pair = new (globalThis as any).WebSocketPair();
  const serverSocket = pair[0];
  const clientSocket = pair[1];
  
  // Accept the WebSocket connection
  serverSocket.accept();
  
  // Generate a unique connection ID
  const connectionId = generateConnectionId(vehicleId);
  
  // Store the WebSocket connection
  WEBSOCKET_CONNECTIONS.set(connectionId, serverSocket);
  
  // Get or create tracker for this vehicle
  const trackerInfo = VEHICLE_TRACKERS.get(vehicleId) || createVehicleTracker(vehicleId, client);
  
  // Add this connection to the tracker
  trackerInfo.connections.set(serverSocket, connectionId);
  
  // Update tracker in the store
  VEHICLE_TRACKERS.set(vehicleId, trackerInfo);
  
  // Handle WebSocket events
  setupSocketListeners(serverSocket, vehicleId, connectionId, trackerInfo, client, env);
  
  // Start polling if not already active
  if (Date.now() - trackerInfo.lastPoll > POLL_INTERVAL) {
    pollVehicleData(vehicleId, client, env);
  }
  
  logInfo({
    message: "WebSocket connection established",
    vehicleId,
    connectionId,
    activeConnections: trackerInfo.connections.size,
    totalConnections: WEBSOCKET_CONNECTIONS.size
  });

  // Return the client WebSocket
  return new Response(null, {
    status: 101,
    // @ts-expect-error - webSocket is specific to Cloudflare Workers
    webSocket: clientSocket,
  });
}

/**
 * Setup WebSocket event listeners
 * @param socket - Server WebSocket
 * @param vehicleId - Vehicle identifier
 * @param connectionId - Unique connection ID
 * @param trackerInfo - Vehicle tracker information
 * @param client - Tesla API client
 * @param env - Environment variables
 */
function setupSocketListeners(
  socket: WebSocket, 
  vehicleId: string, 
  connectionId: string,
  trackerInfo: {
    tracker: VehicleTracker;
    connections: Map<WebSocket, string>;
    lastPoll: number;
  },
  client: TeslaAPIClient,
  env: Env
): void {
  // Handle close event
  socket.addEventListener('close', () => {
    // Remove connection from tracker
    trackerInfo.connections.delete(socket);
    
    // Remove from connections map
    WEBSOCKET_CONNECTIONS.delete(connectionId);
    
    logInfo({
      message: "WebSocket connection closed",
      vehicleId,
      connectionId,
      remainingConnections: trackerInfo.connections.size,
      totalConnections: WEBSOCKET_CONNECTIONS.size
    });
    
    // If no more connections for this vehicle, cleanup after a delay
    // This gives clients time to reconnect without losing state
    if (trackerInfo.connections.size === 0) {
      setTimeout(() => {
        // Check if there are still no connections
        const currentTrackerInfo = VEHICLE_TRACKERS.get(vehicleId);
        if (currentTrackerInfo && currentTrackerInfo.connections.size === 0) {
          // Clean up the tracker
          currentTrackerInfo.tracker.destroy();
          VEHICLE_TRACKERS.delete(vehicleId);
          
          logInfo({
            message: "Vehicle tracker cleaned up due to inactivity",
            vehicleId,
            totalActiveTrackers: VEHICLE_TRACKERS.size
          });
        }
      }, INACTIVE_TIMEOUT);
    }
  });

  // Handle error event
  socket.addEventListener('error', (error) => {
    logError({
      message: "WebSocket error",
      vehicleId,
      connectionId,
      error: String(error)
    });
    
    // Close and cleanup will be handled by the close event
  });
  
  // Handle incoming messages (e.g., commands)
  socket.addEventListener('message', async (event) => {
    try {
      const message = JSON.parse(event.data as string);
      
      // Handle commands from client
      if (message.command) {
        switch (message.command) {
          case 'refresh':
            // Force immediate data refresh
            await pollVehicleData(vehicleId, client, env);
            break;
            
          case 'ping':
            // Simple ping/pong for connection testing
            socket.send(JSON.stringify({ 
              type: 'pong',
              timestamp: Date.now()
            }));
            break;
            
          default:
            // Unknown command
            socket.send(JSON.stringify({
              error: 'unknown_command',
              message: `Unknown command: ${message.command}`
            }));
        }
      }
    } catch (error) {
      logWarning({
        message: "Error processing WebSocket message",
        vehicleId,
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Notify client of error
      try {
        socket.send(JSON.stringify({
          error: 'message_processing_error',
          message: 'Failed to process message'
        }));
      } catch (sendError) {
        // Socket might be closed already
      }
    }
  });
}

/**
 * Create a new vehicle tracker
 * @param vehicleId - Vehicle identifier
 * @param client - Tesla API client
 * @returns Tracker info object
 */
function createVehicleTracker(vehicleId: string): {
  tracker: VehicleTracker;
  connections: Map<WebSocket, string>;
  lastPoll: number;
} {
  const tracker = new VehicleTracker({
    vehicleId,
    
    // Handle data updates
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onData: (telemetry) => {
      // Nothing to do here - we broadcast data in the poll function
    },
    
    // Handle errors
    onError: (error: Error, context?: Record<string, unknown>) => {
      logError({
        message: "Vehicle tracker error",
        vehicleId,
        error: error.message,
        context
      });
    },
    
    // Handle connection status changes
    onConnectionChange: (status) => {
      logInfo({
        message: `Vehicle tracker connection status: ${status}`,
        vehicleId,
        status
      });
      
      // Broadcast connection status to all clients
      broadcastToVehicle(vehicleId, {
        type: 'connection_status',
        status,
        timestamp: Date.now()
      });
    }
  });
  
  return {
    tracker,
    connections: new Map<WebSocket, string>(),
    lastPoll: 0
  };
}

/**
 * Poll for vehicle data and broadcast to connected clients
 * @param vehicleId - Vehicle identifier
 * @param client - Tesla API client 
 * @param env - Environment variables
 */
async function pollVehicleData(vehicleId: string, client: TeslaAPIClient, env: Env): Promise<void> {
  const trackerInfo = VEHICLE_TRACKERS.get(vehicleId);
  if (!trackerInfo || trackerInfo.connections.size === 0) {
    return; // No connections for this vehicle
  }
  
  // Update last poll time
  trackerInfo.lastPoll = Date.now();
  
  try {
    // Fetch vehicle data from Tesla API
    const data = await client.getVehicleData(vehicleId);
    
    // Process data through tracker (validates and normalizes)
    const telemetry = trackerInfo.tracker.processVehicleData(data);
    
    // Broadcast to all connected clients
    broadcastToVehicle(vehicleId, {
      type: 'vehicle_data',
      ...telemetry,
      timestamp: Date.now()
    });
    
    // Schedule next poll
    setTimeout(() => {
      pollVehicleData(vehicleId, client, env);
    }, POLL_INTERVAL);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logError({
      message: "Error fetching vehicle data",
      vehicleId,
      error: errorMessage
    });
    
    // Check for auth errors
    if (errorMessage.includes('401') || 
        errorMessage.includes('expired') || 
        errorMessage.includes('token')) {
      
      try {
        // Attempt to refresh tokens
        const newToken = await client.refreshTokens();
        
        // Update client with new tokens
        client.updateTokens(newToken.access_token, newToken.refresh_token);
        
        // Store the new tokens for future use
        await setToken(env, newToken);
        
        // Notify clients of reconnection
        broadcastToVehicle(vehicleId, { 
          type: 'status',
          status: 'reconnecting',
          message: 'Refreshed authentication, reconnecting...'
        });
        
        // Try again after a short delay
        setTimeout(() => {
          pollVehicleData(vehicleId, client, env);
        }, 1000);
        
      } catch (refreshError) {
        // Failed to refresh tokens
        const refreshErrorMsg = refreshError instanceof Error ? refreshError.message : String(refreshError);
        
        logError({
          message: "Failed to refresh authentication token",
          vehicleId,
          error: refreshErrorMsg
        });
        
        // Notify clients of authentication failure
        broadcastToVehicle(vehicleId, { 
          type: 'error',
          error: 'authentication_failed',
          message: 'Failed to refresh authentication token'
        });
        
        // Try again after a longer delay
        setTimeout(() => {
          pollVehicleData(vehicleId, client, env);
        }, 30000);
      }
    } else {
      // Not an auth error, just retry after delay
      broadcastToVehicle(vehicleId, { 
        type: 'error',
        error: 'data_fetch_failed',
        message: 'Failed to fetch vehicle data, retrying...'
      });
      
      // Use exponential backoff for retries
      // We don't have access to the private retry count, so start with a default
      const retryDelay = Math.min(30000, 5000);
      
      setTimeout(() => {
        pollVehicleData(vehicleId, client, env);
      }, retryDelay);
    }
  }
}

/**
 * Broadcast a message to all connections for a vehicle
 * @param vehicleId - Vehicle identifier
 * @param message - Message to broadcast
 */
function broadcastToVehicle(vehicleId: string, message: Record<string, unknown>): void {
  const trackerInfo = VEHICLE_TRACKERS.get(vehicleId);
  if (!trackerInfo) return;
  
  const serializedMessage = JSON.stringify(message);
  const deadConnections: WebSocket[] = [];
  
  // Send to all connections for this vehicle
  for (const [socket] of trackerInfo.connections) {
    try {
      if (socket.readyState === 1) { // WebSocket.OPEN
        socket.send(serializedMessage);
      } else {
        deadConnections.push(socket);
      }
    } catch (error) {
      deadConnections.push(socket);
      logWarning({
        message: "Error sending to WebSocket",
        vehicleId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Clean up dead connections
  if (deadConnections.length > 0) {
    for (const socket of deadConnections) {
      const connectionId = trackerInfo.connections.get(socket);
      if (connectionId) {
        WEBSOCKET_CONNECTIONS.delete(connectionId);
      }
      trackerInfo.connections.delete(socket);
      
      try {
        socket.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    
    logInfo({
      message: "Cleaned up dead connections",
      vehicleId,
      removedCount: deadConnections.length,
      remainingCount: trackerInfo.connections.size
    });
  }
}

/**
 * Generate a unique connection ID
 * @param vehicleId - Vehicle identifier
 * @returns Unique connection ID
 */
function generateConnectionId(vehicleId: string): string {
  return `${vehicleId}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Cleanup inactive trackers and connections
 * This should be called periodically to free up resources
 */
export function cleanupInactiveTrackers(): void {
  const now = Date.now();
  const inactiveThreshold = now - INACTIVE_TIMEOUT;
  
  for (const [vehicleId, trackerInfo] of VEHICLE_TRACKERS.entries()) {
    // Check if tracker has been inactive
    if (trackerInfo.lastPoll < inactiveThreshold && trackerInfo.connections.size === 0) {
      // Clean up the tracker
      trackerInfo.tracker.destroy();
      VEHICLE_TRACKERS.delete(vehicleId);
      
      logInfo({
        message: "Cleaned up inactive vehicle tracker",
        vehicleId,
        lastPollAgo: now - trackerInfo.lastPoll
      });
    }
  }
  
  logInfo({
    message: "Tracker cleanup complete",
    activeTrackers: VEHICLE_TRACKERS.size,
    activeConnections: WEBSOCKET_CONNECTIONS.size
  });
}

// Export for testing
export const _internal = {
  VEHICLE_TRACKERS,
  WEBSOCKET_CONNECTIONS
};
