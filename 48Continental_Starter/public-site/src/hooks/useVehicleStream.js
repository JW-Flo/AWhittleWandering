/* eslint-disable no-undef */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for streaming real-time Tesla vehicle data via WebSocket
 * 
 * @param {string} vehicleId - The ID of the vehicle to stream data for
 * @param {string} endpoint - WebSocket endpoint URL (defaults to CloudFlare worker endpoint)
 * @returns {Object} - { data, error, status, reconnect }
 */
export default function useVehicleStream(vehicleId, endpoint = null) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('disconnected');
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  
  // Store the vehicle ID in a ref to avoid dependency issues
  const vehicleIdRef = useRef(vehicleId);
  useEffect(() => {
    vehicleIdRef.current = vehicleId;
  }, [vehicleId]);
  
  // Calculate WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    if (!vehicleIdRef.current) {
      throw new Error('Vehicle ID is required');
    }
    
    // Use provided endpoint or default to CloudFlare worker
    const baseUrl = endpoint || 
      (window.location.hostname === 'localhost' 
        ? `ws://${window.location.hostname}:8787/tesla/vehicle/stream`
        : `wss://${window.location.hostname}/tesla/vehicle/stream`);
    
    return `${baseUrl}?id=${vehicleIdRef.current}`;
  }, [endpoint]);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      // Close existing connection if any
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
      
      setStatus('connecting');
      const wsUrl = getWebSocketUrl();
      console.log(`Connecting to vehicle stream: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Connection opened
      ws.addEventListener('open', () => {
        console.log('Vehicle stream connected');
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
      });
      
      // Listen for messages
      ws.addEventListener('message', (event) => {
        try {
          const jsonData = JSON.parse(event.data);
          
          // Handle special messages
          if (jsonData.error) {
            setError(jsonData.error);
            return;
          }
          
          if (jsonData.status === 'reconnecting') {
            setStatus('reconnecting');
            return;
          }
          
          // Regular data update
          setData(jsonData);
        } catch (e) {
          console.error('Error parsing vehicle stream data:', e);
        }
      });
      
      // Handle errors
      ws.addEventListener('error', (event) => {
        console.error('Vehicle stream error:', event);
        setError('Connection error');
      });
      
      // Handle connection close
      ws.addEventListener('close', (event) => {
        console.log(`Vehicle stream closed: ${event.code} - ${event.reason}`);
        setStatus('disconnected');
        
        // Attempt to reconnect with exponential backoff
        const shouldReconnect = reconnectAttemptsRef.current < 5;
        
        if (shouldReconnect) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setError('Maximum reconnection attempts reached');
        }
      });
    } catch (err) {
      console.error('Error setting up vehicle stream:', err);
      setError(`Failed to connect: ${err.message}`);
      setStatus('disconnected');
    }
  }, [getWebSocketUrl]);
  
  // Manual reconnect function
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);
  
  // Connect on mount and when vehicle ID changes
  useEffect(() => {
    if (vehicleId) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [vehicleId, connect]);
  
  return {
    data,
    error,
    status,
    reconnect
  };
}
