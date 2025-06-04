// Tesla Fleet Telemetry WebSocket Client for The Wandering Whittle
// Streams real-time vehicle data and alerts from Tessie

/**
 * Tesla Telemetry API Utilities
 * 
 * Provides functions to fetch Tesla telemetry data.
 */


export function connectTeslaTelemetry({
  vin,
  accessToken,
  onData,
  onAlert,
  onConnectivity,
  onError
}) {
  // Default VIN if not provided
  if (!vin) {
    vin = '5YJYGDEE5LF027324';
  }
  if (!accessToken) {
    throw new Error('accessToken is required for Tesla Telemetry');
  }

  // Compose the WebSocket URL
  const url = `wss://streaming.tessie.com/${vin}?access_token=${encodeURIComponent(accessToken)}`;
  // eslint-disable-next-line no-undef
  const ws = typeof window !== 'undefined' ? new window.WebSocket(url) : new WebSocket(url);

  ws.onopen = () => {
    // Optionally, you could send a handshake or log connection
    if (onConnectivity) {
      onConnectivity({ vin, status: 'CONNECTED', createdAt: new Date().toISOString() });
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.data && Array.isArray(msg.data)) {
        if (onData) onData(msg);
      }
      if (msg.alerts && Array.isArray(msg.alerts)) {
        if (onAlert) onAlert(msg);
      }
      if (msg.status && msg.connectionId) {
        if (onConnectivity) onConnectivity(msg);
      }
      if (msg.errors && Array.isArray(msg.errors)) {
        if (onError) onError(msg.errors);
      }
    } catch (err) {
      if (onError) onError(err);
    }
  };

  ws.onerror = (event) => {
    if (onError) onError(event);
  };

  ws.onclose = () => {
    if (onConnectivity) {
      onConnectivity({ vin, status: 'DISCONNECTED', createdAt: new Date().toISOString() });
    }
  };

  return ws;
}
