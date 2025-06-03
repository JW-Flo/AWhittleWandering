/**
 * WebSocket Connection Test Utility
 * 
 * This utility helps test and debug WebSocket connections for vehicle data.
 * It can be run directly in the browser console for testing.
 */

/* eslint-env browser */

/**
 * Test a WebSocket connection to the vehicle stream API
 * @param {string} vehicleId - Vehicle ID to connect to
 * @param {boolean} isLocalhost - Whether we're testing with a local server
 * @returns {Object} WebSocket connection with close() method
 */
export function testVehicleWebSocket(vehicleId = 'test_vehicle', isLocalhost = true) {
  // Determine the WebSocket URL based on environment
  const hostname = isLocalhost ? 'localhost' : window.location.hostname;
  const wsProtocol = isLocalhost ? 'ws:' : 'wss:';
  const wsPort = isLocalhost ? ':8787' : '';
  const wsPath = '/tesla/vehicle/stream';
  
  const wsUrl = `${wsProtocol}//${hostname}${wsPort}${wsPath}?id=${encodeURIComponent(vehicleId)}`;
  console.log(`Connecting to: ${wsUrl}`);
  
  // Create WebSocket
  const ws = new WebSocket(wsUrl);
  
  // Set up event handlers
  ws.onopen = () => {
    console.log('✅ WebSocket connection established');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📡 Received data:', data);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      console.log('Raw message:', event.data);
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };
  
  ws.onclose = (event) => {
    console.log(`🔌 WebSocket closed: code=${event.code}, reason=${event.reason}`);
  };
  
  // Return connection with useful methods
  return {
    connection: ws,
    close: () => {
      console.log('🛑 Closing WebSocket connection...');
      ws.close();
    },
    send: (message) => {
      console.log('📤 Sending message:', message);
      ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    },
    getStatus: () => {
      const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
      return states[ws.readyState];
    }
  };
}

// Instructions for testing in console
console.log(`
=== WebSocket Test Utility ===
To test the vehicle WebSocket connection, run in the browser console:

const test = testVehicleWebSocket('your_vehicle_id');

// Check connection status
test.getStatus();

// Send a test message (if supported by the server)
test.send({ type: 'ping' });

// Close the connection when done
test.close();
`);
