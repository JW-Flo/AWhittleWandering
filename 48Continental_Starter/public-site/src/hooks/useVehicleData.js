/* eslint-disable */
/**
 * Vehicle Data Hook
 *
 * This hook provides access to real-time vehicle data from either the
 * Tessie API or mock data for testing. It handles WebSocket connections
 * and data updates automatically.
 */

import { useState, useEffect, useCallback } from "react";
import * as tessieClient from "../services/tessieClient";
import * as mockVehicleData from "../services/mockVehicleData";

/**
 * Hook for accessing and subscribing to vehicle data
 *
 * @param {Object} options Configuration options
 * @param {boolean} options.useMockData Whether to use mock data instead of real API
 * @param {boolean} options.randomMovement For mock data: use random movement
 * @param {Array} options.followPath For mock data: array of {latitude, longitude} points to follow
 * @param {number} options.updateInterval For mock data: milliseconds between updates (default: 2000)
 * @returns {Object} Vehicle data and control functions
 */
const useVehicleData = (options = {}) => {
  const {
    useMockData = !tessieClient.isTessieConfigured(),
    randomMovement = true,
    followPath = null,
    updateInterval = 2000,
  } = options;

  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webSocket, setWebSocket] = useState(null);

  // Initialize vehicle data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const initializeData = async () => {
      try {
        // Get initial vehicle data
        const data = useMockData
          ? await mockVehicleData.getMockVehicleData()
          : await tessieClient.getVehicleData();

        if (mounted) {
          setVehicleData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error initializing vehicle data:", err);
        if (mounted) {
          setError(err.message || "Failed to get vehicle data");
          setLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [useMockData]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (loading) return; // Wait until initial data is loaded

    // Create WebSocket connection
    const ws = useMockData
      ? mockVehicleData.createMockWebSocket(handleDataUpdate)
      : tessieClient.createWebSocketConnection(handleDataUpdate);

    setWebSocket(ws);

    // Configure mock data simulation if using mock data
    if (useMockData) {
      mockVehicleData.startMockVehicleSimulation({
        randomMovement,
        followPath,
        updateInterval,
      });
    }

    // Clean up WebSocket connection and simulation on unmount
    return () => {
      if (ws) {
        ws.close();
      }
      if (useMockData) {
        mockVehicleData.stopMockVehicleSimulation();
      }
    };
  }, [loading, useMockData, randomMovement, followPath, updateInterval]);

  // Handle incoming data updates
  const handleDataUpdate = useCallback((data) => {
    setVehicleData(data);
  }, []);

  // Wake up the vehicle (real or mock)
  const wakeVehicle = useCallback(async () => {
    try {
      if (useMockData) {
        // For mock data, simply return a success response
        return { success: true, message: "Mock vehicle wake command sent" };
      } else {
        return await tessieClient.wakeVehicle();
      }
    } catch (err) {
      console.error("Error waking vehicle:", err);
      throw err;
    }
  }, [useMockData]);

  // Toggle mock vehicle movement
  const toggleMockMovement = useCallback(() => {
    if (useMockData) {
      mockVehicleData.startMockVehicleSimulation({
        moving: vehicleData?.vehicle_data?.speed === 0, // Toggle based on current state
        randomMovement,
        followPath,
        updateInterval,
      });
    }
  }, [useMockData, vehicleData, randomMovement, followPath, updateInterval]);

  // Toggle mock vehicle charging
  const toggleMockCharging = useCallback(() => {
    if (useMockData && vehicleData) {
      const isCharging = vehicleData.vehicle_data.charging_state === "Charging";
      const updatedData = { ...vehicleData };
      updatedData.vehicle_data.charging_state = isCharging
        ? "Disconnected"
        : "Charging";
      updatedData.vehicle_data.speed = isCharging ? 0 : 0; // Stop vehicle when charging

      // Update the data
      handleDataUpdate(updatedData);

      // Also update the simulation config
      mockVehicleData.startMockVehicleSimulation({
        moving: !isCharging, // Start moving if not charging
        randomMovement,
        followPath,
        updateInterval,
      });
    }
  }, [
    useMockData,
    vehicleData,
    handleDataUpdate,
    randomMovement,
    followPath,
    updateInterval,
  ]);

  return {
    vehicleData,
    loading,
    error,
    isConnected: !!webSocket,
    isMockData: useMockData,
    wakeVehicle,

    // Mock-only controls
    toggleMockMovement,
    toggleMockCharging,
  };
};

export default useVehicleData;
