import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Battery, Zap, X, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTessieData } from '@/hooks/useTessieData';
import { cn } from '@/lib/utils';

interface FloatingVehicleWidgetProps {
  className?: string;
  onLocationClick?: (lat: number, lng: number) => void;
}

export default function FloatingVehicleWidget({ className, onLocationClick }: FloatingVehicleWidgetProps) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDrivingOff, setIsDrivingOff] = useState(false);
  const { vehicleState, isLoading, error, refresh } = useTessieData(undefined, true, 30000);

  const handleLocationClick = () => {
    if (vehicleState) {
      if (onLocationClick) {
        onLocationClick(vehicleState.latitude, vehicleState.longitude);
      } else {
        // Navigate to dashboard live tab with location params
        navigate(`/dashboard?tab=live&lat=${vehicleState.latitude}&lng=${vehicleState.longitude}`);
      }
    }
  };

  const handleDismiss = () => {
    setIsDrivingOff(true);
    setTimeout(() => setIsDismissed(true), 600);
  };

  const handleShow = () => {
    setIsDismissed(false);
    setIsDrivingOff(false);
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-success';
    if (level > 20) return 'text-warning';
    return 'text-destructive';
  };

  const getStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'online': return 'bg-success';
      case 'asleep': return 'bg-info';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-warning';
    }
  };

  // Show minimal "bring back" button when dismissed
  if (isDismissed) {
    return (
      <button
        onClick={handleShow}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-3 rounded-full",
          "bg-card/90 backdrop-blur-sm border border-border/50",
          "shadow-elevated hover:shadow-glow transition-all duration-300",
          "hover:scale-110 group animate-in slide-in-from-right-10",
          className
        )}
        title="Show vehicle status"
      >
        <Car className="w-5 h-5 text-primary group-hover:text-primary-glow transition-colors" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "bg-card/95 backdrop-blur-md border border-border/50 rounded-xl",
        "shadow-elevated p-4 min-w-[280px]",
        "transition-all duration-500 ease-out",
        isDrivingOff && "translate-x-[120%] opacity-0",
        !isDrivingOff && "animate-in slide-in-from-right-10",
        className
      )}
    >
      {/* Header with dismiss button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Car className="w-5 h-5 text-primary" />
            {vehicleState && (
              <div className={cn(
                "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                getStateColor(vehicleState.state)
              )} />
            )}
          </div>
          <span className="font-semibold text-foreground">Shadowfax</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            title="Drive off screen"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-2">
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            Offline
          </Badge>
        </div>
      ) : isLoading && !vehicleState ? (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : vehicleState ? (
        <div className="space-y-3">
          {/* Battery status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className={cn("w-4 h-4", getBatteryColor(vehicleState.batteryLevel))} />
              <span className={cn("font-bold", getBatteryColor(vehicleState.batteryLevel))}>
                {vehicleState.batteryLevel}%
              </span>
              {vehicleState.isCharging && (
                <Zap className="w-3.5 h-3.5 text-success animate-pulse" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              ~{Math.round(vehicleState.batteryRange)} mi
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                vehicleState.batteryLevel > 50 ? "bg-success" :
                vehicleState.batteryLevel > 20 ? "bg-warning" : "bg-destructive"
              )}
              style={{ width: `${vehicleState.batteryLevel}%` }}
            />
          </div>

          {/* Location - Clickable */}
          <button 
            onClick={handleLocationClick}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-left group"
          >
            <MapPin className="w-3 h-3 group-hover:text-primary" />
            <span className="font-mono underline-offset-2 group-hover:underline">
              {vehicleState.latitude.toFixed(3)}, {vehicleState.longitude.toFixed(3)}
            </span>
          </button>

          {/* Driving indicator */}
          {vehicleState.speed > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                Driving at {vehicleState.speed} mph
              </span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
