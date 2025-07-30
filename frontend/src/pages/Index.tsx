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
import { isAdminDomain } from '@/utils/adminAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Car, Zap, Map, Route, Camera, Shield, Bug } from 'lucide-react';

const Index = () => {
  // Check if user is on admin domain for admin functions
  const isAdmin = isAdminDomain();
  
  const [tessieApiKey, setTessieApiKey] = useState<string | null>(
    import.meta.env.VITE_TESSIE_API_KEY || null
  );
  const [mapboxToken, setMapboxToken] = useState<string | null>(
    import.meta.env.VITE_MAPBOX_TOKEN || null
  );

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
  }, [tessieApiKey, mapboxToken]);

  // Use unified Tessie API hook - PRODUCTION ONLY
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
  } = useUnifiedTessieApi(tessieApiKey || undefined);
  
  // Enhanced debug logging
  React.useEffect(() => {
    console.log('🔍 === UNIFIED TESSIE API HOOK DEBUG ===');
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
      console.log('🔋 Sample charge data:', historicalCharges[0]);
    }
  }, [vehicles, historicalDrives, historicalCharges, tessieApiKey, selectedVehicle, isLoading, error]);

  // Calculate journey statistics with proper error handling
  const journeyStats = React.useMemo(() => {
    console.log('📊 === JOURNEY STATS CALCULATION ===');
    console.log('🛣️ historicalDrives.length:', historicalDrives.length);
    console.log('⚡ historicalCharges.length:', historicalCharges.length);
    console.log('🔑 tessieApiKey exists:', !!tessieApiKey);
    
    try {
      // Use real data calculation for production
      return calculateJourneyStats(
        historicalDrives, 
        historicalCharges, 
        vehicleData?.drive_state?.shift_state
      );
    } catch (error) {
      console.error('❌ Error calculating journey stats:', error);
      return {
        totalJourneyMiles: 0,
        statesConquered: 0,
        completionPercentage: 0,
        daysElapsed: 0,
        currentState: '',
        averageDailyMiles: 0,
        totalCharges: 0,
        averageChargesPerDay: 0,
        totalEnergyUsed: 0,
        averageEfficiency: 0
      };
    }
  }, [historicalDrives, historicalCharges, vehicleData, tessieApiKey]);

  // Calculate insights from journey data
  const journeyInsights = React.useMemo(() => {
    try {
      if (historicalDrives.length === 0) {
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
  }, [historicalDrives, historicalCharges]);

  // Filter vehicles to only show "Midnight Shadow"
  const midnightShadowVehicle = vehicles.find(v => 
    v.display_name?.toLowerCase().includes('midnight') || 
    v.display_name?.toLowerCase().includes('shadow')
  );
  
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
  };

  const handleDemoMode = () => {
    // Demo mode disabled in production
    console.log('Demo mode is disabled in production');
  };

  const handleMapboxTokenChange = (token: string) => {
    localStorage.setItem('mapbox_token', token);
    setMapboxToken(token);
  };

  const { 
    isTracking, 
    currentLocation, 
    startTracking, 
    stopTracking,
    trackingHistory 
  } = useSmartTracking(displayVehicleData);

  // Show API setup if no TESSIE key (production mode only)
  if (!tessieApiKey) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-tesla-cyan to-purple-500 flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">A Whittle Wandering</h1>
                <p className="text-sm text-muted-foreground">
                  Powered by TESSIE
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Vehicle Selection */}
              {displayVehicles.length > 1 && (
                <Select value={selectedVehicle || ''} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="w-[200px] bg-white/10 border-white/20">
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.display_name || `${vehicle.year} ${vehicle.model}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {/* Debug info for development */}
              <DebugInfo 
                tessieApiKey={tessieApiKey}
                mapboxToken={mapboxToken}
                isDemoMode={false}
                vehicles={vehicles}
                vehicleData={vehicleData}
                historicalDrives={historicalDrives}
                historicalCharges={historicalCharges}
                error={error}
                isLoading={isLoading}
              />
              
              {/* Admin Functions - Only visible on admin domain */}
              {isAdmin && (
                <>
                  <SystemStatusPanel 
                    tessieStatus={!error && vehicles.length > 0}
                    mapboxStatus={!!mapboxToken}
                    dataStatus={historicalDrives.length > 0}
                  />
                  
                  <TessieApiDebugger apiKey={tessieApiKey} />
                  
                  <ApiTest />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tesla Map */}
          <Card className="bg-black/20 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-tesla-cyan" />
                <CardTitle className="text-lg">
                  Live Location
                </CardTitle>
                {displayVehicleData && (
                  <Badge variant="secondary" className="bg-tesla-cyan/20 text-tesla-cyan">
                    Live
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <TeslaMap
                vehicleData={displayVehicleData}
                mapboxToken={mapboxToken}
                onTokenUpdate={handleMapboxTokenChange}
                className="w-full h-full rounded-lg"
                drives={historicalDrives}
                charges={historicalCharges}
                isDemoMode={false} // PRODUCTION ONLY
              />
            </CardContent>
          </Card>

          {/* Smart Vehicle Stats */}
          <Card className="bg-black/20 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <CardTitle className="text-lg">Vehicle Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <SmartVehicleStats 
                vehicleData={displayVehicleData}
                journeyStats={journeyStats}
                insights={journeyInsights}
              />
            </CardContent>
          </Card>
        </div>

        {/* Journey Dashboard */}
        <div className="mt-6">
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-blue-400" />
                <CardTitle>Continental USA Journey</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tracker" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tracker">Journey Progress</TabsTrigger>
                  <TabsTrigger value="data">Trip Data</TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="media">Media Upload</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="tracker" className="space-y-4">
                  <RoadTripTracker 
                    journeyStats={journeyStats}
                    drives={historicalDrives}
                    charges={historicalCharges}
                    dailyAverages={{ 
                      miles: journeyStats.averageDailyMiles, 
                      charges: journeyStats.averageChargesPerDay 
                    }}
                    currentLocation={displayVehicleData ? {
                      lat: displayVehicleData.drive_state?.latitude || 0,
                      lng: displayVehicleData.drive_state?.longitude || 0,
                      address: displayVehicleData.drive_state?.active_route_destination || 'Unknown'
                    } : null}
                  />
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                  <DataDebugger 
                    drives={historicalDrives}
                    charges={historicalCharges}
                    vehicleData={displayVehicleData}
                  />
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="media" className="space-y-4">
                    {isAuthenticated ? (
                      <MediaUpload 
                        canUpload={canUploadMedia}
                        onUploadComplete={() => {
                          console.log('Media upload completed');
                        }}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">Admin Access Required</p>
                        <p className="text-muted-foreground mb-4">
                          Trip media upload is only available on the admin portal.
                        </p>
                        <AdminLogin />
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6">
            <Card className="bg-red-900/20 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400">Connection Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-300">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={refetch} 
                  className="mt-4 border-red-500/50 hover:bg-red-500/10"
                >
                  Retry Connection
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
