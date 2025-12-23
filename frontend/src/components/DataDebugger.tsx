import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUnifiedJourneyData } from '@/hooks/useUnifiedJourneyData';

interface DataDebuggerProps {
  // API key prop removed - backend handles authentication
}

const DataDebugger: React.FC<DataDebuggerProps> = () => {
  const { 
    data,
    loading, 
    error 
  } = useUnifiedJourneyData();

  // Transform backend data to match component expectations
  const vehicles = data?.journey?.currentStatus?.vehicle ? [{
    id: 'midnight-shadow',
    display_name: data.journey.overview?.vehicle || 'Midnight Shadow',
    state: 'online',
    vin: 'midnight-shadow'
  }] : [];

  const vehicleData = data?.journey?.currentStatus ? {
    battery_level: data.journey.currentStatus.battery?.level || 0,
    battery_range: data.journey.currentStatus.battery?.range || 0,
    charging_state: data.journey.currentStatus.battery?.charging || 'Unknown',
    odometer: data.journey.currentStatus.vehicle?.odometer || 0,
    speed: data.journey.currentStatus.vehicle?.speed || 0,
    latitude: data.journey.currentStatus.location?.coordinates?.lat || 0,
    longitude: data.journey.currentStatus.location?.coordinates?.lng || 0,
    timestamp: Date.now()
  } : null;

  const historicalDrives = data?.journey?.timeline?.drives?.map((drive: any) => ({
    id: drive.id,
    start_time: drive.date,
    end_time: drive.date,
    start_address: drive.startLocation,
    end_address: drive.endLocation,
    distance_miles: drive.distance,
    duration_hours: drive.duration / 60,
    start_coordinates: { lat: 0, lng: 0 },
    end_coordinates: { lat: 0, lng: 0 }
  })) || [];

  const historicalCharges = data?.journey?.timeline?.charges?.map((charge: any) => ({
    id: charge.id,
    start_time: charge.date,
    end_time: charge.date,
    location: charge.location,
    energy_added_kwh: charge.energyAdded,
    cost: 0,
    coordinates: { lat: 0, lng: 0 }
  })) || [];

  const isLoading = loading;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">API Status</h4>
            <div className="space-y-1 text-sm">
              <div>Loading: <Badge variant={isLoading ? "destructive" : "default"}>{isLoading ? "Yes" : "No"}</Badge></div>
              <div>Error: <Badge variant={error ? "destructive" : "default"}>{error || "None"}</Badge></div>
              <div>Backend API: <Badge variant={data ? "default" : "destructive"}>{data ? "Connected" : "Disconnected"}</Badge></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Data Counts</h4>
            <div className="space-y-1 text-sm">
              <div>Vehicles: <Badge>{vehicles.length}</Badge></div>
              <div>Historical Drives: <Badge>{historicalDrives.length}</Badge></div>
              <div>Historical Charges: <Badge>{historicalCharges.length}</Badge></div>
              <div>Vehicle Data: <Badge variant={vehicleData ? "default" : "destructive"}>{vehicleData ? "Available" : "Missing"}</Badge></div>
            </div>
          </div>
        </div>

        {historicalDrives.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Sample Drive Data</h4>
            <div className="bg-muted p-3 rounded text-xs font-mono">
              <pre>{JSON.stringify(historicalDrives[0], null, 2)}</pre>
            </div>
          </div>
        )}

        {historicalCharges.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Sample Charge Data</h4>
            <div className="bg-muted p-3 rounded text-xs font-mono">
              <pre>{JSON.stringify(historicalCharges[0], null, 2)}</pre>
            </div>
          </div>
        )}

        {vehicleData && (
          <div>
            <h4 className="font-medium mb-2">Current Vehicle Data</h4>
            <div className="bg-muted p-3 rounded text-xs font-mono">
              <pre>{JSON.stringify(vehicleData, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataDebugger;
