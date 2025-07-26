import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Route, 
  Clock, 
  Battery, 
  Thermometer,
  Wifi,
  WifiOff,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
  Car,
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Signal
} from 'lucide-react';

interface LocationData {
  coordinates: { lat: number; lng: number };
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
    country: string;
  };
  accuracy: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  timestamp: string;
}

interface VehicleData {
  batteryLevel: number;
  range: number;
  chargingState: 'charging' | 'complete' | 'disconnected';
  temperature: {
    inside: number;
    outside: number;
  };
  odometer: number;
  speed: number;
  heading: number;
  isMoving: boolean;
  lastUpdate: string;
  connectionStatus: 'online' | 'offline' | 'intermittent';
}

interface JourneyProgress {
  currentState: string;
  statesVisited: number;
  totalStates: number;
  journeyMiles: number;
  targetMiles: number;
  daysElapsed: number;
  completionPercentage: number;
  nextStateEstimate?: {
    state: string;
    distance: number;
    estimatedArrival: string;
  };
}

interface RealTimeLocationTrackerProps {
  location?: LocationData;
  vehicle?: VehicleData;
  journey?: JourneyProgress;
  updateInterval?: number;
  onLocationUpdate?: (location: LocationData) => void;
  onVehicleUpdate?: (vehicle: VehicleData) => void;
  autoRefresh?: boolean;
  showDetailedMetrics?: boolean;
}

const RealTimeLocationTracker: React.FC<RealTimeLocationTrackerProps> = ({
  location,
  vehicle,
  journey,
  updateInterval = 30000, // 30 seconds
  onLocationUpdate,
  onVehicleUpdate,
  autoRefresh = true,
  showDetailedMetrics = true
}) => {
  const [isTracking, setIsTracking] = useState(autoRefresh);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sample data for demonstration
  const sampleLocation: LocationData = {
    coordinates: { lat: 41.1865, lng: -73.1532 },
    address: {
      street: '150 Greenwich Ave',
      city: 'Greenwich',
      state: 'Connecticut',
      zipCode: '06830',
      country: 'United States'
    },
    accuracy: 5.2,
    heading: 67,
    speed: 0,
    altitude: 125,
    timestamp: new Date().toISOString()
  };

  const sampleVehicle: VehicleData = {
    batteryLevel: 82,
    range: 267,
    chargingState: 'complete',
    temperature: {
      inside: 72,
      outside: 78
    },
    odometer: 70128,
    speed: 0,
    heading: 67,
    isMoving: false,
    lastUpdate: new Date().toISOString(),
    connectionStatus: 'online'
  };

  const sampleJourney: JourneyProgress = {
    currentState: 'Connecticut',
    statesVisited: 29,
    totalStates: 48,
    journeyMiles: 11950,
    targetMiles: 15000,
    daysElapsed: 56,
    completionPercentage: 60.4,
    nextStateEstimate: {
      state: 'Massachusetts',
      distance: 47,
      estimatedArrival: '2024-08-03T10:30:00Z'
    }
  };

  const currentLocation = location || sampleLocation;
  const currentVehicle = vehicle || sampleVehicle;
  const currentJourney = journey || sampleJourney;

  // Auto-refresh mechanism
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(async () => {
      try {
        setRefreshing(true);
        setUpdateError(null);
        
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLastUpdateTime(new Date());
        setConnectionStatus('connected');
        
        // Trigger callbacks
        if (onLocationUpdate) {
          onLocationUpdate({
            ...currentLocation,
            timestamp: new Date().toISOString()
          });
        }
        
        if (onVehicleUpdate) {
          onVehicleUpdate({
            ...currentVehicle,
            lastUpdate: new Date().toISOString()
          });
        }
        
      } catch (error) {
        setUpdateError('Failed to update location data');
        setConnectionStatus('disconnected');
      } finally {
        setRefreshing(false);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isTracking, updateInterval]);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    setUpdateError(null);
    
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastUpdateTime(new Date());
      setConnectionStatus('connected');
    } catch (error) {
      setUpdateError('Manual refresh failed');
      setConnectionStatus('disconnected');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const formatLastUpdate = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 30) return 'Just now';
    if (diffMins < 1) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionIcon = (status: string) => {
    switch (status) {
      case 'connected': return Wifi;
      case 'connecting': return RefreshCw;
      case 'disconnected': return WifiOff;
      default: return Signal;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status & Controls */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4" />
              Real-Time Tracking
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {connectionStatus === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
                {connectionStatus === 'disconnected' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {connectionStatus}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="h-8"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Last Update:</span>
              <span className="font-medium">{formatLastUpdate(lastUpdateTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Auto-refresh:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTracking(!isTracking)}
                className="h-6 px-2 text-xs"
              >
                {isTracking ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
          
          {updateError && (
            <Alert className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {updateError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {currentLocation.address.city}, {currentLocation.address.state}
                </h3>
                {currentLocation.address.street && (
                  <p className="text-sm text-muted-foreground">
                    {currentLocation.address.street}
                  </p>
                )}
                <p className="text-xs text-muted-foreground font-mono">
                  {currentLocation.coordinates.lat.toFixed(6)}, {currentLocation.coordinates.lng.toFixed(6)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Accuracy:</span>
                  <div className="font-semibold">±{currentLocation.accuracy.toFixed(1)}m</div>
                </div>
                {currentLocation.altitude && (
                  <div>
                    <span className="text-muted-foreground">Altitude:</span>
                    <div className="font-semibold">{Math.round(currentLocation.altitude)}ft</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Speed:</span>
                  <div className="font-semibold">{currentVehicle.speed} mph</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Heading:</span>
                  <div className="font-semibold flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    {currentVehicle.heading}°
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="font-semibold">
                    {currentVehicle.isMoving ? (
                      <Badge variant="default" className="text-xs">
                        <Car className="w-3 h-3 mr-1" />
                        Moving
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Parked
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Range:</span>
                  <div className="font-semibold text-green-600">{currentVehicle.range} mi</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-green-500" />
            Vehicle Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Battery */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Battery Level</span>
                <span className="text-lg font-bold">{currentVehicle.batteryLevel}%</span>
              </div>
              <Progress value={currentVehicle.batteryLevel} className="h-3" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {currentVehicle.chargingState === 'charging' && (
                  <>
                    <Zap className="w-3 h-3 text-green-500" />
                    <span>Charging</span>
                  </>
                )}
                {currentVehicle.chargingState === 'complete' && (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Charge Complete</span>
                  </>
                )}
                <span className="ml-auto">{currentVehicle.range} miles range</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Inside:</span>
                  <div className="font-semibold">{currentVehicle.temperature.inside}°F</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Outside:</span>
                  <div className="font-semibold">{currentVehicle.temperature.outside}°F</div>
                </div>
              </div>
            </div>

            {/* Odometer */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                <span className="text-sm font-medium">Journey Stats</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Odometer:</span>
                  <span className="font-semibold font-mono">{currentVehicle.odometer.toLocaleString()} mi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Journey Miles:</span>
                  <span className="font-semibold">{currentJourney.journeyMiles.toLocaleString()} mi</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Progress */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Continental Journey Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                {currentJourney.statesVisited}
              </div>
              <div className="text-sm text-muted-foreground">
                States Conquered
              </div>
              <div className="text-xs text-muted-foreground">
                of {currentJourney.totalStates} total
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {currentJourney.completionPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Journey Complete
              </div>
              <div className="text-xs text-muted-foreground">
                Day {currentJourney.daysElapsed}
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {(currentJourney.targetMiles - currentJourney.journeyMiles).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Miles to Goal
              </div>
              <div className="text-xs text-muted-foreground">
                of {currentJourney.targetMiles.toLocaleString()} target
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{currentJourney.completionPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={currentJourney.completionPercentage} className="h-3" />
          </div>
          
          {currentJourney.nextStateEstimate && (
            <Alert className="bg-blue-50 border-blue-200">
              <Route className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="font-medium">Next destination: {currentJourney.nextStateEstimate.state}</div>
                <div className="text-sm">
                  {currentJourney.nextStateEstimate.distance} miles away • 
                  ETA: {new Date(currentJourney.nextStateEstimate.estimatedArrival).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                  })}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detailed Metrics (if enabled) */}
      {showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Detailed Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">GPS Accuracy:</span>
                <div className="font-semibold">±{currentLocation.accuracy.toFixed(1)}m</div>
              </div>
              <div>
                <span className="text-muted-foreground">Connection Quality:</span>
                <div className="font-semibold capitalize">{currentVehicle.connectionStatus}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Update Frequency:</span>
                <div className="font-semibold">{Math.round(updateInterval / 1000)}s</div>
              </div>
              <div>
                <span className="text-muted-foreground">Data Freshness:</span>
                <div className="font-semibold">{formatLastUpdate(currentVehicle.lastUpdate)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeLocationTracker;
