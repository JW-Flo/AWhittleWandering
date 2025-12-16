import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  Battery, 
  MapPin, 
  Thermometer, 
  Gauge, 
  Navigation,
  Zap,
  RefreshCw,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTessieData, VehicleState } from '@/hooks/useTessieData';
import { formatDistanceToNow } from 'date-fns';

interface LiveVehicleStatusProps {
  compact?: boolean;
  className?: string;
}

export default function LiveVehicleStatus({ compact = false, className = '' }: LiveVehicleStatusProps) {
  const { vehicleState, isLoading, error, lastFetch, refresh } = useTessieData(true, 30000);

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'online': return 'bg-green-500';
      case 'asleep': return 'bg-blue-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-4 p-3 bg-card rounded-lg border ${className}`}>
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          <span className="font-medium">Shadowfax</span>
        </div>
        
        {isLoading && !vehicleState ? (
          <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : error ? (
          <Badge variant="destructive" className="text-xs">Offline</Badge>
        ) : vehicleState ? (
          <>
            <div className={`w-2 h-2 rounded-full ${getStateColor(vehicleState.state)}`} />
            <div className="flex items-center gap-1">
              <Battery className={`w-4 h-4 ${getBatteryColor(vehicleState.batteryLevel)}`} />
              <span className="text-sm font-medium">{vehicleState.batteryLevel}%</span>
              {vehicleState.isCharging && <Zap className="w-3 h-3 text-green-500" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{vehicleState.latitude.toFixed(2)}, {vehicleState.longitude.toFixed(2)}</span>
            </div>
          </>
        ) : null}
        
        <Button 
          size="sm" 
          variant="ghost" 
          className="ml-auto h-7 w-7 p-0"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            <span>Live Vehicle Status</span>
          </div>
          <div className="flex items-center gap-2">
            {vehicleState && (
              <Badge 
                variant="outline" 
                className={`${getStateColor(vehicleState.state)} bg-opacity-20`}
              >
                {vehicleState.state}
              </Badge>
            )}
            <Button 
              size="sm" 
              variant="ghost"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg text-destructive">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Unable to connect</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        ) : isLoading && !vehicleState ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : vehicleState ? (
          <>
            {/* Vehicle Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{vehicleState.displayName}</h3>
                <p className="text-sm text-muted-foreground font-mono">{vehicleState.vin}</p>
              </div>
            </div>

            {/* Battery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className={`w-5 h-5 ${getBatteryColor(vehicleState.batteryLevel)}`} />
                  <span className="font-medium">Battery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getBatteryColor(vehicleState.batteryLevel)}`}>
                    {vehicleState.batteryLevel}%
                  </span>
                  {vehicleState.isCharging && (
                    <Badge className="bg-green-500 text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      Charging
                    </Badge>
                  )}
                </div>
              </div>
              <Progress 
                value={vehicleState.batteryLevel} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground">
                {Math.round(vehicleState.batteryRange)} mi range
                {vehicleState.chargeRate && vehicleState.chargeRate > 0 && (
                  <span className="text-green-500"> • +{vehicleState.chargeRate} mi/hr</span>
                )}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Location */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs">Location</span>
                </div>
                <p className="font-mono text-sm">
                  {vehicleState.latitude.toFixed(4)}, {vehicleState.longitude.toFixed(4)}
                </p>
              </div>

              {/* Odometer */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs">Odometer</span>
                </div>
                <p className="font-bold text-lg">
                  {vehicleState.odometer.toLocaleString()} <span className="text-sm font-normal">mi</span>
                </p>
              </div>

              {/* Inside Temp */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-xs">Inside</span>
                </div>
                <p className="font-bold text-lg">
                  {Math.round(vehicleState.insideTemp)}°F
                </p>
              </div>

              {/* Outside Temp */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-xs">Outside</span>
                </div>
                <p className="font-bold text-lg">
                  {Math.round(vehicleState.outsideTemp)}°F
                </p>
              </div>
            </div>

            {/* Speed (if moving) */}
            {vehicleState.speed > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <Navigation className="w-6 h-6 text-primary animate-pulse" />
                  <div>
                    <p className="text-sm text-muted-foreground">Currently driving</p>
                    <p className="font-bold text-2xl text-primary">{vehicleState.speed} mph</p>
                  </div>
                </div>
              </div>
            )}

            {/* Last Updated */}
            {lastFetch && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Updated {formatDistanceToNow(lastFetch, { addSuffix: true })}</span>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
