import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, Battery, Gauge } from 'lucide-react';
import { roadTripApi, type VehicleStatus } from '@/services/roadTripApi';

const ConnectedVehicle: React.FC = () => {
  const [vehicleData, setVehicleData] = useState<VehicleStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoading(true);
        const tripData = await roadTripApi.getTripData();
        setVehicleData(tripData.vehicle);
      } catch (error) {
        console.error('Failed to fetch vehicle data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchVehicleData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Car className="w-8 h-8 text-gray-400" />
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vehicleData) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Car className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">{vehicleData.name}</h3>
              <p className="text-sm text-muted-foreground">VIN: {vehicleData.vin}</p>
            </div>
            <Badge className="bg-green-500">online</Badge>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Battery Level */}
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-primary" />
              <div className="text-center">
                <div className="text-lg font-bold">{vehicleData.batteryLevel}%</div>
                <div className="text-xs text-muted-foreground">{vehicleData.range} mi range</div>
              </div>
            </div>
            
            {/* Odometer */}
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              <div className="text-center">
                <div className="text-lg font-bold">{vehicleData.odometer.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">miles</div>
              </div>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div className="text-center">
                <div className="text-sm font-medium">{vehicleData.location.state}</div>
                <div className="text-xs text-muted-foreground">
                  {vehicleData.temperature.outside}°F
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedVehicle;
