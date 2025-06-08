import useVehicleData from "./useVehicleData";
export { useVehicleData };
export { useTripData } from "./useTripData";

// Temporary mock hooks until we implement them
export const useWeatherData = ({ location, pollInterval }) => ({
  weatherData: {
    temperature: 75,
    conditions: "Sunny",
    forecast: [
      { day: "Today", high: 78, low: 65, conditions: "Sunny" },
      { day: "Tomorrow", high: 80, low: 67, conditions: "Partly Cloudy" },
    ],
  },
  weatherLoading: false,
  weatherError: null,
});

export const useChargingStations = ({
  latitude,
  longitude,
  radius,
  pollInterval,
}) => ({
  stationsData: {
    stations: [
      {
        id: "sc-1",
        name: "Corpus Christi Supercharger",
        latitude: 27.7947,
        longitude: -97.4033,
        available: true,
        power: 250,
        connectorType: "Tesla",
        description: "Tesla Supercharger - 8 stalls",
      },
    ],
    radius: radius || 50,
  },
  stationsLoading: false,
  stationsError: null,
});
