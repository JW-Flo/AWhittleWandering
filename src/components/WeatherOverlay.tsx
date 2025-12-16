import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeather } from '@/hooks/useWeather';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Droplets,
  Thermometer,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeatherOverlayProps {
  lat: number;
  lng: number;
  locationName?: string;
  compact?: boolean;
  className?: string;
}

export function WeatherOverlay({ 
  lat, 
  lng, 
  locationName, 
  compact = false,
  className = '' 
}: WeatherOverlayProps) {
  const { data, isLoading, error, fetchCurrentWeather } = useWeather();
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  useEffect(() => {
    if (lat && lng) {
      fetchCurrentWeather(lat, lng);
      setLastFetch(new Date());
    }
  }, [lat, lng, fetchCurrentWeather]);

  const getWeatherIcon = (conditions: string) => {
    switch (conditions?.toLowerCase()) {
      case 'clear':
        return <Sun className="w-5 h-5 text-yellow-400" />;
      case 'clouds':
        return <Cloud className="w-5 h-5 text-gray-400" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'snow':
        return <CloudSnow className="w-5 h-5 text-blue-200" />;
      default:
        return <Sun className="w-5 h-5 text-yellow-400" />;
    }
  };

  const handleRefresh = () => {
    fetchCurrentWeather(lat, lng);
    setLastFetch(new Date());
  };

  if (compact) {
    if (isLoading && !data) {
      return (
        <div className={`flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur rounded-lg ${className}`}>
          <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading weather...</span>
        </div>
      );
    }

    if (error || !data) return null;

    return (
      <div className={`flex items-center gap-3 px-3 py-2 bg-card/80 backdrop-blur rounded-lg border border-border/50 ${className}`}>
        {getWeatherIcon(data.conditions)}
        <span className="font-medium">{data.temp}°F</span>
        <span className="text-sm text-muted-foreground capitalize">{data.description}</span>
        {locationName && (
          <span className="text-xs text-muted-foreground">• {locationName}</span>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-card/90 backdrop-blur border-border/50 ${className}`}>
      <CardContent className="p-4">
        {isLoading && !data ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="ghost" onClick={handleRefresh} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {getWeatherIcon(data.conditions)}
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.temp}°F</p>
                  <p className="text-sm text-muted-foreground capitalize">{data.description}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {locationName && (
              <Badge variant="outline" className="text-xs">
                {locationName}
              </Badge>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Thermometer className="w-3 h-3" />
                </div>
                <p className="text-sm font-medium">Feels {data.feelsLike}°</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Droplets className="w-3 h-3" />
                </div>
                <p className="text-sm font-medium">{data.humidity}%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Wind className="w-3 h-3" />
                </div>
                <p className="text-sm font-medium">{data.windSpeed} mph</p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default WeatherOverlay;
