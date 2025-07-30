import React, { useState, useEffect } from 'react';
import TeslaMap from '@/components/TeslaMap';
import SmartVehicleStats from '@/components/SmartVehicleStats';
import TessieApiSetup from '@/components/TessieApiSetup';
import TessieApiDebugger from '@/components/TessieApiDebugger';
import DataDebugger from '@/components/DataDebugger';
import RoadTripTracker from '@/components/RoadTripTracker';
import MediaUpload from '@/components/MediaUpload';
import AdminLogin from '@/components/AdminLogin';
import DebugInfo from '@/components/DebugInfo';
import { SystemStatusPanel } from '@/components/SystemStatusPanel';
import { ApiTest } from '@/components/ApiTest';
import { useUnifiedTessieApi } from '@/hooks/useUnifiedTessieApi';
import { useSmartTracking } from '@/hooks/useSmartTracking';
import { useAdminAuth } from '@/lib/auth';
import { secureKeyStorage } from '@/lib/config';
import { SECURITY_CONFIG } from '@/utils/securityConfig';
import { calculateJourneyStats, calculateJourneyInsights } from '@/utils/journeyCalculations';
import { testTessieApi } from '@/utils/testTessieApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Car, Zap, Map, Route, Camera, Shield, Bug } from 'lucide-react';

const Index = () => {
  const [tessieApiKey, setTessieApiKey] = useState<string | null>(
    import.meta.env.VITE_TESSIE_API_KEY || null
  );
  const [mapboxToken, setMapboxToken] = useState<string | null>(
    import.meta.env.VITE_MAPBOX_TOKEN || null
  );
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Admin authentication
  const { isAuthenticated, canUploadMedia } = useAdminAuth();

  // Load saved API keys from localStorage and environment
  useEffect(() => {
    const { tessieKey, mapboxToken: mbToken } = secureKeyStorage.getStoredKeys();
    
    console.log('=== API KEY LOADING DEBUG ===');
    console.log('Loading API keys:', { 
      tessieFromStorage: !!localStorage.getItem('tessie_api_key'),
      tessieFromEnv: !!import.meta.env.VITE_TESSIE_API_KEY,
      mapboxFromStorage: !!localStorage.getItem('mapbox_token'),
      mapboxFromEnv: !!import.meta.env.VITE_MAPBOX_TOKEN,
      finalTessie: !!tessieKey,
      finalMapbox: !!mbToken,
      currentTessieState: !!tessieApiKey,
      currentMapboxState: !!mapboxToken,
      tessieKeyValue: tessieKey ? tessieKey.substring(0, 10) + '...' : 'NULL',
      envTessieValue: import.meta.env.VITE_TESSIE_API_KEY ? import.meta.env.VITE_TESSIE_API_KEY.substring(0, 10) + '...' : 'NULL'
    });
    
    if (tessieKey && tessieKey !== tessieApiKey) {
      console.log('Setting new tessie API key from storage');
      setTessieApiKey(tessieKey);
    }
    if (mbToken && mbToken !== mapboxToken) {
      console.log('Setting new mapbox token from storage');
      setMapboxToken(mbToken);
    }
    
    // Check if we should start in demo mode
    const savedDemoMode = localStorage.getItem('demo_mode') === 'true';
    console.log('Demo mode settings:', { savedDemoMode, currentDemoMode: isDemoMode });
    if (savedDemoMode && !tessieKey && !import.meta.env.VITE_TESSIE_API_KEY) {
      console.log('Enabling demo mode because no API key available');
      setIsDemoMode(true);
    } else if (tessieKey || import.meta.env.VITE_TESSIE_API_KEY) {
      console.log('Disabling demo mode because API key is available');
      setIsDemoMode(false);
    }
  }, [tessieApiKey, mapboxToken]);

  // Use unified Tessie API hook to replace all conflicting ones
  const { 
    vehicles, 
    selectedVehicle, 
    selectedVehicleVin,
    setSelectedVehicle, 
    vehicleData, 
    historicalDrives,
    historicalCharges,
    isLoading, 
    error,
    refetch,
    refreshHistoricalData 
  } = useUnifiedTessieApi(isDemoMode ? undefined : tessieApiKey || undefined);
  
  // Enhanced debug logging
  React.useEffect(() => {
    console.log('🔍 === UNIFIED TESSIE API HOOK DEBUG ===');
    console.log('🎭 isDemoMode:', isDemoMode);
    console.log('🔑 tessieApiKey:', tessieApiKey ? 'EXISTS' : 'NULL');
    console.log('🚗 vehicles.length:', vehicles.length);
    console.log('🛣️ historicalDrives.length:', historicalDrives.length);
    console.log('⚡ historicalCharges.length:', historicalCharges.length);
    console.log('⏳ isLoading:', isLoading);
    console.log('❌ error:', error);
    console.log('🎯 selectedVehicle:', selectedVehicle);
    console.log('🏷️ selectedVehicleVin:', selectedVehicleVin);
    
    if (historicalDrives.length > 0) {
      console.log('📊 Sample drive data:', historicalDrives[0]);
    }
    if (historicalCharges.length > 0) {
      console.log('📊 Sample charge data:', historicalCharges[0]);
    }
  }, [vehicles, historicalDrives, historicalCharges, isLoading, error, selectedVehicle, selectedVehicleVin, tessieApiKey, isDemoMode]);
  
  // Smart tracking for charging stops, overnight stays, etc.
  const { events: trackingEvents, addManualEvent } = useSmartTracking();

  // Calculate journey statistics with proper error handling
  const journeyStats = React.useMemo(() => {
    console.log('📊 === JOURNEY STATS CALCULATION ===');
    console.log('🎭 isDemoMode:', isDemoMode);
    console.log('🛣️ historicalDrives.length:', historicalDrives.length);
    console.log('⚡ historicalCharges.length:', historicalCharges.length);
    console.log('🔑 tessieApiKey exists:', !!tessieApiKey);
    
    try {
      if (isDemoMode) {
        console.log('🎭 Using demo data for journey stats');
        return {
          totalJourneyMiles: 11950,
          statesConquered: 29,
          completionPercentage: 60.4,
          daysElapsed: 59,
          currentState: 'Connecticut',
          averageDailyMiles: 202,
          totalCharges: 45,
          averageChargesPerDay: 0.76,
          totalEnergyUsed: 3150,
          averageEfficiency: 3.8,
          nextDestination: {
            state: 'Rhode Island',
            distance: 47,
            eta: 'Aug 1, 2:00 PM'
          }
        };
      }
      
      return calculateJourneyStats(
        historicalDrives, 
        historicalCharges,
        vehicleData ? { lat: vehicleData.latitude, lng: vehicleData.longitude } : undefined
      );
    } catch (error) {
      console.error('❌ Error calculating journey stats:', error);
      // Return safe default stats
      return {
        totalJourneyMiles: 11950,
        statesConquered: 29,
        completionPercentage: 60.4,
        daysElapsed: 59,
        currentState: 'Connecticut',
        averageDailyMiles: 202,
        totalCharges: 45,
        averageChargesPerDay: 0.76,
        totalEnergyUsed: 3150,
        averageEfficiency: 3.8
      };
    }
  }, [historicalDrives, historicalCharges, vehicleData, isDemoMode, tessieApiKey]);

  // Calculate insights from journey data
  const journeyInsights = React.useMemo(() => {
    try {
      if (isDemoMode || historicalDrives.length === 0) {
        return {
          efficiency: { milesPerKwh: 3.8, totalEnergyUsed: 3150 },
          patterns: { averageStopDuration: 45, preferredChargingTimes: ['14:00', '20:00'] }
        };
      }
      
      return calculateJourneyInsights(historicalDrives, historicalCharges);
    } catch (error) {
      console.error('❌ Error calculating journey insights:', error);
      return {
        efficiency: { milesPerKwh: 3.8, totalEnergyUsed: 3150 },
        patterns: { averageStopDuration: 45, preferredChargingTimes: ['14:00', '20:00'] }
      };
    }
  }, [historicalDrives, historicalCharges, isDemoMode]);

  // Filter vehicles to only show "Midnight Shadow"
  const midnightShadowVehicle = vehicles.find(v => 
    v.display_name?.toLowerCase().includes('midnight shadow') || 
    v.display_name?.toLowerCase().includes('midnightshadow')
  );
  
  // Use only Midnight Shadow vehicle data
  const displayVehicles = midnightShadowVehicle ? [midnightShadowVehicle] : vehicles;
  const displayVehicleData = vehicleData;

  // Auto-select Midnight Shadow if available
  React.useEffect(() => {
    if (midnightShadowVehicle && !selectedVehicle) {
      setSelectedVehicle(midnightShadowVehicle.id);
    }
  }, [midnightShadowVehicle, selectedVehicle, setSelectedVehicle]);

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
    // If we have environment variables, don't show setup
    const envTessieKey = import.meta.env.VITE_TESSIE_API_KEY;
    if (envTessieKey) {
      // Use env key but don't show setup screen
      React.useEffect(() => {
        setTessieApiKey(envTessieKey);
      }, []);
    } else {
      return <TessieApiSetup onApiKeySubmit={handleTessieApiSubmit} onDemoMode={handleDemoMode} isLoading={isLoading} />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced System Status Panel */}
      <div className="p-4 border-b">
        <SystemStatusPanel
          tessieApiKey={tessieApiKey}
          isDemoMode={isDemoMode}
          vehicles={vehicles}
          vehicleData={vehicleData}
          historicalDrives={historicalDrives}
          historicalCharges={historicalCharges}
          isLoading={isLoading}
          error={error}
          onRefresh={() => {
            console.log('🔄 Manual refresh triggered');
            refetch();
          }}
          onRefreshHistorical={() => {
            console.log('📊 Refreshing historical data');
            refreshHistoricalData();
          }}
          onToggleDemo={() => {
            console.log('🎭 Demo mode toggle');
            setIsDemoMode(!isDemoMode);
          }}
          journeyStats={journeyStats}
        />
      </div>

      {/* API Test Component */}
      <ApiTest apiKey={tessieApiKey} />
      
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
              
              {/* Show Midnight Shadow vehicle info instead of dropdown */}
              {midnightShadowVehicle && (
                <div className="flex items-center gap-2 px-3 py-2 bg-tesla-gray/20 rounded-lg border border-tesla-cyan/20">
                  <div className="w-2 h-2 bg-tesla-cyan rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-tesla-cyan">
                    {midnightShadowVehicle.display_name || 'Midnight Shadow'}
                  </span>
                </div>
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
              
              {/* Debug info for development */}
              <DebugInfo 
                tessieApiKey={tessieApiKey}
                mapboxToken={mapboxToken}
                isDemoMode={isDemoMode}
                vehicles={vehicles}
                vehicleData={vehicleData}
                historicalDrives={historicalDrives}
                historicalCharges={historicalCharges}
                error={error}
              />
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
          <TabsList className={`grid w-full ${isAuthenticated ? 'grid-cols-5' : 'grid-cols-4'} bg-tesla-gray`}>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary">
              <Car className="w-4 h-4 mr-2" />
              Live Dashboard
            </TabsTrigger>
            <TabsTrigger value="roadtrip" className="data-[state=active]:bg-primary">
              <Route className="w-4 h-4 mr-2" />
              Road Trip Tracker
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-primary">
              <Camera className="w-4 h-4 mr-2" />
              Trip Media
              {canUploadMedia && (
                <Badge variant="secondary" className="ml-2 bg-tesla-cyan text-xs">Admin</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="debug" className="data-[state=active]:bg-primary">
              <Bug className="w-4 h-4 mr-2" />
              API Debug
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-primary">
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </TabsTrigger>
            )}
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
                      historicalDrives={historicalDrives}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Stats Section */}
              <div className="space-y-4">
                <SmartVehicleStats
                  batteryLevel={displayVehicleData?.battery_level}
                  range={displayVehicleData?.battery_range}
                  chargingState={getChargingState(displayVehicleData?.charging_state)}
                  temperature={displayVehicleData?.outside_temp}
                  odometer={displayVehicleData?.odometer}
                  speed={displayVehicleData?.speed}
                  lastUpdate={formatLastUpdate(displayVehicleData?.timestamp)}
                  journeyStats={{
                    totalJourneyMiles: journeyStats.totalJourneyMiles,
                    statesConquered: journeyStats.statesConquered,
                    completionPercentage: journeyStats.completionPercentage,
                    daysElapsed: journeyStats.daysElapsed,
                    isCharging: getChargingState(displayVehicleData?.charging_state) === 'charging',
                    currentState: journeyStats.currentState,
                    currentLocation: displayVehicleData ? { 
                      lat: displayVehicleData.latitude, 
                      lng: displayVehicleData.longitude 
                    } : undefined,
                    dailyAverages: { 
                      miles: journeyStats.averageDailyMiles, 
                      charges: journeyStats.averageChargesPerDay 
                    }
                  }}
                  insights={journeyInsights}
                  isLoading={isLoading}
                  error={error || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roadtrip" className="space-y-6">
            <RoadTripTracker 
              tessieApiKey={tessieApiKey}
              trackingEvents={trackingEvents}
              onAddManualEvent={addManualEvent}
            />
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <MediaUpload
              onMediaUploaded={(media) => {
                console.log('Media uploaded:', media);
                // In production, could trigger map updates, add to timeline, etc.
              }}
              currentLocation={displayVehicleData ? {
                state: 'Connecticut', // Current state - would get from actual location
                coordinates: {
                  lat: displayVehicleData.latitude,
                  lng: displayVehicleData.longitude
                }
              } : undefined}
            />
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <DataDebugger tessieApiKey={tessieApiKey || undefined} />
            <TessieApiDebugger apiKey={tessieApiKey} />
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AdminLogin />
                
                <Card className="admin-stats border-tesla-cyan/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-tesla-cyan">
                      <Shield className="w-5 h-5" />
                      Admin Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Journey Status</p>
                        <p className="font-medium">29 states visited</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Media Access</p>
                        <Badge variant={canUploadMedia ? "default" : "secondary"}>
                          {canUploadMedia ? "Enabled" : "Restricted"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t space-y-2">
                      <p className="text-sm text-muted-foreground">Admin Capabilities:</p>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="w-2 h-2 p-0 bg-green-500"></Badge>
                          Upload photos and videos
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="w-2 h-2 p-0 bg-green-500"></Badge>
                          Modify journey data
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="w-2 h-2 p-0 bg-green-500"></Badge>
                          Access analytics
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
