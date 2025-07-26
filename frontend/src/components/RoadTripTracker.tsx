import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Clock, Trophy, Camera, PenTool, Target, Route, Zap, Upload, Map as MapIcon, CheckCircle } from 'lucide-react';
import { journeyTimeline, journeyStats } from '@/data/journeyData';
import AdventureHero from './AdventureHero';
import JourneyTimeline from './JourneyTimeline';
import AdventureMilestones from './AdventureMilestones';
import AdventureCsvUploader from './AdventureCsvUploader';
import TeslaMap from './TeslaMap';
import TimelineDataDisplay from './TimelineDataDisplay';
import { calculateTripStatistics } from '@/utils/stateDetection';

const RoadTripTracker = () => {
  const [importedData, setImportedData] = useState<any[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>(() => 
    localStorage.getItem('mapboxToken') || 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA'
  );
  const [tripStatistics, setTripStatistics] = useState(journeyStats);
  const [routeLocations, setRouteLocations] = useState<Array<{lat: number, lng: number, timestamp: string}>>([]);
  
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
        <TabsList className="grid w-full grid-cols-5 bg-[hsl(var(--tesla-gray))]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <MapIcon className="w-4 h-4 mr-2" />
            Adventure Overview
          </TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Route className="w-4 h-4 mr-2" />
            Route Map
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Journey Timeline
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-[hsl(var(--adventure-orange))] data-[state=active]:text-white">
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Live Adventure Hero */}
          <AdventureHero />
          
          {/* Enhanced Timeline Display */}
          <TimelineDataDisplay />

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

        <TabsContent value="map" className="space-y-6">
          <Card className="story-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                <Route className="w-5 h-5" />
                Adventure Route Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <TeslaMap
                  mapboxToken={mapboxToken}
                  onTokenChange={handleTokenChange}
                  vehicleLocation={{
                    latitude: 41.1865,
                    longitude: -73.1532,
                    heading: 180,
                    speed: 0
                  }}
                />
              </div>
              {routeLocations.length > 0 && (
                <div className="mt-4 p-3 bg-[hsl(var(--adventure-green)/0.1)] rounded-lg">
                  <p className="text-sm text-[hsl(var(--adventure-green))]">
                    🗺️ Route data loaded: {routeLocations.length.toLocaleString()} location points
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <JourneyTimeline />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <AdventureMilestones />
        </TabsContent>

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
      </Tabs>
    </div>
  );
};

export default RoadTripTracker;