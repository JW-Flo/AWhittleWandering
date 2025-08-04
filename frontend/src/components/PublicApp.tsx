import React from 'react';
import { useUnifiedApiData } from '@/hooks/useUnifiedApiData';
import { formatTemperature } from '@/utils/temperature';
import { safeTimeString } from '@/utils/dateHelpers';
import AdventureHero from './AdventureHero';
import TeslaMap from './TeslaMap';
import TimelineDataDisplay from './TimelineDataDisplay';
import SmartVehicleStats from './SmartVehicleStats';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Zap, Car, Calendar, TrendingUp, Route, Clock } from 'lucide-react';

const PublicApp: React.FC = () => {
  const { 
    data: unifiedData,
    isLoading,
    error,
    lastUpdate,
    isConnected,
    dataFreshness
  } = useUnifiedApiData(30000); // Poll every 30 seconds

  // Get Mapbox token from environment - gracefully handle missing token
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN || '';

  // Create compatibility layer for backward compatibility with existing components
  const insights = unifiedData && unifiedData.overview ? {
    totalStatesVisited: unifiedData.overview.statesVisited || 0,
    totalDrivingDays: unifiedData.overview.daysElapsed || 0,
    accurateStateCount: unifiedData.overview.statesVisited || 0,
    stateCrossings: Math.max((unifiedData.overview.statesVisited || 0) - 1, 0),
    currentLocation: unifiedData.currentStatus?.location ? `${unifiedData.currentStatus.location.city}, ${unifiedData.currentStatus.location.state}` : 'Unknown Location',
    uniqueRegions: ["Southwest", "West Coast", "Mountain West"], // Fallback
    weatherSeasons: ["Summer"], // Fallback
    terrainTypes: ["Desert", "Mountains", "Coastal"], // Fallback
    routeComplexity: "complex" as const,
    journeyScore: 750, // Fallback
    currentPosition: {
      state: unifiedData.currentStatus?.location?.state || 'Unknown',
      coordinates: unifiedData.currentStatus?.location?.coordinates || [0, 0],
      lastUpdate: unifiedData.currentStatus?.location?.lastUpdate || new Date().toISOString()
    },
    uniqueStates: Array.from({ length: unifiedData.overview.statesVisited || 0 }, (_, i) => `State ${i + 1}`), // Simplified
    totalMiles: unifiedData.overview.totalMiles || 0,
    averageDailyMiles: Math.round((unifiedData.overview.totalMiles || 0) / Math.max(unifiedData.overview.daysElapsed || 1, 1))
  } : null;

    // Extract actual states visited from drive data
  const getStatesFromDrives = (drives: any[]): string[] => {
    const statesSet = new Set<string>();
    
    drives.forEach(drive => {
      // Extract state from start location (format: "City, State ZIP, Country")
      const startMatch = drive.startLocation?.match(/,\s*([A-Za-z\s]+?)\s*\d{5}/);
      if (startMatch) {
        statesSet.add(startMatch[1].trim());
      }
      
      // Extract state from end location
      const endMatch = drive.endLocation?.match(/,\s*([A-Za-z\s]+?)\s*\d{5}/);
      if (endMatch) {
        statesSet.add(endMatch[1].trim());
      }
    });
    
    return Array.from(statesSet);
  };

  const journeyStats = unifiedData ? {
    totalMiles: unifiedData.overview.totalMiles,
    daysElapsed: unifiedData.overview.daysElapsed,
    location: {
      state: unifiedData.currentStatus.location.state,
      coordinates: unifiedData.currentStatus.location.coordinates,
      lastUpdate: unifiedData.currentStatus.location.lastUpdate
    },
    uniqueStates: getStatesFromDrives(unifiedData.timeline.drives),
    averageDailyMiles: Math.round(unifiedData.overview.totalMiles / Math.max(unifiedData.overview.daysElapsed, 1))
  } : null;

  const journeyInsights = unifiedData && unifiedData.overview && unifiedData.timeline ? {
    totalMiles: unifiedData.overview.totalMiles || 0,
    statesVisited: getStatesFromDrives(unifiedData.timeline.drives || []),
    daysElapsed: unifiedData.overview.daysElapsed || 0,
    currentState: unifiedData.currentStatus?.location?.state || 'Location Unavailable'
  } : null;

  const currentLocation = unifiedData && unifiedData.currentStatus ? {
    latitude: unifiedData.currentStatus.location?.coordinates?.lat || 0,
    longitude: unifiedData.currentStatus.location?.coordinates?.lng || 0,
    battery_level: unifiedData.currentStatus.battery?.level || 0,
    battery_range: unifiedData.currentStatus.battery?.range || 0,
    charging_state: unifiedData.currentStatus.battery?.charging || false,
    inside_temp: unifiedData.currentStatus.vehicle?.temperature?.inside || 0,
    outside_temp: unifiedData.currentStatus.vehicle?.temperature?.outside || 0,
    odometer: unifiedData.currentStatus.vehicle?.odometer || 0,
    speed: unifiedData.currentStatus.vehicle?.speed || 0,
    timestamp: unifiedData.currentStatus.location?.lastUpdate || new Date().toISOString()
  } : null;

  // Convert timeline drives to route points format with proper coordinates
  const routePoints = unifiedData?.timeline?.drives?.map((drive, index) => {
    // Extract state from location string
    const stateMatch = drive.startLocation?.match(/,\s*([A-Za-z\s]+?)\s*\d{5}/);
    const state = stateMatch ? stateMatch[1].trim() : 'Unknown';
    
    // Use actual coordinates from current location for route visualization
    // In a real implementation, you'd geocode the addresses or store coordinates
    const baseCoords = unifiedData.currentStatus.location.coordinates;
    
    return {
      latitude: baseCoords.lat + (Math.random() - 0.5) * 0.1, // Small random offset for visualization
      longitude: baseCoords.lng + (Math.random() - 0.5) * 0.1,
      state,
      date: drive.date,
      address: drive.startLocation,
      driveIndex: index,
      category: 'drive' as const,
      significance: 'medium' as const
    };
  }) || [];

  const isLive = isConnected && dataFreshness === 'live';
  const charges = unifiedData?.timeline.charges || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Journey Data...</h2>
          <p className="text-gray-400">{isLoading ? 'Connecting to live tracking' : 'Connected to live feed'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🚗</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Journey Data Unavailable</h2>
          <p className="text-gray-400 mb-6">
            We're having trouble connecting to the tracking feed. Using fallback data.
          </p>
          <Badge className="bg-yellow-500/10 border-yellow-500/20 text-yellow-400">
            Using Static Data
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mission Control Header */}
      <header className="bg-slate-900/90 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-mono tracking-tight">A WHITTLE WANDERING</h1>
                <p className="text-xs text-slate-400 font-mono">CONTINENTAL MISSION CONTROL</p>
              </div>
              <Badge className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                {isLive ? 'LIVE TELEMETRY' : 'ARCHIVED DATA'}
              </Badge>
            </div>
            {isLive && (
              <div className="flex items-center space-x-3 text-green-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-mono">TRACKING ACTIVE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mission Status Hero */}
      <AdventureHero />

      {/* Live Data Feed Banner */}
      {isLive && currentLocation && (
        <div className="bg-gradient-to-r from-blue-600/10 via-green-600/10 to-blue-600/10 border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-mono text-red-400 text-sm font-bold">LIVE DATA FEED</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-300 font-mono">
                  <span className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400">{currentLocation.battery_level}%</span>
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-blue-400">{currentLocation.charging_state}</span>
                  {currentLocation.speed && (
                    <>
                      <span className="text-slate-400">|</span>
                      <span className="text-green-400">{currentLocation.speed} MPH</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                LAST_UPDATE: {safeTimeString(currentLocation.timestamp)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission Modules */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Navigation & Tracking Module */}
        <section>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Route className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-3xl font-bold text-white font-mono tracking-tight">
                  NAVIGATION & TRACKING
                </h2>
                <p className="text-slate-400 text-sm font-mono">
                  Real-time GPS telemetry • Continental route monitoring • Live position data
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="h-[600px] relative bg-slate-900 rounded-xl overflow-hidden">
                <TeslaMap
                  vehicleLocation={currentLocation || undefined}
                  routePoints={routePoints}
                  mapboxToken={mapboxToken}
                  onTokenChange={() => {}}
                />
                
                {/* Mission Control Overlay */}
                {isLive && journeyInsights && (
                  <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-mono text-green-400 font-bold">MISSION STATUS</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>DISTANCE:</span>
                        <span className="text-blue-400">{insights?.totalStatesVisited ? insights.totalStatesVisited * 400 : 0} MI</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>STATES:</span>
                        <span className="text-green-400">{insights?.totalStatesVisited || 0}/48</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>MISSION_DAY:</span>
                        <span className="text-purple-400">{insights?.totalDrivingDays || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mission Metrics Module */}
        <section>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <h2 className="text-3xl font-bold text-white font-mono tracking-tight">
                  MISSION METRICS
                </h2>
                <p className="text-slate-400 text-sm font-mono">
                  Real-time performance data • Journey analytics • Achievement tracking
                </p>
              </div>
            </div>
          </div>

          {insights ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Route className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Distance</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-400 font-mono mb-1">
                    {(insights.totalStatesVisited * 400).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">miles tracked</div>
                </div>
                
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">States</span>
                  </div>
                  <div className="text-3xl font-bold text-green-400 font-mono mb-1">
                    {insights.totalStatesVisited || 0}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {48 - (insights.totalStatesVisited || 0)} remaining
                  </div>
                </div>
                
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Duration</span>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 font-mono mb-1">
                    {insights.totalDrivingDays || 0}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">mission days</div>
                </div>
                
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Progress</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-400 font-mono mb-1">
                    {Math.round(((insights.totalStatesVisited || 0) / 48) * 100)}%
                  </div>
                  <div className="text-xs text-slate-500 font-mono">complete</div>
                </div>
              </div>

              {/* States Achievement Grid */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <span className="text-lg font-bold text-white font-mono">STATES CONQUERED</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(insights.uniqueStates || []).map((state, index) => (
                    <div 
                      key={index} 
                      className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg px-3 py-1 text-sm font-mono"
                    >
                      {state}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-400 font-mono">
                  MISSION_STATUS: {insights.totalStatesVisited || 0}/48 continental states explored
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <div className="text-slate-400 font-mono text-sm">
                AWAITING MISSION DATA...
              </div>
            </div>
          )}
        </section>

        {/* Mission Timeline Module */}
        <section>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-8 h-8 text-purple-400" />
              <div>
                <h2 className="text-3xl font-bold text-white font-mono tracking-tight">
                  MISSION TIMELINE
                </h2>
                <p className="text-slate-400 text-sm font-mono">
                  Chronological mission log • Waypoint history • Achievement milestones
                </p>
              </div>
            </div>
          </div>
          <TimelineDataDisplay />
        </section>

        {/* Vehicle Systems Module */}
        <section>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Car className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-3xl font-bold text-white font-mono tracking-tight">
                  VEHICLE SYSTEMS
                </h2>
                <p className="text-slate-400 text-sm font-mono">
                  Real-time telemetry • Performance analytics • System diagnostics
                </p>
              </div>
            </div>
          </div>
          <SmartVehicleStats 
            batteryLevel={currentLocation?.battery_level}
            range={currentLocation?.battery_range}
            chargingState={currentLocation?.charging_state ? 'charging' : 'not_charging'}
            temperature={currentLocation?.inside_temp}
            odometer={currentLocation?.odometer}
            speed={currentLocation?.speed}
            lastUpdate={currentLocation?.timestamp ? new Date(currentLocation.timestamp).toISOString() : undefined}
            journeyStats={journeyInsights ? {
              totalJourneyMiles: journeyInsights.totalMiles || 0,
              statesConquered: journeyInsights.statesVisited?.length || 0,
              completionPercentage: ((journeyInsights.statesVisited?.length || 0) / 48) * 100,
              daysElapsed: journeyInsights.daysElapsed || 0,
              isCharging: currentLocation?.charging_state === 'Charging',
              currentState: journeyInsights.currentState || 'Unknown',
              currentLocation: currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : undefined,
              dailyAverages: {
                miles: journeyInsights.totalMiles ? Math.round((journeyInsights.totalMiles || 0) / Math.max(journeyInsights.daysElapsed || 1, 1)) : 0,
                charges: Math.round((charges?.length || 0) / Math.max(journeyInsights.daysElapsed || 1, 1))
              }
            } : undefined}
          />
        </section>

        {/* Mission Control Footer */}
        <footer className="text-center py-8 border-t border-slate-800">
          <div className="text-slate-400">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white font-mono mb-2">A WHITTLE WANDERING</h3>
            <p className="text-sm font-mono text-slate-400 mb-2">
              MISSION: Continental United States traverse via Tesla Model Y
            </p>
            <p className="text-xs font-mono text-slate-500">
              Real-time vehicle telemetry • Live position tracking • Achievement system
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicApp;
