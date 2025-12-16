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
  RefreshCw,
  CloudLightning,
  CloudFog
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeatherOverlayProps {
  lat: number;
  lng: number;
  locationName?: string;
  compact?: boolean;
  showAnimation?: boolean;
  className?: string;
}

export function WeatherOverlay({ 
  lat, 
  lng, 
  locationName, 
  compact = false,
  showAnimation = true,
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

  const getWeatherIcon = (conditions: string, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    const animationClass = showAnimation ? 'transition-transform hover:scale-110' : '';
    
    switch (conditions?.toLowerCase()) {
      case 'clear':
        return <Sun className={`${sizeClass} text-yellow-400 ${showAnimation ? 'animate-pulse' : ''} ${animationClass}`} />;
      case 'clouds':
        return <Cloud className={`${sizeClass} text-gray-400 ${animationClass}`} />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className={`${sizeClass} text-blue-400 ${animationClass}`} />;
      case 'snow':
        return <CloudSnow className={`${sizeClass} text-blue-200 ${animationClass}`} />;
      case 'thunderstorm':
        return <CloudLightning className={`${sizeClass} text-purple-400 ${showAnimation ? 'animate-pulse' : ''} ${animationClass}`} />;
      case 'mist':
      case 'fog':
      case 'haze':
        return <CloudFog className={`${sizeClass} text-gray-300 ${animationClass}`} />;
      default:
        return <Sun className={`${sizeClass} text-yellow-400 ${animationClass}`} />;
    }
  };

  // Dynamic background based on weather
  const getWeatherBackground = (conditions: string) => {
    switch (conditions?.toLowerCase()) {
      case 'clear':
        return 'bg-gradient-to-br from-yellow-500/5 to-orange-500/5';
      case 'clouds':
        return 'bg-gradient-to-br from-gray-500/5 to-slate-500/5';
      case 'rain':
      case 'drizzle':
        return 'bg-gradient-to-br from-blue-500/10 to-indigo-500/5';
      case 'snow':
        return 'bg-gradient-to-br from-blue-200/10 to-white/5';
      case 'thunderstorm':
        return 'bg-gradient-to-br from-purple-500/10 to-gray-500/5';
      default:
        return 'bg-gradient-to-br from-primary/5 to-muted/5';
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
      <div className={`relative overflow-hidden flex items-center gap-3 px-3 py-2 backdrop-blur rounded-lg border border-border/50 ${getWeatherBackground(data.conditions)} ${className}`}>
        {/* Subtle animated particles for rain/snow */}
        {showAnimation && (data.conditions === 'Rain' || data.conditions === 'Snow') && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className={`absolute w-0.5 ${data.conditions === 'Snow' ? 'h-0.5 rounded-full bg-white' : 'h-2 bg-blue-400'}`}
                style={{
                  left: `${20 + i * 15}%`,
                  animation: `fall ${1.5 + i * 0.2}s linear infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        )}
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
    <Card className={`relative overflow-hidden bg-card/90 backdrop-blur border-border/50 ${getWeatherBackground(data?.conditions || '')} ${className}`}>
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
                  {getWeatherIcon(data.conditions, 'lg')}
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
