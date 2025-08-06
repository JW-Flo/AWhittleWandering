import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api-config';
import {
  Battery,
  MapPin,
  Zap,
  Thermometer,
  Gauge,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ConnectedTeslaDataProps {
  onDataUpdate?: (data: {
    vehicle: any;
    drives: any[];
    charges: any[];
    overview: any;
  }) => void;
}

const ConnectedTeslaData: React.FC<ConnectedTeslaDataProps> = ({
  onDataUpdate
}) => {
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchTeslaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the backend API that already has the Tessie API key
      const data = await api.getUnifiedData();
      setUnifiedData(data);
      setIsConnected(true);
      
      if (onDataUpdate) {
        onDataUpdate({
          vehicle: data.currentStatus,
          drives: data.timeline?.drives || [],
          charges: data.timeline?.charges || [],
          overview: data.overview
        });
      }
    } catch (err) {
      console.error('Failed to fetch Tesla data:', err);
      
      // Provide more specific error messaging
      let errorMessage = 'Failed to connect to Tesla data';
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to reach backend API. Please check your connection.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [onDataUpdate]);

  useEffect(() => {
    // Auto-connect when component mounts
    fetchTeslaData();
  }, [fetchTeslaData]);

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Tesla Data Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <Button onClick={fetchTeslaData} disabled={isLoading}>
            {isLoading ? 'Reconnecting...' : 'Retry Connection'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected && !isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Tesla Data Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Connect to your Tesla data via our secure backend API. 
              All API keys are managed securely on the server.
            </AlertDescription>
          </Alert>
          
          <Button onClick={fetchTeslaData} disabled={isLoading} className="w-full">
            {isLoading ? 'Connecting...' : 'Connect to Tesla Data'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Activity className="h-8 w-8 animate-spin mx-auto" />
            <p>Connecting to Tesla data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!unifiedData) {
    return null;
  }

  const { overview, currentStatus } = unifiedData;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Tesla Data Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{overview?.vehicle || 'Tesla Model Y'}</h3>
              <p className="text-sm text-muted-foreground">
                Trip: {overview?.tripName || 'A Whittle Wandering'}
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              {currentStatus?.tessieStatus?.connected ? 'Live Data' : 'Connected'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Trip Overview */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Road Trip Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">States Visited</div>
                <div className="text-2xl font-bold text-blue-600">
                  {overview.statesVisited}/{overview.totalStates}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((overview.statesVisited / overview.totalStates) * 100)}% complete
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Miles</div>
                <div className="text-2xl font-bold text-green-600">
                  {overview.totalMiles?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground">miles driven</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Days Elapsed</div>
                <div className="text-2xl font-bold text-purple-600">
                  {overview.daysElapsed || 0}
                </div>
                <div className="text-xs text-muted-foreground">since start</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Current Odometer</div>
                <div className="text-2xl font-bold">
                  {overview.currentOdometer?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground">total miles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Vehicle Data */}
      {currentStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Vehicle Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentStatus.battery && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Battery className="h-4 w-4" />
                    Battery Level
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {currentStatus.battery.level}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentStatus.battery.range} mi range
                  </div>
                </div>
              )}

              {currentStatus.vehicle && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4" />
                    Odometer
                  </div>
                  <div className="text-2xl font-bold">
                    {currentStatus.vehicle.odometer?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">miles</div>
                </div>
              )}

              {currentStatus.vehicle?.temperature && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Thermometer className="h-4 w-4" />
                    Temperature
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(currentStatus.vehicle.temperature.outside)}°F
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Inside: {Math.round(currentStatus.vehicle.temperature.inside)}°F
                  </div>
                </div>
              )}

              {currentStatus.battery && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4" />
                    Charging
                  </div>
                  <div className="text-2xl font-bold">
                    {currentStatus.battery.charging || 'Not Charging'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Speed: {currentStatus.vehicle?.speed || 0} mph
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Data Synchronization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={fetchTeslaData} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Syncing...' : 'Refresh Tesla Data'}
          </Button>

          {/* Data Summary */}
          {unifiedData.timeline && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {unifiedData.timeline.drives?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Recent Drives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {unifiedData.timeline.charges?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Charge Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentStatus?.tessieStatus?.connected ? 'Live' : 'Cached'}
                </div>
                <div className="text-sm text-muted-foreground">Data Status</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectedTeslaData;
