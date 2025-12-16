import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Camera, Star, Mountain, Sunset, Cloud, Zap, Navigation, Route } from 'lucide-react';
import { journeyWaypoints, JourneyWaypoint } from '@/data/journeyRoute';
import WaypointDetailDrawer from './WaypointDetailDrawer';

interface JourneyTimelineProps {
  isLoading?: boolean;
  currentLocation?: { lat: number; lng: number } | null;
  batteryLevel?: number;
  isCharging?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'start': return Star;
    case 'highlight': return Camera;
    case 'charging': return Zap;
    case 'waypoint': return MapPin;
    default: return MapPin;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'start': return 'text-forest';
    case 'highlight': return 'text-sunset';
    case 'charging': return 'text-primary';
    case 'waypoint': return 'text-sand';
    default: return 'text-muted-foreground';
  }
};

const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  isLoading = false,
  currentLocation = null,
  batteryLevel,
  isCharging = false
}) => {
  const [selectedWaypoint, setSelectedWaypoint] = useState<JourneyWaypoint | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Use actual journey waypoints
  const waypoints = journeyWaypoints;

  if (isLoading) {
    return (
      <Card className="card-tesla">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient-primary">
            <Route className="w-5 h-5" />
            AWW Journey Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading journey timeline...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-tesla">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient-primary flex-wrap">
          <Route className="w-5 h-5" />
          AWW Journey Log
          <Badge className="ml-auto bg-primary/20 text-primary border-0">
            {waypoints.length} Stops
          </Badge>
          {currentLocation && (
            <Badge className="bg-sunset/20 text-sunset border-0">
              <Navigation className="w-3 h-3 mr-1" />
              Live GPS
            </Badge>
          )}
          {batteryLevel !== undefined && (
            <Badge className={`${isCharging ? 'bg-forest/20 text-forest' : 'bg-primary/20 text-primary'} border-0`}>
              <Zap className="w-3 h-3 mr-1" />
              {batteryLevel}% {isCharging ? '⚡' : '🔋'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Live Vehicle Status */}
        {currentLocation && (
          <div className="mb-6 p-4 bg-sunset/10 rounded-lg border border-sunset/20">
            <h4 className="font-semibold text-sunset mb-2 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Live Vehicle Status
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Location: </span>
                <span className="font-mono text-foreground">{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
              </div>
              {batteryLevel !== undefined && (
                <div>
                  <span className="text-muted-foreground">Battery: </span>
                  <span className={batteryLevel < 30 ? 'text-destructive' : 'text-foreground'}>
                    {batteryLevel}% {isCharging ? '(Charging)' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative max-h-[600px] overflow-y-auto pr-2">
          {/* Timeline line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-forest via-sunset to-muted" />

          <div className="space-y-4">
            {waypoints.slice(0, 20).map((waypoint, index) => {
              const IconComponent = getTypeIcon(waypoint.type);
              const iconColor = getTypeColor(waypoint.type);

              return (
                <div 
                  key={index} 
                  className="relative flex gap-4 cursor-pointer hover:bg-muted/30 rounded-lg p-2 -ml-2 transition-colors"
                  onClick={() => {
                    setSelectedWaypoint(waypoint);
                    setSelectedIndex(index);
                  }}
                >
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${
                    waypoint.type === 'start' ? 'bg-forest' :
                    waypoint.type === 'highlight' ? 'bg-sunset' :
                    waypoint.type === 'charging' ? 'bg-primary' :
                    'bg-secondary'
                  } border-2 border-background`}>
                    <IconComponent className="w-5 h-5 text-primary-foreground" />
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-foreground">{waypoint.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {waypoint.state}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {waypoint.date}
                      </span>
                      {waypoint.miles && (
                        <span className="flex items-center gap-1">
                          <Route className="w-3 h-3" />
                          {waypoint.miles} mi
                        </span>
                      )}
                      {waypoint.elevation && (
                        <span className="flex items-center gap-1">
                          <Mountain className="w-3 h-3" />
                          {waypoint.elevation.toLocaleString()} ft
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-foreground/70 line-clamp-2">
                      {waypoint.description}
                    </p>
                  </div>
                </div>
              );
            })}

            {waypoints.length > 20 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                +{waypoints.length - 20} more stops...
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <WaypointDetailDrawer
        waypoint={selectedWaypoint}
        isOpen={!!selectedWaypoint}
        onClose={() => setSelectedWaypoint(null)}
        waypointIndex={selectedIndex}
        totalWaypoints={waypoints.length}
      />
    </Card>
  );
};

export default JourneyTimeline;
