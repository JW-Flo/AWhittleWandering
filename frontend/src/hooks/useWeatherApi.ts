import { useState, useEffect, useCallback } from 'react';

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
    try {
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
    } catch (err) {
      console.error('❌ Error getting weather office:', err);
      throw err;
    }
  }, []);

  // Get current weather conditions
  const getCurrentWeather = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🌤️ Fetching current weather for:', { lat, lng });
      
      // Get weather office info first
      const officeInfo = await getWeatherOffice(lat, lng);
      console.log('🏢 Weather office info:', officeInfo);
      
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
      
      console.log('📡 Using weather station:', nearestStation);
      
      // Get latest observation
      const observationResponse = await fetch(`https://api.weather.gov/stations/${nearestStation}/observations/latest`);
      if (!observationResponse.ok) {
        throw new Error('Failed to get weather observation');
      }
      
      const observationData = await observationResponse.json();
      const props = observationData.properties;
      
      console.log('🌡️ Raw weather data:', props);
      
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
      
      console.log('✅ Processed weather:', weather);
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
      console.log('🚨 Fetching weather alerts for:', { lat, lng });
      
      const response = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get weather alerts');
      }
      
      const data = await response.json();
      
      const alerts: WeatherAlert[] = data.features?.map((alert: any) => ({
        id: alert.id,
        title: alert.properties.headline,
        description: alert.properties.description,
        severity: alert.properties.severity,
        urgency: alert.properties.urgency,
        areas: alert.properties.areaDesc?.split(';') || [],
        onset: alert.properties.onset,
        expires: alert.properties.expires
      })) || [];
      
      console.log('🚨 Weather alerts:', alerts.length);
      setAlerts(alerts);
      
    } catch (err) {
      console.error('❌ Error fetching weather alerts:', err);
    }
  }, []);

  // Get weather forecast
  const getWeatherForecast = useCallback(async (lat: number, lng: number) => {
    try {
      console.log('📅 Fetching weather forecast for:', { lat, lng });
      
      const officeInfo = await getWeatherOffice(lat, lng);
      
      const response = await fetch(officeInfo.forecastUrl);
      if (!response.ok) {
        throw new Error('Failed to get weather forecast');
      }
      
      const data = await response.json();
      
      const forecast: WeatherForecast[] = data.properties.periods?.slice(0, 7).map((period: any) => ({
        date: period.startTime,
        high: period.temperature,
        low: period.temperature, // NWS doesn't provide separate high/low in this endpoint
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast,
        precipitationChance: period.probabilityOfPrecipitation?.value || 0,
        icon: period.icon
      })) || [];
      
      console.log('📅 Weather forecast:', forecast.length, 'periods');
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
    console.log('🌍 Fetching all weather data for location:', { lat, lng });
    
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
