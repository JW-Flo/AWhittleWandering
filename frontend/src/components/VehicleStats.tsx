import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Battery, Zap, Thermometer, MapPin, Clock, Gauge } from 'lucide-react';

interface VehicleStatsProps {
  batteryLevel?: number;
  range?: number;
  chargingState?: 'charging' | 'complete' | 'disconnected';
  temperature?: number;
  odometer?: number;
  speed?: number;
  location?: string;
  lastUpdate?: string;
  isLoading?: boolean;
  error?: string | null;
}

const VehicleStats = ({
  batteryLevel = 0,
  range = 0,
  chargingState = 'disconnected',
  temperature,
  odometer,
  speed = 0,
  location,
  lastUpdate,
  isLoading = false,
  error = null
}: VehicleStatsProps) => {
  const getChargingBadge = () => {
    switch (chargingState) {
      case 'charging':
        return <Badge variant="default" className="bg-primary text-primary-foreground">Charging</Badge>;
      case 'complete':
        return <Badge variant="secondary" className="bg-tesla-cyan text-tesla-dark">Complete</Badge>;
      default:
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  // Loading state component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-tesla-gray-light">
          <CardHeader className="pb-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="p-4">
        <p className="text-destructive text-sm font-medium">
          ⚠️ Error loading vehicle data: {error}
        </p>
      </CardContent>
    </Card>
  );

  // Show loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-4">
      {/* Battery & Range */}
      <Card className="border-tesla-gray-light bg-gradient-to-br from-card to-tesla-gray">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Battery className="w-5 h-5 text-primary" />
            Battery & Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Battery Level</span>
              <span className="text-2xl font-bold text-primary">{batteryLevel}%</span>
            </div>
            <Progress 
              value={batteryLevel} 
              className="h-3"
              style={{
                background: 'hsl(var(--tesla-gray-light))'
              }}
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-tesla-cyan" />
              <span className="text-sm">Range</span>
            </div>
            <span className="text-lg font-semibold">{range} mi</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Charging</span>
            {getChargingBadge()}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Status */}
      <Card className="border-tesla-gray-light bg-gradient-to-br from-card to-tesla-gray">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="w-5 h-5 text-primary" />
            Vehicle Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Speed</span>
              </div>
              <span className="text-xl font-bold">{speed} mph</span>
            </div>
            {temperature !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Temp</span>
                </div>
                <span className="text-xl font-bold">{Math.round(temperature * 9/5 + 32)}°F</span>
              </div>
            )}
          </div>
          
          {odometer && (
            <div className="pt-2 border-t border-tesla-gray-light">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Odometer</span>
                <span className="font-semibold">{odometer.toLocaleString()} mi</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location & Updates */}
      <Card className="border-tesla-gray-light bg-gradient-to-br from-card to-tesla-gray">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-primary" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {location && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Current Location</span>
              <p className="text-sm">{location}</p>
            </div>
          )}
          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-tesla-gray-light">
              <Clock className="w-3 h-3" />
              <span>Last updated: {lastUpdate}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleStats;