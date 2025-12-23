import React from 'react';
import { useUnifiedJourneyData } from '@/hooks/useUnifiedJourneyData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ApiTestProps {
  // API key prop removed - backend handles authentication
}

export const ApiTest: React.FC<ApiTestProps> = () => {
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
  const refreshHistoricalData = refetch;

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>🧪 Unified API Test Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
            <div className="text-sm text-gray-600">Vehicles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{historicalDrives.length}</div>
            <div className="text-sm text-gray-600">Historical Drives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{historicalCharges.length}</div>
            <div className="text-sm text-gray-600">Historical Charges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {vehicleData?.battery_level || 0}%
            </div>
            <div className="text-sm text-gray-600">Battery Level</div>
          </div>
        </div>

        {vehicleData && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2">✅ Live Vehicle Data Available</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Range: {vehicleData.battery_range} mi</div>
              <div>Odometer: {vehicleData.odometer?.toLocaleString()} mi</div>
              <div>Speed: {vehicleData.speed || 0} mph</div>
              <div>Status: {vehicleData.charging_state}</div>
            </div>
          </div>
        )}

        {historicalDrives.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">🛣️ Sample Drive Data</h4>
            <div className="text-sm">
              <div><strong>Latest Drive:</strong> {historicalDrives[0].start_address} → {historicalDrives[0].end_address}</div>
              <div><strong>Distance:</strong> {historicalDrives[0].distance_miles} miles</div>
              <div><strong>Duration:</strong> {historicalDrives[0].duration_hours.toFixed(1)} hours</div>
            </div>
          </div>
        )}

        {historicalCharges.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-bold text-purple-800 mb-2">⚡ Sample Charge Data</h4>
            <div className="text-sm">
              <div><strong>Latest Charge:</strong> {historicalCharges[0].location}</div>
              <div><strong>Energy Added:</strong> {historicalCharges[0].energy_added_kwh} kWh</div>
              <div><strong>Cost:</strong> ${historicalCharges[0].cost}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-bold text-red-800 mb-2">❌ API Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={refetch} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh Vehicle Data'}
          </Button>
          <Button onClick={refreshHistoricalData} disabled={isLoading} variant="outline">
            Refresh Historical Data
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <div className="mt-2 text-sm text-gray-600">Loading data from backend API...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
