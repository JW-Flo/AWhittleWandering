import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnifiedJourneyData } from '@/hooks/useUnifiedJourneyData';
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
  const {
    data,
    loading,
    error,
    refetch
  } = useUnifiedJourneyData();

  // Transform backend data to match component expectations
  const vehicles = data?.journey?.currentStatus?.vehicle ? [{
    id: 'midnight-shadow',
    display_name: data.journey.overview?.vehicle || 'Midnight Shadow',
    state: 'online',
    vin: 'midnight-shadow'
  }] : [];

  const selectedVehicle = vehicles[0] || null;
  const vehicleData = data?.journey?.currentStatus ? {
    battery_level: data.journey.currentStatus.battery?.level || 0,
    battery_range: data.journey.currentStatus.battery?.range || 0,
    charging_state: data.journey.currentStatus.battery?.charging || 'Unknown',
    odometer: data.journey.currentStatus.vehicle?.odometer || 0,
    speed: data.journey.currentStatus.vehicle?.speed || 0,
    latitude: data.journey.currentStatus.location?.coordinates?.lat || 0,
    longitude: data.journey.currentStatus.location?.coordinates?.lng || 0,
    inside_temp: data.journey.currentStatus.vehicle?.temperature?.inside || 0,
    outside_temp: data.journey.currentStatus.vehicle?.temperature?.outside || 0,
    timestamp: Date.now()
  } : null;

  const driveHistory = data?.journey?.timeline?.drives?.map((drive: any) => ({
    id: drive.id,
    start_date: drive.date,
    end_date: drive.date,
    start_location_name: drive.startLocation,
    end_location_name: drive.endLocation,
    distance_miles: drive.distance,
    duration_minutes: drive.duration,
    start_latitude: 0,
    start_longitude: 0,
    end_latitude: 0,
    end_longitude: 0
  })) || [];

  const chargeHistory = data?.journey?.timeline?.charges?.map((charge: any) => ({
    id: charge.id,
    start_date: charge.date,
    end_date: charge.date,
    location_name: charge.location,
    energy_added: charge.energyAdded,
    cost: 0,
    latitude: 0,
    longitude: 0
  })) || [];

  const locationHistory: any[] = [];
  const isLoading = loading;

  const fetchVehicleData = async (vehicleId: string) => {
    await refetch();
  };

  const fetchDriveHistory = async (vehicleId: string, startDate: string, endDate: string) => {
    await refetch();
  };

  const fetchChargeHistory = async (vehicleId: string, startDate: string, endDate: string) => {
    await refetch();
  };

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

  const handleStartDataSync = async () => {
    await refetch();
  };

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
