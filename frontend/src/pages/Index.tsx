import React, { useState, useEffect } from 'react';
import TeslaMap from '@/components/TeslaMap';
import VehicleStats from '@/components/VehicleStats';
import TessieApiSetup from '@/components/TessieApiSetup';
import RoadTripTracker from '@/components/RoadTripTracker';
import { useTessieApi } from '@/hooks/useTessieApi';
import { secureKeyStorage } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Car, Zap, Map, Route } from 'lucide-react';

const Index = () => {
  const [tessieApiKey, setTessieApiKey] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load saved API keys from localStorage and environment
  useEffect(() => {
    const { tessieKey, mapboxToken: mbToken } = secureKeyStorage.getStoredKeys();
    
    if (tessieKey) {
      setTessieApiKey(tessieKey);
      secureKeyStorage.storeKeys(); // Ensure keys are stored securely
    }
    if (mbToken) {
      setMapboxToken(mbToken);
    }
    
    // Check if we should start in demo mode
    const savedDemoMode = localStorage.getItem('demo_mode') === 'true';
    if (savedDemoMode) {
      setIsDemoMode(true);
    }
  }, []);

  const { 
    vehicles, 
    selectedVehicle, 
    setSelectedVehicle, 
    vehicleData, 
    isLoading, 
    error,
    refetch 
  } = useTessieApi(isDemoMode ? undefined : tessieApiKey || undefined);

  // No more demo mode - always use real Tessie API data
  const displayVehicles = vehicles;
  const displayVehicleData = vehicleData;

  const handleTessieApiSubmit = (apiKey: string) => {
    localStorage.setItem('tessie_api_key', apiKey);
    localStorage.removeItem('demo_mode');
    setTessieApiKey(apiKey);
    setIsDemoMode(false);
  };

  const handleDemoMode = () => {
    localStorage.setItem('demo_mode', 'true');
    setIsDemoMode(true);
  };

  const handleMapboxTokenChange = (token: string) => {
    localStorage.setItem('mapbox_token', token);
    setMapboxToken(token);
  };

  const formatLastUpdate = (timestamp?: number) => {
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

  // Show API setup if no TESSIE key and not in demo mode
  if (!tessieApiKey && !isDemoMode) {
    return <TessieApiSetup onApiKeySubmit={handleTessieApiSubmit} onDemoMode={handleDemoMode} isLoading={isLoading} />;
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
                <h1 className="text-2xl font-bold">A Whittle Wandering</h1>
                <p className="text-sm text-muted-foreground">
                  {isDemoMode ? 'Demo Mode - Sample Data' : 'Powered by TESSIE'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isDemoMode && (
                <Badge variant="outline" className="border-tesla-cyan text-tesla-cyan">
                  Demo Mode
                </Badge>
              )}
              {displayVehicles.length > 1 && (
                <Select value={selectedVehicle || ''} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.display_name || `Tesla ${vehicle.vin?.slice(-4)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={isLoading || isDemoMode}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isDemoMode ? 'Demo' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-tesla-gray">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary">
              <Car className="w-4 h-4 mr-2" />
              Live Dashboard
            </TabsTrigger>
            <TabsTrigger value="roadtrip" className="data-[state=active]:bg-primary">
              <Route className="w-4 h-4 mr-2" />
              Road Trip Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
              {/* Map Section */}
              <div className="lg:col-span-2">
                <Card className="h-full border-tesla-gray-light">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Live Location
                      </CardTitle>
                      {displayVehicleData && (
                        <Badge variant="secondary" className="bg-tesla-cyan/20 text-tesla-cyan">
                          {isDemoMode ? 'Demo' : 'Live'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)]">
                    <TeslaMap
                      vehicleLocation={displayVehicleData ? {
                        latitude: displayVehicleData.latitude,
                        longitude: displayVehicleData.longitude,
                        heading: displayVehicleData.heading,
                        speed: displayVehicleData.speed
                      } : undefined}
                      mapboxToken={mapboxToken || undefined}
                      onTokenChange={handleMapboxTokenChange}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Stats Section */}
              <div className="space-y-4">
                <VehicleStats
                  batteryLevel={displayVehicleData?.battery_level}
                  range={displayVehicleData?.battery_range}
                  chargingState={getChargingState(displayVehicleData?.charging_state)}
                  temperature={displayVehicleData?.outside_temp}
                  odometer={displayVehicleData?.odometer}
                  speed={displayVehicleData?.speed}
                  lastUpdate={formatLastUpdate(displayVehicleData?.timestamp)}
                />
              </div>
            </div>
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
