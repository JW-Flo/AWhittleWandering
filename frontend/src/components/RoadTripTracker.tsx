import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Clock, Trophy, Camera, PenTool, Target, Route, Zap, Upload, Map as MapIcon, CheckCircle, Shield, Settings, Image } from 'lucide-react';
import { journeyTimeline, journeyStats } from '@/data/journeyData';
import { useAdminAuth } from '@/lib/auth';
import useUnifiedJourneyData from '@/hooks/useUnifiedJourneyData';
import { TrackingEvent } from '@/hooks/useSmartTracking';
import AdventureHero from './AdventureHero';
import SmartTimeline from './SmartTimeline';
import AdventureMilestones from './AdventureMilestones';
import AdventureCsvUploader from './AdventureCsvUploader';
import TeslaMap from './TeslaMap';
import EnhancedTeslaMap from './EnhancedTeslaMap';
import AdvancedTeslaMap from './AdvancedTeslaMap';
import InteractiveRoutePlanner from './InteractiveRoutePlanner';
import TimelineDataDisplay from './TimelineDataDisplay';
import JourneyDashboard from './JourneyDashboard';
import ApiConfig from './ApiConfig';
import MediaManager from './MediaManager';
import RealTimeLocationTracker from './RealTimeLocationTracker';
import { calculateTripStatistics } from '@/utils/stateDetection';

interface RoadTripTrackerProps {
  tessieApiKey?: string;
  trackingEvents?: TrackingEvent[];
  onAddManualEvent?: (event: Omit<TrackingEvent, 'id'>) => void;
}

const RoadTripTracker = ({ 
  tessieApiKey: providedApiKey = '', 
  trackingEvents = [],
  onAddManualEvent 
}: RoadTripTrackerProps) => {
  const [importedData, setImportedData] = useState<any[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>(() => 
    localStorage.getItem('mapboxToken') || 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA'
  );
  const [tripStatistics, setTripStatistics] = useState(journeyStats);
  const [routeLocations, setRouteLocations] = useState<Array<{lat: number, lng: number, timestamp: string}>>([]);
  const [tessieApiKey, setTessieApiKey] = useState<string>(providedApiKey || '');
  const [tessieVehicleId, setTessieVehicleId] = useState<string>('midnightshadow');
  const [showAdvancedMap, setShowAdvancedMap] = useState<boolean>(false);
  
  // Sync provided API key with local state
  React.useEffect(() => {
    if (providedApiKey) {
      setTessieApiKey(providedApiKey);
    }
  }, [providedApiKey]);
  
  // Admin authentication and unified data
  const { isAuthenticated, canModifyJourney, canUploadMedia } = useAdminAuth();
  const { overview, currentStatus, loading: dataLoading, error: dataError } = useUnifiedJourneyData();
  
  const visitedStates = journeyTimeline.filter(state => state.current);
  const currentState = journeyTimeline.find(state => state.current);
  const progressPercentage = (tripStatistics.visitedStates / 48) * 100; // 48 total states, not 31

  const handleDataImport = (data: any[]) => {
    setImportedData(data);
    
    // Calculate real trip statistics from imported data
    const stats = calculateTripStatistics(data);
    setTripStatistics({
      totalStates: 48, // Goal is all 48 continental states
      visitedStates: stats.statesDetected?.length || 17,
      remainingStates: 48 - (stats.statesDetected?.length || 17),
      tripDuration: 54,
      daysElapsed: stats.daysElapsed || 53,
      daysRemaining: Math.max(54 - (stats.daysElapsed || 53), 0),
      startDate: '2025-06-03',
      endDate: '2025-07-26',
      currentState: 'Connecticut',
      totalMiles: stats.totalMiles || 11950,
      averageMilesPerDay: stats.averageMilesPerDay || 225
    });
  };

  const handleMapDataAvailable = (locations: Array<{lat: number, lng: number, timestamp: string}>) => {
    setRouteLocations(locations);
  };

  const handleTokenChange = (token: string) => {
    setMapboxToken(token);
    localStorage.setItem('mapboxToken', token);
  };

  return (
    <div className="space-y-8">
      {/* Adventure Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`grid w-full ${isAuthenticated ? 'grid-cols-10' : 'grid-cols-7'} bg-[hsl(var(--tesla-gray))]`}>
          <TabsTrigger value="overview" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <MapIcon className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="journey" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Zap className="w-4 h-4 mr-2" />
            Live Journey
          </TabsTrigger>
          <TabsTrigger value="tracking" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <MapPin className="w-4 h-4 mr-2" />
            Live Tracking
          </TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Route className="w-4 h-4 mr-2" />
            Route Map
          </TabsTrigger>
          <TabsTrigger value="planner" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Target className="w-4 h-4 mr-2" />
            Route Planner
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          {isAuthenticated && canUploadMedia && (
            <TabsTrigger value="media" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
              <Image className="w-4 h-4 mr-2" />
              Media
              <Badge variant="secondary" className="ml-2 bg-tesla-cyan text-xs">Admin</Badge>
            </TabsTrigger>
          )}
          {isAuthenticated && canModifyJourney && (
            <>
              <TabsTrigger value="import" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
                <Badge variant="secondary" className="ml-2 bg-tesla-cyan text-xs">Admin</Badge>
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
                <Settings className="w-4 h-4 mr-2" />
                API Config
                <Badge variant="secondary" className="ml-2 bg-tesla-cyan text-xs">Admin</Badge>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Live Adventure Hero */}
          <AdventureHero />
          
          {/* Enhanced Timeline Display */}
          <TimelineDataDisplay tessieApiKey={tessieApiKey} />

          {/* Key Adventure Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="story-card group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[hsl(var(--adventure-gold)/0.2)] to-[hsl(var(--adventure-orange)/0.1)] rounded-xl">
                    <Trophy className="w-6 h-6 text-[hsl(var(--adventure-gold))]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Epic Milestones</p>
                    <p className="text-2xl font-bold text-gradient">{tripStatistics.visitedStates} States</p>
                    <p className="text-xs text-muted-foreground">of {tripStatistics.totalStates} planned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="story-card group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[hsl(var(--tesla-cyan)/0.2)] to-[hsl(var(--tesla-blue)/0.1)] rounded-xl">
                    <Clock className="w-6 h-6 text-[hsl(var(--tesla-cyan))]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Adventure Days</p>
                    <p className="text-2xl font-bold text-[hsl(var(--tesla-cyan))]">{tripStatistics.daysElapsed}</p>
                    <p className="text-xs text-muted-foreground">of {tripStatistics.tripDuration} total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="story-card group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[hsl(var(--adventure-orange)/0.2)] to-[hsl(var(--adventure-red)/0.1)] rounded-xl">
                    <Route className="w-6 h-6 text-[hsl(var(--adventure-orange))]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Miles Conquered</p>
                    <p className="text-2xl font-bold text-[hsl(var(--adventure-orange))]">{(tripStatistics.totalMiles / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">and counting...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="story-card group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[hsl(var(--adventure-green)/0.2)] to-[hsl(var(--adventure-teal)/0.1)] rounded-xl">
                    <Zap className="w-6 h-6 text-[hsl(var(--adventure-green))]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Daily Average</p>
                    <p className="text-2xl font-bold text-[hsl(var(--adventure-green))]">{tripStatistics.averageMilesPerDay}</p>
                    <p className="text-xs text-muted-foreground">miles per day</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Epic Journey Progress */}
          <Card className="story-card relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                <MapPin className="w-5 h-5" />
                Epic Journey Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Adventure Completion</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gradient">{progressPercentage.toFixed(1)}%</span>
                    <p className="text-xs text-muted-foreground">of America explored</p>
                  </div>
                </div>
                
                <div className="journey-progress h-4 rounded-full">
                  <div 
                    className="progress-fill h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[hsl(var(--adventure-green))]">{tripStatistics.visitedStates}</div>
                    <div className="text-xs text-muted-foreground">States Conquered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[hsl(var(--adventure-orange))]">{tripStatistics.daysElapsed}</div>
                    <div className="text-xs text-muted-foreground">Days of Adventure</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[hsl(var(--tesla-cyan))]">{tripStatistics.remainingStates}</div>
                    <div className="text-xs text-muted-foreground">States Awaiting</div>
                  </div>
                </div>
              </div>
              
              {currentState && (
                <div className="pt-4 border-t border-[hsl(var(--tesla-gray-light))]">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[hsl(var(--adventure-orange))] text-white px-3 py-1 animate-pulse">
                      📍 Currently Exploring
                    </Badge>
                    <span className="font-semibold text-lg">{currentState.state}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentState.highlights.map((highlight, idx) => (
                      <span key={idx} className="text-sm text-muted-foreground bg-[hsl(var(--tesla-gray))] px-2 py-1 rounded">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--adventure-gold))] opacity-5 rounded-full blur-3xl animate-pulse" />
          </Card>

          {/* States Adventure Log */}
          <Card className="story-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                <Calendar className="w-5 h-5" />
                Adventure Log: States Conquered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--tesla-gray-light))]">
                    <TableHead className="text-muted-foreground font-semibold">State</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Adventure Status</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Date Conquered</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Epic Stops</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Memories</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journeyTimeline.slice(0, 10).map((state) => (
                    <TableRow key={state.state} className="border-[hsl(var(--tesla-gray-light))] hover:bg-[hsl(var(--tesla-gray)/0.3)] transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            state.current ? 'bg-[hsl(var(--adventure-orange))] animate-pulse' : 'bg-[hsl(var(--adventure-green))]'
                          }`} />
                          <span className="font-bold text-primary">{state.state.substring(0, 2).toUpperCase()}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="font-medium">{state.state}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {state.current ? (
                          <Badge className="bg-[hsl(var(--adventure-orange))] text-white state-badge animate-pulse">
                            🏃‍♂️ Exploring Now
                          </Badge>
                        ) : (
                          <Badge className="bg-[hsl(var(--adventure-green)/0.2)] text-[hsl(var(--adventure-green))] state-badge">
                            ✅ Conquered
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div>
                          <div className="font-medium">{new Date(state.date).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.ceil((Date.now() - new Date(state.date).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {state.highlights.map((highlight, idx) => (
                            <div key={idx} className="text-sm bg-[hsl(var(--tesla-gray))] px-2 py-1 rounded text-foreground/80">
                              {highlight}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-[hsl(var(--adventure-orange)/0.1)] hover:text-[hsl(var(--adventure-orange))]">
                            <Camera className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-[hsl(var(--adventure-gold)/0.1)] hover:text-[hsl(var(--adventure-gold))]">
                            <PenTool className="w-4 h-4" />
                          </Button>
                          {state.current && (
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-[hsl(var(--adventure-orange))] hover:bg-[hsl(var(--adventure-orange)/0.1)]">
                              <Target className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          {/* Current Drive Map */}
          <Card className="story-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                <MapIcon className="w-5 h-5" />
                Current Drive Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full rounded-lg overflow-hidden">
                <TeslaMap
                  vehicleLocation={{
                    latitude: currentStatus?.location?.coordinates?.lat || 41.1865,
                    longitude: currentStatus?.location?.coordinates?.lng || -73.1532,
                    heading: 67,
                    speed: currentStatus?.vehicle?.speed || 0
                  }}
                  mapboxToken={mapboxToken}
                />
              </div>
              <div className="mt-3 text-sm text-muted-foreground text-center">
                📍 {currentStatus?.location?.city || 'Greenwich'}, {currentStatus?.location?.state || 'Connecticut'}
              </div>
            </CardContent>
          </Card>

          <JourneyDashboard 
            vehicleId={tessieVehicleId} 
            apiKey={tessieApiKey}
            startDate="2025-06-03"
            endDate="2025-07-26"
            trackingEvents={trackingEvents}
          />
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <RealTimeLocationTracker
            location={{
              coordinates: { 
                lat: currentStatus?.location?.coordinates?.lat || 41.1865, 
                lng: currentStatus?.location?.coordinates?.lng || -73.1532 
              },
              address: {
                city: 'Greenwich',
                state: 'Connecticut',
                country: 'United States'
              },
              accuracy: 5.2,
              heading: 67,
              speed: currentStatus?.vehicle?.speed || 0,
              timestamp: new Date().toISOString()
            }}
            vehicle={{
              batteryLevel: currentStatus?.vehicle?.batteryLevel || 82,
              range: currentStatus?.vehicle?.batteryRange || 267,
              chargingState: (currentStatus?.vehicle?.chargingState as 'charging' | 'complete' | 'disconnected') || 'complete',
              temperature: {
                inside: 72,
                outside: currentStatus?.vehicle?.outsideTemp || 78
              },
              odometer: currentStatus?.vehicle?.odometer || 70128,
              speed: currentStatus?.vehicle?.speed || 0,
              heading: 67,
              isMoving: (currentStatus?.vehicle?.speed || 0) > 0,
              lastUpdate: new Date().toISOString(),
              connectionStatus: 'online'
            }}
            journey={{
              currentState: 'Connecticut',
              statesVisited: 29,
              totalStates: 48,
              journeyMiles: 11950,
              targetMiles: 15000,
              daysElapsed: 56,
              completionPercentage: 60.4,
              nextStateEstimate: {
                state: 'Massachusetts',
                distance: 47,
                estimatedArrival: '2024-08-03T10:30:00Z'
              }
            }}
            updateInterval={30000}
            autoRefresh={true}
            showDetailedMetrics={true}
          />
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card className="story-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                <Route className="w-5 h-5" />
                Enhanced Adventure Route Map
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant={showAdvancedMap ? "default" : "outline"}
                    onClick={() => setShowAdvancedMap(!showAdvancedMap)}
                  >
                    {showAdvancedMap ? "Standard View" : "Advanced View"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                {showAdvancedMap ? (
                  <AdvancedTeslaMap
                    mapboxToken={mapboxToken}
                    routePoints={routeLocations}
                    currentLocation={{
                      lat: currentStatus?.location?.coordinates?.lat || 41.1865,
                      lng: currentStatus?.location?.coordinates?.lng || -73.1532,
                      heading: 180,
                      speed: currentStatus?.vehicle?.speed || 0
                    }}
                    showElevationProfile={true}
                    showRouteAnimation={true}
                    showClusters={true}
                    onRouteStatsChange={(stats) => console.log('Route stats:', stats)}
                    onLocationClick={(location) => console.log('Location clicked:', location)}
                  />
                ) : (
                  <EnhancedTeslaMap
                    vehicleId={tessieVehicleId}
                    apiKey={tessieApiKey}
                    mapboxToken={mapboxToken}
                    startDate="2025-06-03"
                    endDate="2025-07-26"
                    onLocationData={handleMapDataAvailable}
                  />
                )}
              </div>
              {routeLocations.length > 0 && (
                <div className="mt-4 p-3 bg-[hsl(var(--adventure-green)/0.1)] rounded-lg">
                  <p className="text-sm text-[hsl(var(--adventure-green))]">
                    🗺️ Real route data loaded: {routeLocations.length.toLocaleString()} location points from Tessie API
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planner" className="space-y-6">
          <InteractiveRoutePlanner
            onRouteChange={(waypoints) => console.log('Route changed:', waypoints)}
            onOptimizedRouteGenerated={(route) => console.log('Optimized route:', route)}
            currentLocation={{
              lat: currentStatus?.location?.coordinates?.lat || 41.1865,
              lng: currentStatus?.location?.coordinates?.lng || -73.1532
            }}
            vehicleRange={currentStatus?.vehicle?.batteryRange || 300}
            vehicleBatteryLevel={currentStatus?.vehicle?.batteryLevel || 80}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <SmartTimeline />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <AdventureMilestones />
        </TabsContent>

        {isAuthenticated && canModifyJourney && (
          <TabsContent value="import" className="space-y-6">
            <AdventureCsvUploader 
              onDataImported={handleDataImport}
              onMapDataAvailable={handleMapDataAvailable}
            />
            
            {importedData.length > 0 && (
              <Card className="story-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gradient">
                    <CheckCircle className="w-5 h-5" />
                    Imported Adventure Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Successfully imported {importedData.length} records. This data will be processed to update your journey statistics and milestones.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {isAuthenticated && canUploadMedia && (
          <TabsContent value="media" className="space-y-6">
            <MediaManager 
              tripStates={journeyTimeline.map(state => state.state)}
              currentLocation={currentState ? {
                state: currentState.state,
                city: 'Current Location',
                coordinates: currentState.location || { lat: 0, lng: 0 }
              } : undefined}
            />
          </TabsContent>
        )}

        {isAuthenticated && canModifyJourney && (
          <TabsContent value="config" className="space-y-6">
            <ApiConfig 
              onApiKeyChange={setTessieApiKey}
              onVehicleIdChange={setTessieVehicleId}
              currentApiKey={tessieApiKey}
              currentVehicleId={tessieVehicleId}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default RoadTripTracker;