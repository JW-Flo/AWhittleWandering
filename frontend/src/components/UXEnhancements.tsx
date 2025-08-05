import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  RealTimeStream,
  InteractiveTimelineEvent,
  SocialShareData,
  NotificationPreferences
} from '@/types/enhanced-features';
import {
  Play,
  Pause,
  Share2,
  Bell,
  MapPin,
  Battery,
  Navigation,
  Clock,
  Zap,
  Camera,
  Users,
  Settings,
  Download,
  Heart,
  MessageCircle
} from 'lucide-react';

interface UXEnhancementsProps {
  onNotificationToggle?: (preferences: NotificationPreferences) => void;
  onShareTrip?: (shareData: SocialShareData) => void;
}

export const UXEnhancements: React.FC<UXEnhancementsProps> = ({
  onNotificationToggle,
  onShareTrip
}) => {
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [realTimeData, setRealTimeData] = useState<RealTimeStream | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<InteractiveTimelineEvent[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    chargingAlerts: true,
    routeUpdates: true,
    maintenanceReminders: true,
    energyInsights: false,
    socialUpdates: false,
    realTimeTracking: true
  });
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // This will be implemented by mistral model
  const startRealTimeTracking = useCallback(() => {
    console.warn('🤖 Initializing real-time tracking with mistral...');
    setIsLiveTracking(true);
    
    // Simulate real-time data stream
    const interval = setInterval(() => {
      const mockData: RealTimeStream = {
        vehicleLocation: {
          lat: 37.7749 + (Math.random() - 0.5) * 0.01,
          lng: -122.4194 + (Math.random() - 0.5) * 0.01
        },
        batteryLevel: 65 + Math.random() * 10,
        chargingStatus: {
          isCharging: Math.random() > 0.8,
          chargeRate: Math.random() > 0.8 ? 150 + Math.random() * 100 : 0,
          timeToComplete: Math.random() > 0.8 ? 45 + Math.random() * 30 : 0,
          targetLevel: 80
        },
        speed: Math.random() * 70,
        heading: Math.random() * 360,
        timestamp: new Date()
      };
      
      setRealTimeData(mockData);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // This will be implemented by mistral model
  const generateInteractiveTimeline = useCallback(() => {
    console.warn('🤖 Generating interactive timeline with mistral...');
    
    const mockEvents: InteractiveTimelineEvent[] = [
      {
        id: '1',
        type: 'drive',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        location: { lat: 37.7749, lng: -122.4194 },
        details: {
          distance: 120,
          duration: 90,
          efficiency: 3.8,
          avgSpeed: 58
        },
        interactive: true,
        expandable: true
      },
      {
        id: '2',
        type: 'charge',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        location: { lat: 37.8044, lng: -122.2711 },
        details: {
          energyAdded: 45.2,
          duration: 35,
          cost: 18.50,
          stationName: 'Tesla Supercharger'
        },
        interactive: true,
        expandable: true
      },
      {
        id: '3',
        type: 'milestone',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        location: { lat: 37.8716, lng: -122.2727 },
        details: {
          achievement: '1000th mile on this trip',
          badge: 'Distance Master',
          celebration: true
        },
        interactive: true,
        expandable: true
      }
    ];
    
    setTimelineEvents(mockEvents);
  }, []);

  // This will be implemented by mistral model
  const handleSocialShare = useCallback(async () => {
    console.warn('🤖 Preparing social share with mistral...');
    
    const shareData: SocialShareData = {
      tripId: 'trip-123',
      title: 'Amazing Road Trip Adventure!',
      description: 'Just completed an incredible 500-mile journey with 95% efficiency!',
      image: '/trip-thumbnail.jpg',
      statistics: {
        distance: 487.3,
        duration: 8.5 * 60, // in minutes
        energyUsed: 128.4,
        efficiency: 3.8,
        chargingStops: 2,
        cost: 42.30
      },
      route: [],
      privacy: 'public'
    };
    
    onShareTrip?.(shareData);
  }, [onShareTrip]);

  const updateNotificationPreference = (key: keyof NotificationPreferences, value: boolean) => {
    const updatedPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updatedPrefs);
    onNotificationToggle?.(updatedPrefs);
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const getEventIcon = (type: InteractiveTimelineEvent['type']) => {
    switch (type) {
      case 'drive': return <Navigation className="h-4 w-4" />;
      case 'charge': return <Zap className="h-4 w-4" />;
      case 'stop': return <MapPin className="h-4 w-4" />;
      case 'milestone': return <Heart className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMins}m ago`;
  };

  useEffect(() => {
    generateInteractiveTimeline();
  }, [generateInteractiveTimeline]);

  return (
    <div className="space-y-6">
      {/* Real-Time Tracking Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Real-Time Journey Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  if (isLiveTracking) {
                    setIsLiveTracking(false);
                    setRealTimeData(null);
                  } else {
                    startRealTimeTracking();
                  }
                }}
                variant={isLiveTracking ? 'destructive' : 'default'}
              >
                {isLiveTracking ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Tracking
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Tracking
                  </>
                )}
              </Button>
              {isLiveTracking && (
                <Badge variant="default" className="animate-pulse">
                  Live
                </Badge>
              )}
            </div>
          </div>

          {/* Real-Time Data Display */}
          {realTimeData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Battery</p>
                      <p className="font-bold">{realTimeData.batteryLevel.toFixed(0)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Speed</p>
                      <p className="font-bold">{realTimeData.speed.toFixed(0)} mph</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Charging</p>
                      <p className="font-bold">
                        {realTimeData.chargingStatus.isCharging ? 
                          `${realTimeData.chargingStatus.chargeRate.toFixed(0)}kW` : 
                          'Not charging'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-bold text-xs">
                        {realTimeData.vehicleLocation.lat.toFixed(3)}, {realTimeData.vehicleLocation.lng.toFixed(3)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Interactive Journey Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineEvents.map((event) => (
              <div
                key={event.id}
                className={`border rounded-lg transition-all duration-200 ${
                  expandedEvent === event.id ? 'border-blue-300 shadow-md' : 'border-gray-200'
                }`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        event.type === 'drive' ? 'bg-blue-100' :
                        event.type === 'charge' ? 'bg-green-100' :
                        event.type === 'milestone' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{event.type} Event</p>
                        <p className="text-sm text-gray-600">{formatTimeAgo(event.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.type === 'milestone' && (
                        <Badge variant="default" className="bg-purple-100 text-purple-800">
                          Achievement
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        {expandedEvent === event.id ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Event Details */}
                {expandedEvent === event.id && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="pt-4">
                      {event.type === 'drive' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Distance</p>
                            <p className="font-medium">{(event.details as any).distance} mi</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Duration</p>
                            <p className="font-medium">{(event.details as any).duration} min</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Efficiency</p>
                            <p className="font-medium">{(event.details as any).efficiency} mi/kWh</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Avg Speed</p>
                            <p className="font-medium">{(event.details as any).avgSpeed} mph</p>
                          </div>
                        </div>
                      )}

                      {event.type === 'charge' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Energy Added</p>
                            <p className="font-medium">{(event.details as any).energyAdded} kWh</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Duration</p>
                            <p className="font-medium">{(event.details as any).duration} min</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Cost</p>
                            <p className="font-medium">${(event.details as any).cost}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Station</p>
                            <p className="font-medium">{(event.details as any).stationName}</p>
                          </div>
                        </div>
                      )}

                      {event.type === 'milestone' && (
                        <div className="text-center py-4">
                          <div className="text-4xl mb-2">🎉</div>
                          <p className="font-medium">{(event.details as any).achievement}</p>
                          <Badge variant="default" className="mt-2">
                            {(event.details as any).badge}
                          </Badge>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Camera className="h-3 w-3 mr-1" />
                          Add Photo
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Add Note
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSocialShare}>
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleSocialShare} className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              Share Trip
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Download className="h-6 w-6 mb-2" />
              Export Data
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Heart className="h-6 w-6 mb-2" />
              Trip Gallery
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(notificationPrefs).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <p className="text-sm text-gray-600">
                    {key === 'chargingAlerts' && 'Get notified when charging is complete'}
                    {key === 'routeUpdates' && 'Receive real-time route optimizations'}
                    {key === 'maintenanceReminders' && 'Predictive maintenance alerts'}
                    {key === 'energyInsights' && 'Weekly efficiency reports'}
                    {key === 'socialUpdates' && 'Friend activity and trip shares'}
                    {key === 'realTimeTracking' && 'Live location sharing with family'}
                  </p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => updateNotificationPreference(key as keyof NotificationPreferences, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UXEnhancements;
