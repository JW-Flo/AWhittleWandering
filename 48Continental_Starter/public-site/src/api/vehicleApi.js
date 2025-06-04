/**
 * Vehicle API Handler using Tessie API
 * 
 * This module handles interactions with the Tesla API via Tessie
 * to get resilient, cached, and rate-limited vehicle data.
 * 
 * Enhanced for "The Wandering Whittle" public site to provide
 * real-time Tesla data appropriate for sharing with family and friends.
 */

/* eslint-env browser */
import axios from 'axios';

/**
 * Generate simulated vehicle data for testing
 * @returns {Object} Simulated vehicle data
 */
export { generateSimulatedVehicleData } from './vehicleSimulation';

/**
 * Constants
 */
const DEFAULT_VEHICLE_VIN = import.meta.env.VITE_VEHICLE_VIN;
const TESSIE_API_BASE_URL = 'https://api.tessie.com';
const WEBSOCKET_URL = 'wss://streaming.tessie.com';

/**
 * Fetch current vehicle data from Tesla API via Tessie
 * @param {string} [vin=DEFAULT_VEHICLE_VIN] - Vehicle VIN
 * @returns {Promise<Object>} Vehicle data
 */
export const fetchVehicleData = async (vin = DEFAULT_VEHICLE_VIN) => {
  const TESSIE_API_TOKEN = import.meta.env.VITE_TESSIE_API_TOKEN;
  
  if (!TESSIE_API_TOKEN) {
    console.error('Missing Tessie API token in environment variables');
    throw new Error('Configuration error: Missing Tessie API token');
  }
  
  try {
    // We're using a Cloudflare Worker as a proxy to avoid CORS issues and add caching
    const response = await fetch('/api/vehicle', {
      headers: {
        'Authorization': `Bearer ${TESSIE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vehicle API error:', response.status, errorText);
      throw new Error(`Vehicle API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return transformTessieData(data);
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    throw error;
  }
};

/**
 * Transform Tessie API data to our application format
 * @param {Object} tessieData - Raw data from Tessie API
 * @returns {Object} Transformed vehicle data
 */
const transformTessieData = (tessieData) => {
  // If we're getting simulated data or our own format already
  if (tessieData?.id && tessieData?.batteryLevel) {
    return tessieData;
  }
  
  // Extract the vehicle data from Tessie's response
  const vehicle = tessieData.response?.vehicle || tessieData;
  
  // Transform to our application's expected format
  return {
    id: vehicle.id_s || vehicle.id || 'unknown',
    name: vehicle.display_name || 'Tesla',
    model: vehicle.vehicle_config?.car_type || 'Model 3',
    batteryLevel: vehicle.charge_state?.battery_level || 0,
    range: vehicle.charge_state?.battery_range || 0,
    speed: vehicle.drive_state?.speed || 0,
    power: vehicle.drive_state?.power || 0,
    charging: !!vehicle.charge_state?.charging_state?.includes('Charging'),
    location: {
      latitude: vehicle.drive_state?.latitude || 0,
      longitude: vehicle.drive_state?.longitude || 0,
      heading: vehicle.drive_state?.heading || 0
    },
    temperature: {
      inside: vehicle.climate_state?.inside_temp || 0,
      outside: vehicle.climate_state?.outside_temp || 0
    },
    climate: {
      enabled: vehicle.climate_state?.is_climate_on || false,
      temperature: vehicle.climate_state?.driver_temp_setting || 0
    },
    locked: vehicle.vehicle_state?.locked || false,
    sentry_mode: vehicle.vehicle_state?.sentry_mode || false,
    tire_pressure: {
      front_left: vehicle.vehicle_state?.tire_pressure?.front_left || 0,
      front_right: vehicle.vehicle_state?.tire_pressure?.front_right || 0,
      rear_left: vehicle.vehicle_state?.tire_pressure?.rear_left || 0,
      rear_right: vehicle.vehicle_state?.tire_pressure?.rear_right || 0
    },
    last_updated: new Date().toISOString()
  };
};

/**
 * Create a WebSocket connection for real-time vehicle data streaming
 * @param {string} vehicleId - The vehicle ID to stream data for
 * @param {Function} onData - Callback function for data updates
 * @param {Function} onError - Callback function for errors
 * @param {Function} onStatusChange - Callback function for connection status changes
 * @returns {Object} WebSocket connection controller
 */
export const createVehicleDataStream = (vehicleId, onData, onError, onStatusChange) => {
  // Configuration
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000; // Start with 1 second delay
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let heartbeatInterval = null;
  let lastMessageTime = Date.now();
  let messageBuffer = [];
  let socket = null;
  
  // Get the WebSocket endpoint from environment variables
  const wsEndpoint = import.meta.env.VITE_WEBSOCKET_ENDPOINT || null;
  
  if (!wsEndpoint) {
    const errorMessage = 'Missing WebSocket endpoint in environment variables';
    console.error(errorMessage);
    if (onError) onError(new Error(errorMessage));
    if (onStatusChange) onStatusChange('failed');
    return null;
  }
  
  // Use the appropriate WebSocket URL
  const wsUrl = `${wsEndpoint}/${vehicleId}`;
  
  // Update connection status
  const updateStatus = (status) => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  };
  
  // Function to start heartbeat monitoring
  const startHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = setInterval(() => {
      // Check if we've received a message in the last 30 seconds
      const now = Date.now();
      if (now - lastMessageTime > 30000) {
        console.warn('WebSocket heartbeat missed, reconnecting...');
        // Connection is stale, close and reconnect
        if (socket) {
          socket.close();
          // Let the onclose handler handle reconnection
        }
      } else {
        // Send a ping if the socket is open
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }
    }, 15000); // Check every 15 seconds
  };
  
  // Function to connect WebSocket
  const connect = () => {
    try {
      updateStatus('connecting');
      
      // Create a new WebSocket connection
      socket = new WebSocket(wsUrl);
      
      // Connection opened
      socket.onopen = () => {
        console.log('Vehicle data stream connected');
        updateStatus('connected');
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        lastMessageTime = Date.now();
        
        // Start heartbeat monitoring
        startHeartbeat();
        
        // If we have buffered messages, process them
        if (messageBuffer.length > 0) {
          console.log(`Processing ${messageBuffer.length} buffered messages`);
          messageBuffer.forEach(msg => onData(msg));
          messageBuffer = []; // Clear buffer after processing
        }
      };
      
      // Listen for messages
      socket.onmessage = (event) => {
        lastMessageTime = Date.now(); // Update last message timestamp
        
        try {
          const data = JSON.parse(event.data);
          
          // Check if it's a pong response
          if (data.type === 'pong') {
            return; // Don't process pong messages
          }
          
          // Process data - transform from Tessie format if needed
          if (onData) {
            const transformedData = transformTessieData(data);
            onData(transformedData);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          if (onError) {
            onError(new Error('Failed to parse WebSocket message'));
          }
        }
      };
      
      // Connection closed
      socket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        updateStatus('disconnected');
        
        // Clean up heartbeat interval
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          updateStatus('reconnecting');
          reconnectTimer = setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, delay);
        } else {
          console.error('Maximum reconnection attempts reached');
          updateStatus('failed');
          if (onError) {
            onError(new Error('Maximum reconnection attempts reached'));
          }
        }
      };
      
      // Connection error
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      if (onError) {
        onError(error);
      }
      updateStatus('failed');
    }
  };
  
  // Start the connection
  connect();
  
  // Return controller object
  return {
    // Close the connection
    close: () => {
      if (socket) {
        socket.close();
        socket = null;
      }
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    },
    
    // Get current connection status
    getStatus: () => {
      if (!socket) return 'disconnected';
      
      switch (socket.readyState) {
        case WebSocket.CONNECTING:
          return 'connecting';
        case WebSocket.OPEN:
          return 'connected';
        case WebSocket.CLOSING:
          return 'disconnecting';
        case WebSocket.CLOSED:
          return 'disconnected';
        default:
          return 'unknown';
      }
    },
    
    // Manually reconnect
    reconnect: () => {
      if (socket) {
        socket.close();
        socket = null;
      }
      
      reconnectAttempts = 0; // Reset reconnect attempts
      connect();
    },
    
    // Add data to buffer (for offline/reconnection scenarios)
    bufferData: (data) => {
      messageBuffer.push(data);
      // Limit buffer size to prevent memory issues
      if (messageBuffer.length > 100) {
        messageBuffer.shift(); // Remove oldest message
      }
    }
  };
};
