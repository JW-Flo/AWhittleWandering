import { useState, useCallback } from 'react';

export interface WeatherCondition {
  temperature: number; // Fahrenheit
  temperatureCelsius: number;
  description: string;
  humidity: number;
  windSpeed: number; // mph
  windDirection: string;
  visibility: number; // miles
  dewPoint: number;
  pressure: number; // inHg
  icon: string;
  lastUpdated: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  urgency: 'Expected' | 'Future' | 'Immediate' | 'Past';
  areas: string[];
  onset: string;
  expires: string;
}

export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  shortForecast: string;
  detailedForecast: string;
  precipitationChance: number;
  icon: string;
}

export const useWeatherApi = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherCondition | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get weather office and grid coordinates for a given lat/lng
  const getWeatherOffice = useCallback(async (lat: number, lng: number) => {
    const response = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`);
    
    if (!response.ok) {
      throw new Error(`Weather service unavailable: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      office: data.properties.cwa,
      gridX: data.properties.gridX,
      gridY: data.properties.gridY,
      forecastUrl: data.properties.forecast,
      forecastHourlyUrl: data.properties.forecastHourly,
      observationStationsUrl: data.properties.observationStations
    };
  }, []);

  // Get current weather conditions
  const getCurrentWeather = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get weather office info first
      const officeInfo = await getWeatherOffice(lat, lng);
      
      // Get observation stations
      const stationsResponse = await fetch(officeInfo.observationStationsUrl);
      if (!stationsResponse.ok) {
        throw new Error('Failed to get observation stations');
      }
      
      const stationsData = await stationsResponse.json();
      const nearestStation = stationsData.features[0]?.id;
      
      if (!nearestStation) {
        throw new Error('No weather stations found in area');
      }
      
      
      // Get current weather observations
      
      // Get latest observation
      const observationResponse = await fetch(`https://api.weather.gov/stations/${nearestStation}/observations/latest`);
      if (!observationResponse.ok) {
        throw new Error('Failed to get weather observation');
      }
      
      const observationData = await observationResponse.json();
      const props = observationData.properties;
      
      
      // Convert celsius to fahrenheit if needed
      const tempC = props.temperature?.value;
      const tempF = tempC ? (tempC * 9/5) + 32 : null;
      
      const weather: WeatherCondition = {
        temperature: tempF || 0,
        temperatureCelsius: tempC || 0,
        description: props.textDescription || 'Unknown',
        humidity: props.relativeHumidity?.value || 0,
        windSpeed: props.windSpeed?.value ? Math.round(props.windSpeed.value * 2.237) : 0, // m/s to mph
        windDirection: props.windDirection?.value ? getWindDirection(props.windDirection.value) : 'N/A',
        visibility: props.visibility?.value ? Math.round(props.visibility.value * 0.000621371) : 0, // meters to miles
        dewPoint: props.dewpoint?.value ? (props.dewpoint.value * 9/5) + 32 : 0, // C to F
        pressure: props.barometricPressure?.value ? props.barometricPressure.value * 0.0002953 : 0, // Pa to inHg
        icon: props.icon || '',
        lastUpdated: props.timestamp || new Date().toISOString()
      };
      
      setCurrentWeather(weather);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      console.error('❌ Weather fetch error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getWeatherOffice]);

  // Get weather alerts for an area
  const getWeatherAlerts = useCallback(async (lat: number, lng: number) => {
    try {
      
      const response = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get weather alerts');
      }
      
      const data = await response.json();
      
      const alerts: WeatherAlert[] = data.features?.map((alert: {
        id: string;
        properties: {
          headline: string;
          description: string;
          severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
          urgency: 'Expected' | 'Future' | 'Immediate' | 'Past';
          areaDesc?: string;
          onset: string;
          expires: string;
        };
      }) => ({
        id: alert.id,
        title: alert.properties.headline,
        description: alert.properties.description,
        severity: alert.properties.severity,
        urgency: alert.properties.urgency,
        areas: alert.properties.areaDesc?.split(';') || [],
        onset: alert.properties.onset,
        expires: alert.properties.expires
      })) || [];
      
      setAlerts(alerts);
      
    } catch (err) {
      console.error('❌ Error fetching weather alerts:', err);
    }
  }, []);

  // Get weather forecast
  const getWeatherForecast = useCallback(async (lat: number, lng: number) => {
    try {
      
      const officeInfo = await getWeatherOffice(lat, lng);
      
      const response = await fetch(officeInfo.forecastUrl);
      if (!response.ok) {
        throw new Error('Failed to get weather forecast');
      }
      
      const data = await response.json();
      
      const forecast: WeatherForecast[] = data.properties.periods?.slice(0, 7).map((period: {
        startTime: string;
        temperature: number;
        shortForecast: string;
        detailedForecast: string;
        probabilityOfPrecipitation?: { value: number };
        icon: string;
      }) => ({
        date: period.startTime,
        high: period.temperature,
        low: period.temperature, // NWS doesn't provide separate high/low in this endpoint
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast,
        precipitationChance: period.probabilityOfPrecipitation?.value || 0,
        icon: period.icon
      })) || [];
      
      setForecast(forecast);
      
    } catch (err) {
      console.error('❌ Error fetching weather forecast:', err);
    }
  }, [getWeatherOffice]);

  // Helper function to convert wind direction degrees to cardinal direction
  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  // Fetch all weather data for a location
  const fetchWeatherData = useCallback(async (lat: number, lng: number) => {
    
    // Fetch current weather, alerts, and forecast in parallel
    await Promise.allSettled([
      getCurrentWeather(lat, lng),
      getWeatherAlerts(lat, lng),
      getWeatherForecast(lat, lng)
    ]);
  }, [getCurrentWeather, getWeatherAlerts, getWeatherForecast]);

  return {
    currentWeather,
    alerts,
    forecast,
    isLoading,
    error,
    fetchWeatherData,
    getCurrentWeather,
    getWeatherAlerts,
    getWeatherForecast
  };
};
