interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  visibility: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  clouds: number;
  dt: number;
  timezone: number;
}

interface WeatherCache {
  [key: string]: {
    data: WeatherData;
    timestamp: number;
    expires: number;
  };
}

class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private cache: WeatherCache = {};
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly HISTORICAL_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private dailyCallCount = 0;
  private readonly MAX_DAILY_CALLS = 900; // Leave buffer from 1000 limit

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.loadCacheFromStorage();
    this.loadCallCountFromStorage();
  }

  private getCacheKey(lat: number, lng: number, type: 'current' | 'historical', timestamp?: number): string {
    const coords = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    return timestamp ? `${type}_${coords}_${timestamp}` : `${type}_${coords}`;
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('weather_cache');
      if (cached) {
        this.cache = JSON.parse(cached);
        // Clean expired entries
        const now = Date.now();
        Object.keys(this.cache).forEach(key => {
          if (this.cache[key].expires < now) {
            delete this.cache[key];
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load weather cache:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('weather_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save weather cache:', error);
    }
  }

  private loadCallCountFromStorage(): void {
    try {
      const stored = localStorage.getItem('weather_daily_calls');
      const data = stored ? JSON.parse(stored) : null;
      const today = new Date().toDateString();
      
      if (data && data.date === today) {
        this.dailyCallCount = data.count;
      } else {
        this.dailyCallCount = 0;
        this.saveCallCountToStorage();
      }
    } catch (error) {
      console.warn('Failed to load call count:', error);
    }
  }

  private saveCallCountToStorage(): void {
    try {
      const data = {
        date: new Date().toDateString(),
        count: this.dailyCallCount
      };
      localStorage.setItem('weather_daily_calls', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save call count:', error);
    }
  }

  private canMakeApiCall(): boolean {
    return this.dailyCallCount < this.MAX_DAILY_CALLS;
  }

  private incrementCallCount(): void {
    this.dailyCallCount++;
    this.saveCallCountToStorage();
  }

  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    const cacheKey = this.getCacheKey(lat, lng, 'current');
    const now = Date.now();

    // Check cache first
    if (this.cache[cacheKey] && this.cache[cacheKey].expires > now) {
      return this.cache[cacheKey].data;
    }

    if (!this.canMakeApiCall()) {
      console.warn('Weather API daily limit reached');
      return this.cache[cacheKey]?.data || null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      this.incrementCallCount();

      // Cache the result
      this.cache[cacheKey] = {
        data,
        timestamp: now,
        expires: now + this.CACHE_DURATION
      };
      this.saveCacheToStorage();

      return data;
    } catch (error) {
      console.error('Failed to fetch current weather:', error);
      return this.cache[cacheKey]?.data || null;
    }
  }

  async getHistoricalWeather(lat: number, lng: number, timestamp: number): Promise<WeatherData | null> {
    const cacheKey = this.getCacheKey(lat, lng, 'historical', timestamp);
    const now = Date.now();

    // Check cache first
    if (this.cache[cacheKey] && this.cache[cacheKey].expires > now) {
      return this.cache[cacheKey].data;
    }

    if (!this.canMakeApiCall()) {
      console.warn('Weather API daily limit reached');
      return this.cache[cacheKey]?.data || null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/onecall/timemachine?lat=${lat}&lon=${lng}&dt=${Math.floor(timestamp / 1000)}&appid=${this.apiKey}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error(`Historical weather API error: ${response.status}`);
      }

      const data = await response.json();
      this.incrementCallCount();

      const weatherData = data.current || data.data?.[0];
      if (weatherData) {
        // Cache the result
        this.cache[cacheKey] = {
          data: weatherData,
          timestamp: now,
          expires: now + this.HISTORICAL_CACHE_DURATION
        };
        this.saveCacheToStorage();

        return weatherData;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch historical weather:', error);
      return this.cache[cacheKey]?.data || null;
    }
  }

  getWeatherIcon(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  getWeatherDescription(weather: WeatherData): string {
    if (!weather.weather?.[0]) return 'Unknown';
    return weather.weather[0].description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getTemperatureClass(temp: number): string {
    if (temp >= 100) return 'text-red-600 font-bold'; // Extreme heat
    if (temp >= 85) return 'text-orange-500'; // Hot
    if (temp >= 70) return 'text-yellow-500'; // Warm
    if (temp >= 50) return 'text-green-500'; // Mild
    if (temp >= 32) return 'text-blue-500'; // Cool
    return 'text-blue-700 font-bold'; // Freezing
  }

  getDailyCallsRemaining(): number {
    return Math.max(0, this.MAX_DAILY_CALLS - this.dailyCallCount);
  }

  clearCache(): void {
    this.cache = {};
    localStorage.removeItem('weather_cache');
  }
}

export { WeatherService, type WeatherData };