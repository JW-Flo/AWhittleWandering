import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEnhancedTessieApi } from '@/hooks/useEnhancedTessieApi';
import {
  Battery,
  MapPin,
  Zap,
  Thermometer,
  Gauge,
  TrendingUp,
  Activity
} from 'lucide-react';

interface RealTeslaDataIntegrationProps {
  onDataUpdate?: (data: {
    vehicle: any;
    drives: any[];
    charges: any[];
    locations: any[];
  }) => void;
}

const RealTeslaDataIntegration: React.FC<RealTeslaDataIntegrationProps> = ({
  onDataUpdate
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  
  const {
    vehicles,
    selectedVehicle,
    vehicleData,
    driveHistory,
    chargeHistory,
    locationHistory,
    isLoading,
    error,
    fetchVehicleData,
    fetchDriveHistory,
    fetchChargeHistory,
    refetch
  } = useEnhancedTessieApi(isApiKeySet ? apiKey : undefined);

  useEffect(() => {
    if (vehicleData && onDataUpdate) {
      onDataUpdate({
        vehicle: vehicleData,
        drives: driveHistory,
        charges: chargeHistory,
        locations: locationHistory
      });
    }
  }, [vehicleData, driveHistory, chargeHistory, locationHistory, onDataUpdate]);

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setIsApiKeySet(true);
    }
  };

  const handleStartDataSync = async () => {
    if (selectedVehicle) {
      try {
        const endDate = new Date().toISOString().split('T')[0];
        await Promise.all([
          fetchVehicleData(selectedVehicle.id),
          fetchDriveHistory(selectedVehicle.id, '2025-06-01', endDate),
          fetchChargeHistory(selectedVehicle.id, '2025-06-01', endDate)
        ]);
      } catch (err) {
        console.error('Data sync failed:', err);
      }
    }
  };

  if (!isApiKeySet) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Real Tesla Data Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Connect your Tesla vehicle via Tessie API to access real-time data, 
              historical drives, and charging sessions for your road trip tracking.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Tessie API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your Tessie API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
              />
              <Button onClick={handleApiKeySubmit} disabled={!apiKey.trim()}>
                Connect
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from: <a href="https://my.tessie.com/settings/api" target="_blank" rel="noopener noreferrer" className="underline">my.tessie.com/settings/api</a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Connected Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length > 0 ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedVehicle?.display_name}</h3>
                <p className="text-sm text-muted-foreground">VIN: {selectedVehicle?.vin}</p>
              </div>
              <Badge variant={selectedVehicle?.state === 'online' ? 'default' : 'secondary'}>
                {selectedVehicle?.state}
              </Badge>
            </div>
          ) : (
            <div className="text-center py-4">
              <Button onClick={refetch} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Load Vehicles'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Vehicle Data */}
      {vehicleData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Vehicle Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Battery className="h-4 w-4" />
                  Battery Level
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {vehicleData.battery_level}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {vehicleData.battery_range} mi range
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className="h-4 w-4" />
                  Odometer
                </div>
                <div className="text-2xl font-bold">
                  {vehicleData.odometer.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">miles</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Thermometer className="h-4 w-4" />
                  Temperature
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(vehicleData.outside_temp)}°F
                </div>
                <div className="text-xs text-muted-foreground">
                  Inside: {Math.round(vehicleData.inside_temp)}°F
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4" />
                  Charging
                </div>
                <div className="text-2xl font-bold">
                  {vehicleData.charging_state}
                </div>
                <div className="text-xs text-muted-foreground">
                  Speed: {vehicleData.speed} mph
                </div>
              </div>
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
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleStartDataSync} 
            disabled={isLoading || !selectedVehicle}
            className="w-full"
          >
            {isLoading ? 'Syncing...' : 'Sync Tesla Data'}
          </Button>

          {/* Data Summary */}
          {(driveHistory.length > 0 || chargeHistory.length > 0) && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {driveHistory.length}
                </div>
                <div className="text-sm text-muted-foreground">Drives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {chargeHistory.length}
                </div>
                <div className="text-sm text-muted-foreground">Charges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {locationHistory.length}
                </div>
                <div className="text-sm text-muted-foreground">Locations</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTeslaDataIntegration;
