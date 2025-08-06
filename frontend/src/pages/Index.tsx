import React, { useState, useEffect } from 'react';
import LazyTeslaMap from '@/components/LazyTeslaMap';
import VehicleStats from '@/components/VehicleStats';
import EnhancedRoadTripTracker from '@/components/EnhancedRoadTripTracker';
import ConnectedTeslaData from '@/components/ConnectedTeslaData';
import ProductionBanner from '@/components/ProductionBanner';
import ConnectedVehicle from '@/components/ConnectedVehicle';
import { useTeslaData } from '@/hooks/useTeslaData';
import { dynamicConfig } from '@/lib/dynamic-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Car, Zap, Route, Activity } from 'lucide-react';
// Real Tesla API integration via backend - secure and production ready

const Index = () => {
  const { data: teslaData, isLoading: teslaLoading, isConnected, refreshData: refreshTeslaData } = useTeslaData();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Load configuration from backend
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Get secure tokens from backend
        const backendMapboxToken = await dynamicConfig.getMapboxToken();
        setMapboxToken(backendMapboxToken);
      } catch (error) {
        console.error('Failed to load configuration:', error);
        // Fallback to environment variable if backend fails
        const fallbackToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (fallbackToken) {
          setMapboxToken(fallbackToken);
        }
      }
    };

    loadConfiguration();
  }, []);

  // Use Tesla data from context
  const displayVehicleData = teslaData?.currentStatus;

  // Show API setup if no TESSIE key and not in demo mode - DISABLED for public website
  // Public users should not need to enter API tokens
  // if (!tessieApiKey && !isDemoMode) {
  //   return <TessieApiSetup onApiKeySubmit={handleTessieApiSubmit} onDemoMode={handleDemoMode} isLoading={isLoading} />;
  // }

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
                <h1 className="text-2xl font-bold">A Whittle Wandering</h1>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Live Tesla Data Connected' : 'Tesla Data Loading...'}
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
              {isConnected && teslaData && (
                <Badge variant="secondary" className="bg-tesla-cyan/20 text-tesla-cyan">
                  Live Tesla Data
                </Badge>
              )}
              {isConnected && teslaData && (
                <Badge variant="secondary" className="bg-tesla-cyan/20 text-tesla-cyan">
                  Live Tesla Data
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshTeslaData?.()}
                disabled={teslaLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${teslaLoading ? 'animate-spin' : ''}`} />
                Refresh Tesla Data
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
                        Live Location
                      </CardTitle>
                      {displayVehicleData && (
                        <Badge variant="secondary" className="bg-tesla-cyan/20 text-tesla-cyan">
                          {isConnected ? 'Live' : 'Loading'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)]">
                    <LazyTeslaMap
                      vehicleLocation={displayVehicleData ? {
                        latitude: displayVehicleData.location.coordinates.lat,
                        longitude: displayVehicleData.location.coordinates.lng,
                        heading: 0, // Not available in current structure
                        speed: displayVehicleData.vehicle.speed
                      } : undefined}
                      mapboxToken={mapboxToken || undefined}
                      routeLocations={[]}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Stats Section - Appears below map on mobile */}
              <div className="space-y-4 order-2 lg:order-2">
                <VehicleStats
                  batteryLevel={displayVehicleData?.battery.level}
                  range={displayVehicleData?.battery.range}
                  chargingState={displayVehicleData?.battery.charging.toLowerCase() as 'charging' | 'complete' | 'disconnected'}
                  temperature={displayVehicleData?.vehicle.temperature.outside}
                  odometer={displayVehicleData?.vehicle.odometer}
                  speed={displayVehicleData?.vehicle.speed}
                  lastUpdate={displayVehicleData?.location.lastUpdate || 'Never'}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <ConnectedTeslaData 
              onDataUpdate={(data) => {
                // Process real Tesla data and update app state
                if (data.vehicle) {
                  // Real-time vehicle data is now available
                }
              }}
            />
          </TabsContent>

          <TabsContent value="roadtrip" className="space-y-6">
            <EnhancedRoadTripTracker />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
