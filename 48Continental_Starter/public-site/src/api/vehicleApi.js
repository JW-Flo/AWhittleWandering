/**
 * Vehicle API Handler
 * 
 * This module handles interactions with the Tessie API to get real Tesla vehicle data.
 */

/* eslint-env browser */

/**
 * Fetch current vehicle data from Tessie API
 * @returns {Promise<Object>} Vehicle data
 */
export const fetchVehicleData = async () => {
  try {
    const response = await fetch('/api/vehicle');
    
    if (!response.ok) {
      throw new Error(`Vehicle API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    throw error;
  }
};

/**
 * Create a WebSocket connection to Tesla vehicle data stream
 * @param {string} vehicleId - ID of the vehicle to stream
 * @param {Function} onData - Callback for data updates
 * @param {Function} onError - Callback for connection errors
 * @param {Function} onStatusChange - Callback for connection status changes
 * @returns {Object} WebSocket connection object with close method
 */
export const createVehicleDataStream = (vehicleId, onData, onError, onStatusChange) => {
  // Determine the WebSocket URL based on environment
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  const wsProtocol = isLocalhost ? 'ws:' : 'wss:';
  const wsPort = isLocalhost ? ':8787' : '';
  const wsPath = '/tesla/vehicle/stream';
  
  const wsUrl = `${wsProtocol}//${hostname}${wsPort}${wsPath}?id=${encodeURIComponent(vehicleId)}`;
  
  let ws = null;
  let reconnectTimeout = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  // Function to create and set up the WebSocket
  const connect = () => {
    if (onStatusChange) onStatusChange('connecting');
    console.log(`Connecting to vehicle stream: ${wsUrl}`);
    
    // Close existing connection if any
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close();
    }
    
    // Create new WebSocket connection
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Vehicle stream connected');
      reconnectAttempts = 0;
      if (onStatusChange) onStatusChange('connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const jsonData = JSON.parse(event.data);
        
        // Handle special status messages
        if (jsonData.error) {
          if (onError) onError(new Error(jsonData.error));
          return;
        }
        
        if (jsonData.status === 'reconnecting') {
          if (onStatusChange) onStatusChange('reconnecting');
          return;
        }
        
        // Regular data update
        if (onData) onData(jsonData);
      } catch (error) {
        console.error('Error parsing vehicle stream data:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Vehicle stream error:', error);
      if (onError) onError(error);
    };
    
    ws.onclose = (event) => {
      console.log(`Vehicle stream closed: ${event.code} - ${event.reason}`);
      if (onStatusChange) onStatusChange('disconnected');
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
        
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, delay);
      } else {
        if (onError) onError(new Error('Maximum reconnection attempts reached'));
      }
    };
  };
  
  // Initial connection
  connect();
  
  // Return a connection object with close method
  return {
    close: () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    getStatus: () => {
      if (!ws) return 'disconnected';
      
      switch (ws.readyState) {
        case WebSocket.CONNECTING: return 'connecting';
        case WebSocket.OPEN: return 'connected';
        case WebSocket.CLOSING: return 'disconnecting';
        case WebSocket.CLOSED: return 'disconnected';
        default: return 'unknown';
      }
    }
  };
};
