import React from 'react';
import { useRobustData } from '@/hooks/useRobustData';
import { formatTemperature } from '@/utils/temperature';
import { safeTimeString } from '@/utils/dateHelpers';
import AdventureHero from './AdventureHero';
import TeslaMap from './TeslaMap';
import JourneyTimeline from './JourneyTimeline';
import SmartVehicleStats from './SmartVehicleStats';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Zap, Car, Calendar, TrendingUp, Route, Clock } from 'lucide-react';

const PublicApp: React.FC = () => {
  const { 
    drives, 
    charges, 
    currentLocation, 
    journeyInsights, 
    loading, 
    error, 
    isLive, 
    refresh 
  } = useRobustData();

  // Get Mapbox token from environment - gracefully handle missing token
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Adventure Data...</h2>
          <p className="text-gray-400">Connecting to real-time journey feed</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">CAR</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Journey Data Unavailable</h2>
          <p className="text-gray-400 mb-6">
            We're having trouble connecting to the adventure data stream. Please try again.
          </p>
          <Button onClick={refresh} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Car className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation Header - Clean Public Interface */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Car className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">A Whittle Wandering</h1>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Live Adventure
              </Badge>
            </div>
            {isLive && (
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Tracking Active</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <AdventureHero />

      {/* Live Status Banner */}
      {isLive && currentLocation && (
        <div className="bg-gradient-to-r from-green-600/80 to-blue-600/80 backdrop-blur-sm text-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="font-bold">🔴 LIVE TRACKING</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <Zap className="w-4 h-4" />
                    <span>{currentLocation.battery_level}%</span>
                  </span>
                  <span>{currentLocation.charging_state}</span>
                  {currentLocation.speed && (
                    <span>{currentLocation.speed} mph</span>
                  )}
                </div>
              </div>
              <div className="text-sm opacity-90">
                Last update: {safeTimeString(currentLocation.timestamp)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Live Adventure Map */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
              <Route className="w-10 h-10 text-blue-400" />
              <span>Live Adventure Map</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Follow our real-time journey across the continental United States. 
              Watch as we conquer all 48 states in this epic Tesla road trip adventure.
            </p>
          </div>
          
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              <div className="h-[600px] relative">
                <TeslaMap
                  vehicleData={currentLocation || undefined}
                  drives={drives || []}
                  routePoints={[]} // Will be generated from drives
                  mapboxToken={mapboxToken}
                  onTokenUpdate={() => {}}
                />
                
                {/* Map Overlay Info */}
                {isLive && journeyInsights && (
                  <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-sm rounded-lg p-4 text-white border border-white/20">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Live Journey Stats</span>
                    </div>
                    <div className="text-xs space-y-1 text-gray-300">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-3 h-3" />
                        <span>{journeyInsights.totalMiles?.toLocaleString() || 0} total miles</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span>{journeyInsights.statesVisited?.length || 0} states conquered</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>Day {journeyInsights.daysElapsed || 0} of adventure</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Journey Statistics */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
              <TrendingUp className="w-10 h-10 text-green-400" />
              <span>Live Journey Statistics</span>
            </h2>
            <p className="text-xl text-gray-300">
              Real-time adventure metrics and progress tracking
            </p>
          </div>

          {journeyInsights ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30 backdrop-blur-sm">
                  <CardContent className="text-center p-6">
                    <div className="text-4xl font-bold mb-2 text-blue-400">
                      {journeyInsights.totalMiles?.toLocaleString() || 0}
                    </div>
                    <div className="text-blue-200 font-medium">Total Miles</div>
                    <div className="text-xs text-blue-300/70 mt-1">Epic distance covered</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30 backdrop-blur-sm">
                  <CardContent className="text-center p-6">
                    <div className="text-4xl font-bold mb-2 text-green-400">
                      {journeyInsights.statesVisited?.length || 0}
                    </div>
                    <div className="text-green-200 font-medium">States Conquered</div>
                    <div className="text-xs text-green-300/70 mt-1">
                      {48 - (journeyInsights.statesVisited?.length || 0)} remaining
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30 backdrop-blur-sm">
                  <CardContent className="text-center p-6">
                    <div className="text-4xl font-bold mb-2 text-purple-400">
                      {journeyInsights.daysElapsed || 0}
                    </div>
                    <div className="text-purple-200 font-medium">Days Adventuring</div>
                    <div className="text-xs text-purple-300/70 mt-1">Living the dream</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border-orange-500/30 backdrop-blur-sm">
                  <CardContent className="text-center p-6">
                    <div className="text-4xl font-bold mb-2 text-orange-400">
                      {Math.round(((journeyInsights.statesVisited?.length || 0) / 48) * 100)}%
                    </div>
                    <div className="text-orange-200 font-medium">Complete</div>
                    <div className="text-xs text-orange-300/70 mt-1">USA conquest</div>
                  </CardContent>
                </Card>
              </div>

              {/* States Progress */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-8">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span>States Conquered</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(journeyInsights.statesVisited || []).map((state, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="bg-green-600/20 text-green-300 border-green-500/30"
                      >
                        {state}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-gray-400">
                    Progress: {journeyInsights.statesVisited?.length || 0} of 48 continental states
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="text-center p-8">
                <div className="text-gray-400 mb-4">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Journey statistics will appear here once data is available
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Adventure Timeline */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
              <Clock className="w-10 h-10 text-purple-400" />
              <span>Adventure Timeline</span>
            </h2>
            <p className="text-xl text-gray-300">
              Every milestone, every state, every unforgettable moment
            </p>
          </div>
          <JourneyTimeline />
        </section>

        {/* Vehicle Stats */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
              <Car className="w-10 h-10 text-blue-400" />
              <span>Tesla Performance Insights</span>
            </h2>
            <p className="text-xl text-gray-300">
              Real-time vehicle metrics and charging analytics
            </p>
          </div>
          <SmartVehicleStats 
            batteryLevel={currentLocation?.battery_level}
            range={currentLocation?.battery_range}
            chargingState={currentLocation?.charging_state}
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

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/10">
          <div className="text-gray-400 mb-4">
            <Car className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <p className="text-lg font-medium text-white mb-2">A Whittle Wandering</p>
            <p className="text-sm">
              Following our epic 48-state Tesla adventure across America
            </p>
            <p className="text-xs mt-2 opacity-75">
              Powered by real-time vehicle telemetry and adventure spirit
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicApp;
