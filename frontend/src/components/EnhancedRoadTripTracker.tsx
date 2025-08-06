import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Route, Clock, Battery } from 'lucide-react';
import StateProgressMap from './StateProgressMap';
import { roadTripApi, type TripData } from '@/services/roadTripApi';

const EnhancedRoadTripTracker: React.FC = () => {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'map' | 'timeline' | 'stats'>('map');
  const [visitedStates, setVisitedStates] = useState<string[]>([]);

  // Fetch trip data from API
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setLoading(true);
        const data = await roadTripApi.getTripData();
        setTripData(data);
        
        // Get visited states
        const states = await roadTripApi.getVisitedStates();
        setVisitedStates(states);
      } catch (error) {
        console.error('Failed to fetch trip data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTripData, 30000);
    return () => clearInterval(interval);
  }, []);

  const extractStateFromAddress = (address: string): string | null => {
    const stateRegex = /, ([A-Z][a-z]+(?:\s[A-Z][a-z]+)*) \d/;
    const match = address.match(stateRegex);
    return match ? match[1] : null;
  };

  const formatDuration = (start: string, end: string): string => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip data...</p>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Failed to load trip data. Please try again.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
            {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Route className="w-6 h-6 mx-auto text-blue-500 mb-2" />
            <p className="text-sm text-gray-600">Total Miles</p>
            <p className="text-2xl font-bold">{tripData.overview.totalMiles.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-gray-600">States Visited</p>
            <p className="text-2xl font-bold">{tripData.overview.statesVisited}/{tripData.overview.totalStates}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto text-purple-500 mb-2" />
            <p className="text-sm text-gray-600">Days Traveled</p>
            <p className="text-2xl font-bold">{tripData.overview.currentDay}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Battery className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-sm text-gray-600">Battery Level</p>
            <p className="text-2xl font-bold">{tripData.overview.currentBatteryLevel}%</p>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{tripData.overview.tripName}</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={activeView === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('map')}
              >
                Map View
              </Button>
              <Button
                variant={activeView === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('timeline')}
              >
                Timeline
              </Button>
              <Button
                variant={activeView === 'stats' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('stats')}
              >
                Statistics
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeView === 'map' && (
            <StateProgressMap
              drives={tripData.timeline.drives}
              visitedStates={visitedStates}
              currentLocation={tripData.vehicle.location.coordinates}
              className="w-full"
            />
          )}

          {activeView === 'timeline' && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tripData.timeline.drives.slice(0, 20).map((drive) => (
                <div key={drive.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{formatDate(drive.date)}</Badge>
                        <Badge variant="secondary">{drive.distance} miles</Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(drive.startTime, drive.endTime)}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-green-600">From: {drive.startLocation}</p>
                        <p className="font-medium text-blue-600">To: {drive.endLocation}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{new Date(drive.startTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeView === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Trip Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Vehicle:</span>
                    <span className="font-medium">{tripData.overview.vehicle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span className="font-medium">{formatDate(tripData.overview.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Odometer:</span>
                    <span className="font-medium">{tripData.vehicle.odometer.toLocaleString()} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className="font-medium">
                      {((tripData.overview.statesVisited / tripData.overview.totalStates) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Current Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Current State:</span>
                    <span className="font-medium">{tripData.vehicle.location.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Battery Range:</span>
                    <span className="font-medium">{tripData.vehicle.range} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Charging Status:</span>
                    <Badge variant={tripData.vehicle.charging === 'charging' ? 'default' : 'secondary'}>
                      {tripData.vehicle.charging}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span className="font-medium">
                      {tripData.vehicle.temperature.outside}°F outside
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRoadTripTracker;
