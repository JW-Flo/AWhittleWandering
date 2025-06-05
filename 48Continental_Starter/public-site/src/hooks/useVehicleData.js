/* eslint-env browser */
import { useState, useEffect } from "react";

/**
 * Hook for fetching and managing vehicle data
 * Uses simulated data for development
 */
export const useVehicleData = ({
  enableStreaming = false,
  pollInterval = 30000,
} = {}) => {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setConnectionStatus("connecting");

        // Attempt to fetch from API
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"
          }/api/vehicle`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vehicle data");
        }

        const data = await response.json();
        setVehicleData(data);
        setError(null);
        setConnectionStatus("connected");
      } catch (err) {
        console.error("Error fetching vehicle data:", err);
        // Fallback to simulated data
        console.log("Falling back to simulated data");
        setVehicleData({
          batteryLevel: 72,
          range: 218,
          speed: 65,
          location: {
            latitude: 27.8006,
            longitude: -97.3964,
          },
          latitude: 27.8006,
          longitude: -97.3964,
          climate: {
            insideTemp: 72,
            outsideTemp: 75,
          },
          odometer: 45123,
        });
        setConnectionStatus("connected");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
    // Poll based on provided interval
    const interval = setInterval(fetchVehicleData, pollInterval);

    return () => clearInterval(interval);
  }, [enableStreaming, pollInterval]);

  return { vehicleData, loading, error, connectionStatus };
};
