import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Route, Clock, Trophy } from 'lucide-react';
import { useTessieApi, HistoricalDrive, HistoricalCharge } from '@/hooks/useTessieApi';
import { calculateJourneyStats } from '@/utils/journeyCalculations';

interface TimelineEntry {
  date: string;
  state: string;
  keyStops: string;
}

interface TimelineData {
  type: string;
  totalEntries: number;
  statesVisited: number;
  states: string[];
  entries: TimelineEntry[];
  summary: {
    startDate: string;
    endDate: string;
    totalStates: number;
  };
}

interface TimelineDataDisplayProps {
  tessieApiKey?: string;
}

const TimelineDataDisplay: React.FC<TimelineDataDisplayProps> = ({ tessieApiKey }) => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use Tessie API data instead of external API
  const { 
    vehicleData, 
    historicalDrives, 
    historicalCharges, 
    isLoading: tessieLoading,
    error: tessieError 
  } = useTessieApi(tessieApiKey);

  useEffect(() => {
    if (tessieLoading) {
      setLoading(true);
      return;
    }

    if (tessieError) {
      setError(tessieError);
      setLoading(false);
      return;
    }

    try {
      // Convert Tessie data to timeline format
      const journeyStats = calculateJourneyStats(
        historicalDrives, 
        historicalCharges,
        vehicleData ? { lat: vehicleData.latitude, lng: vehicleData.longitude } : undefined
      );

      // Create timeline entries from drives
      const timelineEntries: TimelineEntry[] = historicalDrives.slice(-10).map(drive => ({
        date: new Date(drive.start_time).toLocaleDateString(),
        state: getStateFromAddress(drive.start_address),
        keyStops: `${drive.start_address} → ${drive.end_address} (${drive.distance_miles} mi)`
      }));

      // Get unique states from drives
      const states = Array.from(new Set(
        historicalDrives.map(drive => getStateFromAddress(drive.start_address))
          .concat(historicalDrives.map(drive => getStateFromAddress(drive.end_address)))
      )).filter(state => state !== 'Unknown');

      const timeline: TimelineData = {
        type: 'tesla-journey',
        totalEntries: historicalDrives.length,
        statesVisited: journeyStats.statesConquered,
        states,
        entries: timelineEntries,
        summary: {
          startDate: '2025-06-01',
          endDate: new Date().toISOString().split('T')[0],
          totalStates: journeyStats.statesConquered
        }
      };

      setTimelineData(timeline);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process Tesla data');
    } finally {
      setLoading(false);
    }
  }, [historicalDrives, historicalCharges, vehicleData, tessieLoading, tessieError]);

  // Simple state extraction from address
  const getStateFromAddress = (address: string): string => {
    if (!address) return 'Unknown';
    
    const statePatterns = [
      'Connecticut', 'Massachusetts', 'Rhode Island', 'Vermont', 'New Hampshire', 'Maine',
      'New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland', 'Virginia',
      'North Carolina', 'South Carolina', 'Georgia', 'Florida', 'Alabama', 'Mississippi',
      'Tennessee', 'Kentucky', 'West Virginia', 'Ohio', 'Indiana', 'Illinois', 'Michigan',
      'Wisconsin', 'Minnesota', 'Iowa', 'Missouri', 'Arkansas', 'Louisiana', 'Texas',
      'Oklahoma', 'Kansas', 'Nebraska', 'South Dakota', 'North Dakota', 'Montana',
      'Wyoming', 'Colorado', 'New Mexico', 'Arizona', 'Utah', 'Idaho', 'Nevada',
      'California', 'Oregon', 'Washington'
    ];
    
    for (const state of statePatterns) {
      if (address.includes(state)) return state;
    }
    
    return 'Unknown';
  };

  if (loading) {
    return (
      <Card className="story-card animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-tesla-gray rounded w-3/4"></div>
            <div className="h-4 bg-tesla-gray rounded w-1/2"></div>
            <div className="h-4 bg-tesla-gray rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="story-card border-destructive/20">
        <CardContent className="p-6">
          <p className="text-destructive">Error loading timeline data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!timelineData) {
    return (
      <Card className="story-card">
        <CardContent className="p-6">
          <p className="text-muted-foreground">No timeline data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate journey stats from actual Tesla data
  const journeyStats = calculateJourneyStats(
    historicalDrives, 
    historicalCharges,
    vehicleData ? { lat: vehicleData.latitude, lng: vehicleData.longitude } : undefined
  );

  const progressPercentage = (timelineData.statesVisited / 48) * 100;
  const recentEntries = timelineData.entries.slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Live Status Overview */}
      <Card className="hero-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 story-title">
            <Route className="w-6 h-6" />
            A Whittle Wandering - Live Adventure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold adventure-stat">{timelineData.statesVisited}</div>
              <p className="text-muted-foreground">States Explored</p>
              <Badge className="mt-2 bg-adventure-green/20 text-adventure-green">
                of 48 continental states
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold adventure-stat">{journeyStats.totalJourneyMiles.toLocaleString()}</div>
              <p className="text-muted-foreground">Miles Traveled</p>
              <Badge className="mt-2 bg-adventure-orange/20 text-adventure-orange">
                {journeyStats.averageDailyMiles} avg/day
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold adventure-stat">{journeyStats.daysElapsed}</div>
              <p className="text-muted-foreground">Days of Adventure</p>
              <Badge className="mt-2 bg-adventure-blue/20 text-adventure-blue">
                since June 1st
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Journey Progress</span>
              <span className="text-lg font-bold text-gradient">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="journey-progress h-3 rounded-full">
              <div 
                className="progress-fill h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Current Location */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-adventure-gold/10 to-adventure-orange/10 rounded-lg">
            <MapPin className="w-8 h-8 text-adventure-orange animate-pulse" />
            <div>
              <p className="text-lg font-bold">{journeyStats.currentState}</p>
              <p className="text-sm text-muted-foreground">Current location from Tesla</p>
              <Badge className="mt-1 bg-adventure-orange text-white">Currently Exploring</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Timeline Entries */}
      <Card className="story-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient">
            <Calendar className="w-5 h-5" />
            Recent Adventure Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEntries.map((entry, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg tesla-card transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-adventure-orange animate-pulse"></div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-adventure-blue/20 text-adventure-blue px-2 py-1">
                      {entry.date}
                    </Badge>
                    <Badge className="state-badge">
                      {entry.state}
                    </Badge>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">{entry.keyStops}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* States Visited Grid */}
      <Card className="story-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient">
            <Trophy className="w-5 h-5" />
            States Conquered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {timelineData.states.map((state, index) => (
              <Badge 
                key={state}
                className="state-badge text-center py-2 justify-center"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  background: `hsl(${(index * 137.5) % 360}, 70%, 50%, 0.2)`,
                  color: `hsl(${(index * 137.5) % 360}, 70%, 40%)`,
                  borderColor: `hsl(${(index * 137.5) % 360}, 70%, 50%, 0.4)`
                }}
              >
                {state.substring(0, 2).toUpperCase()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tesla Integration Status */}
      <Card className="milestone-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-adventure-teal" />
            <div>
              <p className="text-sm font-medium">Tesla Data Integration</p>
              <p className="text-xs text-muted-foreground">
                Last updated: {vehicleData ? new Date(vehicleData.timestamp).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <Badge className="ml-auto bg-adventure-teal/20 text-adventure-teal">
              {vehicleData ? '🟢 Live' : '🔴 Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineDataDisplay;
