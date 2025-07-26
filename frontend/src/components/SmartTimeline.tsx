import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Route, 
  Zap, 
  Camera, 
  Star, 
  Navigation,
  Battery,
  Thermometer,
  Fuel,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Filter,
  TrendingUp,
  Award,
  Users,
  Heart,
  MessageCircle
} from 'lucide-react';
import { journeyTimeline } from '@/data/journeyData';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'drive' | 'charge' | 'stop' | 'milestone' | 'photo' | 'weather' | 'special';
  title: string;
  description: string;
  location: {
    name: string;
    coordinates: { lat: number; lng: number };
    state: string;
    city: string;
  };
  data?: {
    distance?: number;
    duration?: number;
    averageSpeed?: number;
    startBattery?: number;
    endBattery?: number;
    energyAdded?: number;
    chargeDuration?: number;
    chargeSpeed?: number;
    temperature?: number;
    weather?: string;
    photos?: number;
    notes?: string;
    peopleEncountered?: string[];
    socialInteractions?: number;
    milestonePoints?: number;
  };
  isExpanded?: boolean;
  media?: {
    photos: string[];
    videos: string[];
  };
  insights?: {
    efficiency: number;
    routeOptimization: string;
    chargingStrategy: string;
    weatherImpact: string;
  };
}

interface SmartTimelineProps {
  events?: TimelineEvent[];
  currentLocation?: { lat: number; lng: number; state: string };
  isLoading?: boolean;
  onEventClick?: (event: TimelineEvent) => void;
  filterOptions?: {
    showDrives: boolean;
    showCharges: boolean;
    showStops: boolean;
    showMilestones: boolean;
    showPhotos: boolean;
    showWeather: boolean;
    showSpecial: boolean;
  };
}

// Generate sample timeline events from the journey data
const generateSampleEvents = (): TimelineEvent[] => {
  return journeyTimeline.slice(0, 10).map((journey, index) => ({
    id: `journey-${index}`,
    timestamp: journey.date,
    type: journey.type === 'milestone' ? 'milestone' : 'drive',
    title: `${journey.state} Adventure`,
    description: journey.highlights.join(', '),
    location: {
      name: journey.state,
      coordinates: journey.location || { lat: 0, lng: 0 },
      state: journey.state,
      city: journey.state
    },
    data: {
      distance: Math.floor(Math.random() * 300) + 100,
      duration: Math.floor(Math.random() * 8) + 2,
      averageSpeed: Math.floor(Math.random() * 20) + 50,
      photos: Math.floor(Math.random() * 10) + 1,
      peopleEncountered: ['Local photographer', 'Fellow travelers'],
      socialInteractions: Math.floor(Math.random() * 5) + 1,
      milestonePoints: journey.type === 'milestone' ? 100 : 25
    },
    insights: {
      efficiency: 3.5 + Math.random() * 0.8,
      routeOptimization: 'Optimal scenic route taken',
      chargingStrategy: 'Strategic overnight charging',
      weatherImpact: 'Favorable conditions'
    }
  }));
};

const SmartTimeline: React.FC<SmartTimelineProps> = ({
  events,
  currentLocation,
  isLoading = false,
  onEventClick,
  filterOptions = {
    showDrives: true,
    showCharges: true,
    showStops: true,
    showMilestones: true,
    showPhotos: true,
    showWeather: false,
    showSpecial: true
  }
}) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState(filterOptions);
  const [viewMode, setViewMode] = useState<'timeline' | 'map' | 'stats'>('timeline');

  // Sample timeline data with enhanced intelligence
  const sampleEvents: TimelineEvent[] = [
    {
      id: '1',
      timestamp: '2024-08-02T14:30:00Z',
      type: 'milestone',
      title: 'Entered Connecticut!',
      description: 'State #29 conquered! Getting closer to the finish line.',
      location: {
        name: 'Connecticut State Line',
        coordinates: { lat: 41.1865, lng: -73.1532 },
        state: 'Connecticut',
        city: 'Greenwich'
      },
      data: {
        milestonePoints: 500,
        socialInteractions: 3,
        photos: 8
      },
      insights: {
        efficiency: 3.8,
        routeOptimization: 'Optimal route taken via I-95',
        chargingStrategy: 'Battery level perfect for state entry',
        weatherImpact: 'Clear weather, no efficiency impact'
      }
    },
    {
      id: '2',
      timestamp: '2024-08-02T12:15:00Z',
      type: 'charge',
      title: 'Supercharger Session',
      description: 'Quick top-up before exploring Connecticut',
      location: {
        name: 'Tesla Supercharger - Port Chester',
        coordinates: { lat: 41.0021, lng: -73.6649 },
        state: 'New York',
        city: 'Port Chester'
      },
      data: {
        startBattery: 28,
        endBattery: 85,
        energyAdded: 42.5,
        chargeDuration: 35,
        chargeSpeed: 150,
        temperature: 78
      },
      insights: {
        efficiency: 4.1,
        routeOptimization: 'Strategic charging location',
        chargingStrategy: 'Perfect pre-charge for multi-state drive',
        weatherImpact: 'Ideal temperature for charging efficiency'
      }
    },
    {
      id: '3',
      timestamp: '2024-08-02T08:45:00Z',
      type: 'drive',
      title: 'Scenic Drive Through Hudson Valley',
      description: 'Beautiful morning drive through upstate New York',
      location: {
        name: 'Hudson Valley Scenic Route',
        coordinates: { lat: 41.2845, lng: -73.9527 },
        state: 'New York',
        city: 'Hyde Park'
      },
      data: {
        distance: 127,
        duration: 145,
        averageSpeed: 52,
        startBattery: 82,
        endBattery: 28,
        temperature: 72,
        weather: 'Partly cloudy',
        photos: 12,
        peopleEncountered: ['Sarah from California', 'Tesla owner Mike'],
        socialInteractions: 2
      },
      insights: {
        efficiency: 3.9,
        routeOptimization: 'Scenic route chosen over fastest',
        chargingStrategy: 'Calculated arrival at destination charger',
        weatherImpact: 'Cool morning improved efficiency by 8%'
      }
    },
    {
      id: '4',
      timestamp: '2024-08-01T19:30:00Z',
      type: 'special',
      title: 'Incredible Sunset at Bear Mountain',
      description: 'Stopped for photos at this iconic overlook',
      location: {
        name: 'Bear Mountain State Park',
        coordinates: { lat: 41.3128, lng: -73.9879 },
        state: 'New York',
        city: 'Bear Mountain'
      },
      data: {
        photos: 23,
        socialInteractions: 5,
        peopleEncountered: ['Hiking group from Vermont', 'Fellow Tesla road tripper'],
        notes: 'Amazing golden hour lighting, perfect end to a great day'
      },
      media: {
        photos: ['sunset1.jpg', 'sunset2.jpg', 'group_photo.jpg'],
        videos: ['timelapse_sunset.mp4']
      },
      insights: {
        efficiency: 0,
        routeOptimization: 'Detour worth it for memorable experience',
        chargingStrategy: 'Extended stop planned in advance',
        weatherImpact: 'Perfect weather for photography'
      }
    },
    {
      id: '5',
      timestamp: '2024-08-01T15:20:00Z',
      type: 'stop',
      title: 'Lunch Break in Poughkeepsie',
      description: 'Great local diner recommended by fellow travelers',
      location: {
        name: 'Palace Diner',
        coordinates: { lat: 41.7004, lng: -73.9209 },
        state: 'New York',
        city: 'Poughkeepsie'
      },
      data: {
        duration: 45,
        socialInteractions: 3,
        peopleEncountered: ['Local family', 'Diner owner Joe'],
        notes: 'Best apple pie on the road! Got recommendations for Connecticut stops.',
        photos: 5
      },
      insights: {
        efficiency: 0,
        routeOptimization: 'Local recommendation vs highway stop',
        chargingStrategy: 'Timed with natural break',
        weatherImpact: 'Indoor dining due to afternoon heat'
      }
    }
  ];

  // Use provided events or generate sample events from journey data
  const timelineEvents = events && events.length > 0 ? events : generateSampleEvents();

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(event => {
      switch (event.type) {
        case 'drive': return activeFilters.showDrives;
        case 'charge': return activeFilters.showCharges;
        case 'stop': return activeFilters.showStops;
        case 'milestone': return activeFilters.showMilestones;
        case 'photo': return activeFilters.showPhotos;
        case 'weather': return activeFilters.showWeather;
        case 'special': return activeFilters.showSpecial;
        default: return true;
      }
    });
  }, [timelineEvents, activeFilters]);

  // Calculate journey statistics
  const journeyStats = useMemo(() => {
    const drives = timelineEvents.filter(e => e.type === 'drive');
    const charges = timelineEvents.filter(e => e.type === 'charge');
    const photos = timelineEvents.filter(e => e.type === 'photo' || e.data?.photos);
    
    return {
      totalDistance: drives.reduce((sum, e) => sum + (e.data?.distance || 0), 0),
      totalCharges: charges.length,
      totalPhotos: timelineEvents.reduce((sum, e) => sum + (e.data?.photos || 0), 0),
      totalSocialInteractions: timelineEvents.reduce((sum, e) => sum + (e.data?.socialInteractions || 0), 0),
      averageEfficiency: drives.reduce((sum, e) => sum + (e.insights?.efficiency || 0), 0) / drives.length || 0,
      statesVisited: new Set(timelineEvents.map(e => e.location.state)).size
    };
  }, [timelineEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'drive': return Route;
      case 'charge': return Zap;
      case 'stop': return Pause;
      case 'milestone': return Award;
      case 'photo': return Camera;
      case 'weather': return Thermometer;
      case 'special': return Star;
      default: return MapPin;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'drive': return 'text-blue-500 bg-blue-500/10';
      case 'charge': return 'text-green-500 bg-green-500/10';
      case 'stop': return 'text-orange-500 bg-orange-500/10';
      case 'milestone': return 'text-purple-500 bg-purple-500/10';
      case 'photo': return 'text-pink-500 bg-pink-500/10';
      case 'weather': return 'text-gray-500 bg-gray-500/10';
      case 'special': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Journey Statistics */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Journey Intelligence
            </div>
            <Badge variant="outline" className="bg-blue-100">
              {filteredEvents.length} Events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {journeyStats.totalDistance.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Miles</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {journeyStats.totalCharges}
              </div>
              <div className="text-sm text-muted-foreground">Charge Sessions</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-pink-600">
                {journeyStats.totalPhotos}
              </div>
              <div className="text-sm text-muted-foreground">Photos Taken</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                {journeyStats.totalSocialInteractions}
              </div>
              <div className="text-sm text-muted-foreground">People Met</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Adventure Timeline
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Open filter dialog */}}
                className="flex items-center gap-1"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <TabsList className="grid w-48 grid-cols-3">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="map">Map</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="timeline" className="mt-0">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {filteredEvents.map((event, index) => {
                  const IconComponent = getEventIcon(event.type);
                  const eventColor = getEventColor(event.type);
                  const timestamp = formatTimestamp(event.timestamp);
                  const isExpanded = expandedEvents.has(event.id);
                  
                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline line */}
                      {index < filteredEvents.length - 1 && (
                        <div className="absolute left-5 top-12 w-0.5 h-16 bg-border"></div>
                      )}
                      
                      {/* Event card */}
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${eventColor}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <Card className="hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-4">
                              <div 
                                className="flex items-start justify-between cursor-pointer"
                                onClick={() => toggleEventExpansion(event.id)}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-sm">{event.title}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      {event.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {event.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {event.location.city}, {event.location.state}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {timestamp.date} at {timestamp.time}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {event.data?.photos && event.data.photos > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Camera className="w-3 h-3 mr-1" />
                                      {event.data.photos}
                                    </Badge>
                                  )}
                                  {event.data?.socialInteractions && event.data.socialInteractions > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Users className="w-3 h-3 mr-1" />
                                      {event.data.socialInteractions}
                                    </Badge>
                                  )}
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Expanded content */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t space-y-4">
                                  {/* Event-specific data */}
                                  {event.type === 'drive' && event.data && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Distance:</span>
                                        <div className="font-semibold">{event.data.distance} mi</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Duration:</span>
                                        <div className="font-semibold">{formatDuration(event.data.duration || 0)}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Avg Speed:</span>
                                        <div className="font-semibold">{event.data.averageSpeed} mph</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Efficiency:</span>
                                        <div className="font-semibold">{event.insights?.efficiency?.toFixed(1)} mi/kWh</div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {event.type === 'charge' && event.data && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Energy Added:</span>
                                        <div className="font-semibold">{event.data.energyAdded} kWh</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Duration:</span>
                                        <div className="font-semibold">{formatDuration(event.data.chargeDuration || 0)}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Speed:</span>
                                        <div className="font-semibold">{event.data.chargeSpeed} kW</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Battery:</span>
                                        <div className="font-semibold">{event.data.startBattery}% → {event.data.endBattery}%</div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Social interactions */}
                                  {event.data?.peopleEncountered && event.data.peopleEncountered.length > 0 && (
                                    <div>
                                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        People Met
                                      </h4>
                                      <div className="flex flex-wrap gap-1">
                                        {event.data.peopleEncountered.map((person, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                            {person}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Notes */}
                                  {event.data?.notes && (
                                    <div>
                                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4" />
                                        Notes
                                      </h4>
                                      <p className="text-sm text-muted-foreground italic">
                                        "{event.data.notes}"
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Insights */}
                                  {event.insights && (
                                    <div>
                                      <h4 className="font-medium text-sm mb-2">Journey Insights</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Route:</span>
                                          <div className="text-xs">{event.insights.routeOptimization}</div>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Weather Impact:</span>
                                          <div className="text-xs">{event.insights.weatherImpact}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Action buttons */}
                                  <div className="flex items-center gap-2 pt-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-xs">
                                          View Details
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            <IconComponent className="w-5 h-5" />
                                            {event.title}
                                          </DialogTitle>
                                          <DialogDescription>
                                            {event.location.name} • {timestamp.date} at {timestamp.time}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <p>{event.description}</p>
                                          {/* Detailed content would go here */}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    
                                    <Button variant="ghost" size="sm" className="text-xs">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      View on Map
                                    </Button>
                                    
                                    {event.media?.photos && event.media.photos.length > 0 && (
                                      <Button variant="ghost" size="sm" className="text-xs">
                                        <Camera className="w-3 h-3 mr-1" />
                                        Photos ({event.media.photos.length})
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="map" className="mt-0">
            <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <Navigation className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="font-semibold">Interactive Map View</h3>
                <p className="text-sm text-muted-foreground">
                  Map integration would show all timeline events as markers
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-0">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="w-4 h-4 text-blue-500" />
                      <h3 className="font-semibold text-sm">Driving Stats</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Distance:</span>
                        <span className="font-medium">{journeyStats.totalDistance.toLocaleString()} mi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Efficiency:</span>
                        <span className="font-medium">{journeyStats.averageEfficiency.toFixed(1)} mi/kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">States Visited:</span>
                        <span className="font-medium">{journeyStats.statesVisited}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <h3 className="font-semibold text-sm">Social Journey</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">People Met:</span>
                        <span className="font-medium">{journeyStats.totalSocialInteractions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Photos Shared:</span>
                        <span className="font-medium">{journeyStats.totalPhotos}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-green-500" />
                      <h3 className="font-semibold text-sm">Charging Stats</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Sessions:</span>
                        <span className="font-medium">{journeyStats.totalCharges}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartTimeline;
