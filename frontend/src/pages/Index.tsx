import React, { useState, useEffect } from 'react';
import VehicleStats from '@/components/VehicleStats';
import ProductionBanner from '@/components/ProductionBanner';
import ConnectedVehicle from '@/components/ConnectedVehicle';
import { TeslaDataProvider } from '@/contexts/TeslaDataContext';
import { api } from '@/lib/api-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Car, Route, Activity } from 'lucide-react';

interface TeslaData {
  overview: {
    tripName: string;
    vehicle: string;
    startDate: string;
    daysElapsed: number;
    totalMiles: number;
    currentOdometer: number;
    statesVisited: number;
    totalStates: number;
  };
  currentStatus: {
    battery: {
      level: number;
      range: number;
      charging: string;
    };
    location: {
      coordinates: {
        lat: number;
        lng: number;
      };
      state: string;
      lastUpdate: string;
      city: string;
    };
    vehicle: {
      odometer: number;
      speed: number;
      temperature: {
        inside: number;
        outside: number;
      };
    };
  };
  timeline: {
    drives: Array<{
      id: number;
      date: string;
      startTime: string;
      endTime: string;
      distance: number;
      startLocation: string;
      endLocation: string;
      startCoordinates: { lat: number; lng: number };
      endCoordinates: { lat: number; lng: number };
    }>;
    charges: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      location: string;
      energyAdded: number;
      cost: number;
    }>;
  };
  tessieStatus: {
    connected: boolean;
    lastUpdate: string;
    dataFreshness: string;
  };
}

const IndexContent = () => {
  const [realTeslaData, setRealTeslaData] = useState<TeslaData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load real Tesla data on component mount
  useEffect(() => {
    const loadTeslaData = async () => {
      try {
        const data = await api.getUnifiedData();
        setRealTeslaData(data as TeslaData);
        setError(null);
      } catch (err) {
        console.error('Failed to load Tesla data:', err);
        setError('Failed to load Tesla data');
      }
    };

    loadTeslaData();
  }, []);

  const refreshTeslaData = async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getUnifiedData();
      setRealTeslaData(data as TeslaData);
      setError(null);
    } catch (error) {
      console.error('Failed to refresh Tesla data:', error);
      setError('Failed to refresh Tesla data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdate = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getChargingState = (state?: string) => {
    switch (state?.toLowerCase()) {
      case 'charging': return 'charging';
      case 'complete': return 'complete';
      default: return 'disconnected';
    }
  };

  // Extract vehicle data from real Tesla data
  const vehicleData = realTeslaData?.currentStatus;
  const battery = vehicleData?.battery;
  const vehicle = vehicleData?.vehicle;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tesla Road Trip Tracker</h1>
                <p className="text-sm text-gray-600">
                  {realTeslaData?.tessieStatus?.connected ? 'Live Tesla Data' : 'Connecting to Tesla...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {realTeslaData?.tessieStatus?.connected && (
                <Badge variant="outline" className="border-green-500 text-green-500">
                  Live Data
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshTeslaData}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <ProductionBanner />
        <ConnectedVehicle />
        
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Car className="w-4 h-4 mr-2" />
              Live Dashboard
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Trip Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              
              {/* Map Placeholder - Simplified for now */}
              <div className="lg:col-span-2">
                <Card className="h-[400px] lg:h-[500px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Route className="w-5 h-5 text-blue-600" />
                      Live Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)] flex items-center justify-center">
                    <div className="text-center space-y-4">
                      {realTeslaData?.currentStatus?.location ? (
                        <>
                          <div className="text-lg font-semibold text-gray-900">
                            Current Location: {realTeslaData.currentStatus.location.state}
                          </div>
                          <div className="text-sm text-gray-600">
                            Coordinates: {realTeslaData.currentStatus.location.coordinates.lat.toFixed(6)}, {realTeslaData.currentStatus.location.coordinates.lng.toFixed(6)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Last updated: {formatLastUpdate(realTeslaData.currentStatus.location.lastUpdate)}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">Loading location...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Stats */}
              <div className="space-y-4">
                <VehicleStats
                  batteryLevel={battery?.level}
                  range={battery?.range}
                  chargingState={getChargingState(battery?.charging)}
                  temperature={vehicle?.temperature?.outside}
                  odometer={vehicle?.odometer}
                  speed={vehicle?.speed}
                  lastUpdate={formatLastUpdate(realTeslaData?.tessieStatus?.lastUpdate)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {realTeslaData?.overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{realTeslaData.overview.tripName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Vehicle: {realTeslaData.overview.vehicle}</p>
                      <p className="text-sm text-gray-600">Start Date: {realTeslaData.overview.startDate}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-blue-600">{realTeslaData.overview.daysElapsed}</p>
                      <p className="text-sm text-gray-600">Days Elapsed</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Distance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">{realTeslaData.overview.totalMiles.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Miles Traveled</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">States</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-purple-600">{realTeslaData.overview.statesVisited}/{realTeslaData.overview.totalStates}</p>
                      <p className="text-sm text-gray-600">States Visited</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <TeslaDataProvider>
      <IndexContent />
    </TeslaDataProvider>
  );
};

export default Index;
