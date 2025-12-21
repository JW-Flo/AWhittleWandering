import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  conditions: string;
}

export interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
}

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchCurrentWeather = useCallback(async (lat: number, lon: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('weather', {
        body: { lat, lon, type: 'current' }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      const weather: WeatherData = {
        temp: Math.round(data.main?.temp ?? 0),
        feelsLike: Math.round(data.main?.feels_like ?? 0),
        humidity: data.main?.humidity ?? 0,
        windSpeed: Math.round(data.wind?.speed ?? 0),
        description: data.weather?.[0]?.description ?? 'Unknown',
        icon: data.weather?.[0]?.icon ?? '01d',
        conditions: data.weather?.[0]?.main ?? 'Clear',
      };

      setState({ data: weather, isLoading: false, error: null });
      return weather;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      setState({ data: null, isLoading: false, error: errorMessage });
      return null;
    }
  }, []);

  const fetchForecast = useCallback(async (lat: number, lon: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('weather', {
        body: { lat, lon, type: 'forecast' }
      });

      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      console.error('Forecast fetch error:', err);
      return null;
    }
  }, []);

  return {
    ...state,
    fetchCurrentWeather,
    fetchForecast,
  };
}
