/* eslint-env browser */
import { useState, useEffect } from "react";

/**
 * Hook for fetching and managing trip data
 * Uses simulated data for development
 */
export const useTripData = ({ pollInterval = 60000 } = {}) => {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        // Attempt to fetch from API
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"
          }/api/trip`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch trip data");
        }

        const data = await response.json();
        setTripData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching trip data:", err);
        // Fallback to simulated data
        console.log("Falling back to simulated trip data");
        setTripData({
          visitedStates: [
            "TX",
            "LA",
            "MS",
            "AL",
            "FL",
            "GA",
            "SC",
            "NC",
            "VA",
            "WV",
            "KY",
            "TN",
            "AR",
            "MO",
            "IL",
            "IN",
            "OH",
            "MI",
            "WI",
            "MN",
            "IA",
            "NE",
            "CO",
          ],
          currentState: "TX",
          nextStop: {
            city: "Houston",
            state: "TX",
            eta: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          },
          distanceToNext: 142,
          route: [
            { latitude: 27.8006, longitude: -97.3964 },
            { latitude: 29.7604, longitude: -95.3698 },
          ],
          stops: [
            {
              id: "1",
              name: "Corpus Christi",
              latitude: 27.8006,
              longitude: -97.3964,
              type: "current",
              description: "Current location",
              charging: true,
              overnight: false,
            },
            {
              id: "2",
              name: "Houston",
              latitude: 29.7604,
              longitude: -95.3698,
              type: "next",
              description: "Next destination",
              charging: true,
              overnight: true,
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
    // Poll based on provided interval
    const interval = setInterval(fetchTripData, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

  return { tripData, loading, error };
};
