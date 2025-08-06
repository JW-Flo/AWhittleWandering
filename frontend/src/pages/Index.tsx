import React, { useState, useEffect } from 'react';
import LazyTeslaMap from '@/components/LazyTeslaMap';
import VehicleStats from '@/components/VehicleStats';
import ProductionBanner from '@/components/ProductionBanner';
import ConnectedVehicle from '@/components/ConnectedVehicle';
import { TeslaDataProvider } from '@/contexts/TeslaDataContext';
import { api } from '@/lib/api-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Car, Zap, Route, Activity, MapPin } from 'lucide-react';

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

interface AppConfig {
  mapboxToken: string | null;
  apiBaseUrl: string;
  appName: string;
  apiVersion: string;
  features: {
    liveTeslaData: boolean;
    mapIntegration: boolean;
    realtimeUpdates: boolean;
  };
  updateInterval: number;
}

const Index = () => {
  const [teslaData, setTeslaData] = useState<TeslaData | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch app configuration from backend
  const fetchConfig = async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/v1/config`);
      if (!response.ok) {
        throw new Error(`Config API Error: ${response.status}`);
      }
      const config = await response.json();
      setAppConfig(config);
      return config;
    } catch (err) {
      console.error('Could not fetch app config:', err);
      // Fallback config if API fails
      return {
        mapboxToken: null,
        apiBaseUrl: api.baseUrl,
        appName: 'Tesla Road Trip Tracker',
        apiVersion: '3.0.0',
        features: {
          liveTeslaData: true,
          mapIntegration: false,
          realtimeUpdates: true
        },
        updateInterval: 30000
      };
    }
  };

  // Fetch live Tesla data from our backend API
  const fetchTeslaData = async () => {
    try {
      setError(null);
      
      const response = await fetch(`${api.baseUrl}/api/v1/unified-data`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setTeslaData(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Tesla data');
    }
  };

  // Initialize app with config and data
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      // Load configuration first
      const config = await fetchConfig();
      setAppConfig(config);
      
      // Then load Tesla data
      await fetchTeslaData();
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Set up auto-refresh for live data
  useEffect(() => {
    if (!appConfig?.features.realtimeUpdates) return;
    
    const interval = setInterval(fetchTeslaData, appConfig.updateInterval);
    return () => clearInterval(interval);
  }, [appConfig]);

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
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading live Tesla data...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {appConfig?.appName || 'Tesla Road Trip Tracker'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TeslaDataProvider>
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
                  <h1 className="text-2xl font-bold">
                    {teslaData?.overview.tripName || appConfig?.appName || 'A Whittle Wandering'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Live Tesla Data • {teslaData?.overview.vehicle || 'Tesla Model Y'} • v{appConfig?.apiVersion}
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
                    <Activity className="w-3 h-3 mr-1" />
                    Live • {teslaData.tessieStatus.dataFreshness}
                  </Badge>
                )}
                
                {appConfig?.features.mapIntegration && (
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    Maps Enabled
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchTeslaData}
                  className="mt-2"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-tesla-gray">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary">
                <Car className="w-4 h-4 mr-2" />
                Live Dashboard
              </TabsTrigger>
              <TabsTrigger value="vehicle" className="data-[state=active]:bg-primary">
                <Activity className="w-4 h-4 mr-2" />
                Vehicle Status
              </TabsTrigger>
              <TabsTrigger value="roadtrip" className="data-[state=active]:bg-primary">
                <Route className="w-4 h-4 mr-2" />
                Road Trip Progress
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
                        mapboxToken={appConfig?.mapboxToken || undefined}
                        onTokenChange={() => {}} // Token managed by backend now
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
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-tesla-cyan h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(teslaData.overview.statesVisited / teslaData.overview.totalStates) * 100}%` }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vehicle" className="space-y-6">
              <ConnectedVehicle />
            </TabsContent>

            <TabsContent value="roadtrip" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Road Trip Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {teslaData?.timeline.drives.slice(0, 10).map((drive, index) => (
                    <div key={drive.id} className="flex items-center gap-4 py-2 border-b last:border-b-0">
                      <div className="w-8 h-8 bg-tesla-cyan/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-mono">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{drive.endLocation}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(drive.date).toLocaleDateString()} • {drive.distance} miles
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TeslaDataProvider>
  );
};

export default Index;
