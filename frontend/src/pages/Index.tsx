import React, { useState, useEffect } from 'react';
import LazyTeslaMap from '@/components/LazyTeslaMap';
import VehicleStats from '@/components/VehicleStats';
import RoadTripTracker from '@/components/RoadTripTracker';
import RealTeslaDataIntegration from '@/components/RealTeslaDataIntegration';
import ProductionBanner from '@/components/ProductionBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Car, Zap, Route, Activity } from 'lucide-react';

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
  };
  tessieStatus: {
    connected: boolean;
    lastUpdate: string;
    dataFreshness: string;
  };
}

const Index = () => {
  const [teslaData, setTeslaData] = useState<TeslaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch live Tesla data from our backend API
  const fetchTeslaData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/unified-data');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setTeslaData(data);
      
      // Try to get mapbox token from backend if available
      try {
        const configResponse = await fetch('https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/config');
        if (configResponse.ok) {
          const config = await configResponse.json();
          if (config.mapboxToken) {
            setMapboxToken(config.mapboxToken);
          }
        }
      } catch (configError) {
        console.log('Could not fetch mapbox token from backend');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Tesla data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and set up auto-refresh
  useEffect(() => {
    fetchTeslaData();
    
    // Auto-refresh every 30 seconds for live data
    const interval = setInterval(fetchTeslaData, 30000);
    
    return () => clearInterval(interval);
  }, []);

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

  // Loading state
  if (isLoading && !teslaData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading live Tesla data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-tesla-gray-light bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-tesla-cyan rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-background" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{teslaData?.overview.tripName || 'A Whittle Wandering'}</h1>
                <p className="text-sm text-muted-foreground">
                  Live Tesla Data - {teslaData?.overview.vehicle || 'Tesla Model Y'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/coordination'}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none hover:opacity-90"
              >
                🚀 AI Coordination Dashboard
              </Button>
              
              {teslaData?.tessieStatus.connected && (
                <Badge variant="outline" className="border-tesla-cyan text-tesla-cyan">
                  Live Data • {teslaData.tessieStatus.dataFreshness}
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTeslaData}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <ProductionBanner />
        
        {error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-tesla-gray">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary">
              <Car className="w-4 h-4 mr-2" />
              Live Dashboard
            </TabsTrigger>
            <TabsTrigger value="integration" className="data-[state=active]:bg-primary">
              <Activity className="w-4 h-4 mr-2" />
              Tesla Data
            </TabsTrigger>
            <TabsTrigger value="roadtrip" className="data-[state=active]:bg-primary">
              <Route className="w-4 h-4 mr-2" />
              Road Trip Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-280px)]">
              {/* Map Section - Full width on mobile */}
              <div className="lg:col-span-2 order-1 lg:order-1">
                <Card className="h-[400px] lg:h-full border-tesla-gray-light">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Live Location - {teslaData?.currentStatus.location.state || 'Unknown'}
                      </CardTitle>
                      {teslaData && (
                        <Badge variant="secondary" className="bg-tesla-cyan/20 text-tesla-cyan">
                          Live Data
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)]">
                    <LazyTeslaMap
                      vehicleLocation={teslaData ? {
                        latitude: teslaData.currentStatus.location.coordinates.lat,
                        longitude: teslaData.currentStatus.location.coordinates.lng,
                        heading: 0,
                        speed: teslaData.currentStatus.vehicle.speed
                      } : undefined}
                      mapboxToken={mapboxToken || undefined}
                      onTokenChange={(token) => setMapboxToken(token)}
                      routeLocations={teslaData?.timeline.drives.map(drive => ({
                        lat: drive.endCoordinates.lat,
                        lng: drive.endCoordinates.lng,
                        timestamp: drive.endTime
                      })) || []}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Stats Section - Appears below map on mobile */}
              <div className="space-y-4 order-2 lg:order-2">
                <VehicleStats
                  batteryLevel={teslaData?.currentStatus.battery.level}
                  range={teslaData?.currentStatus.battery.range}
                  chargingState={getChargingState(teslaData?.currentStatus.battery.charging)}
                  temperature={teslaData?.currentStatus.vehicle.temperature.outside}
                  odometer={teslaData?.currentStatus.vehicle.odometer}
                  speed={teslaData?.currentStatus.vehicle.speed}
                  lastUpdate={formatLastUpdate(teslaData?.currentStatus.location.lastUpdate)}
                />
                
                {/* Trip Stats */}
                {teslaData && (
                  <Card className="border-tesla-gray-light">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Trip Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Days Elapsed:</span>
                        <span className="font-mono">{teslaData.overview.daysElapsed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Miles:</span>
                        <span className="font-mono">{teslaData.overview.totalMiles.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>States Visited:</span>
                        <span className="font-mono">{teslaData.overview.statesVisited} / {teslaData.overview.totalStates}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <RealTeslaDataIntegration 
              onDataUpdate={(data) => {
                // Handle real-time data updates if needed
                console.warn('Data update received:', data);
              }}
            />
          </TabsContent>

          <TabsContent value="roadtrip" className="space-y-6">
            <RoadTripTracker />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
