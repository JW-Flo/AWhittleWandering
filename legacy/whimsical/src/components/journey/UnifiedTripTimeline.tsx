import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  MapPin,
  Calendar,
  Mic,
  Image,
  Video,
  Battery,
  Zap,
  Navigation,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  Users,
  Sparkles,
  Route,
  Flag,
  Home,
  Star,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, parseISO, differenceInMinutes, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchSignedUrls } from '@/hooks/useSignedUrl';

// Timeline event types
type TimelineEventType = 'journal' | 'photo' | 'video' | 'drive_start' | 'drive_end' | 'charging' | 'waypoint' | 'state_crossing' | 'memory_nudge';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date;
  title: string;
  subtitle?: string;
  description?: string;
  location?: {
    name: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  metadata?: {
    // Journal specific
    mood?: string;
    audioUrl?: string;
    isHighlight?: boolean;
    transcriptionSource?: string;
    peopleMet?: string[];
    // Media specific
    mediaUrl?: string;
    mediaType?: 'photo' | 'video';
    // Drive specific
    distanceMiles?: number;
    durationMinutes?: number;
    startBattery?: number;
    endBattery?: number;
    energyUsed?: number;
    // Charging specific
    energyAdded?: number;
    chargerType?: string;
    // State crossing
    newState?: string;
    // Memory nudge
    nudgeReason?: string;
    suggested?: boolean;
  };
}

interface UnifiedTripTimelineProps {
  journeyId: string;
  className?: string;
  showNudges?: boolean;
}

// Calculate distance between coordinates
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Identify unique waypoints from drive data clustering
const identifyUniqueWaypoints = (
  driveData: Array<{ recorded_at: string; latitude: number; longitude: number; speed_mph?: number }>
): Array<{ lat: number; lng: number; startTime: Date; endTime: Date; dwellMinutes: number }> => {
  if (driveData.length === 0) return [];
  
  const waypoints: Array<{ lat: number; lng: number; startTime: Date; endTime: Date; dwellMinutes: number }> = [];
  let currentCluster: typeof driveData = [];
  
  for (const point of driveData) {
    const isStationary = !point.speed_mph || point.speed_mph < 5;
    
    if (isStationary) {
      if (currentCluster.length === 0) {
        currentCluster.push(point);
      } else {
        const lastPoint = currentCluster[currentCluster.length - 1];
        const distance = getDistance(
          point.latitude, point.longitude,
          lastPoint.latitude, lastPoint.longitude
        );
        
        if (distance < 0.5) { // Within 500m
          currentCluster.push(point);
        } else {
          // Finalize current cluster if significant
          if (currentCluster.length >= 3) {
            const startTime = parseISO(currentCluster[0].recorded_at);
            const endTime = parseISO(currentCluster[currentCluster.length - 1].recorded_at);
            const dwellMinutes = differenceInMinutes(endTime, startTime);
            
            if (dwellMinutes >= 15) {
              const avgLat = currentCluster.reduce((sum, p) => sum + p.latitude, 0) / currentCluster.length;
              const avgLng = currentCluster.reduce((sum, p) => sum + p.longitude, 0) / currentCluster.length;
              waypoints.push({ lat: avgLat, lng: avgLng, startTime, endTime, dwellMinutes });
            }
          }
          currentCluster = [point];
        }
      }
    } else {
      // Vehicle moving, finalize any cluster
      if (currentCluster.length >= 3) {
        const startTime = parseISO(currentCluster[0].recorded_at);
        const endTime = parseISO(currentCluster[currentCluster.length - 1].recorded_at);
        const dwellMinutes = differenceInMinutes(endTime, startTime);
        
        if (dwellMinutes >= 15) {
          const avgLat = currentCluster.reduce((sum, p) => sum + p.latitude, 0) / currentCluster.length;
          const avgLng = currentCluster.reduce((sum, p) => sum + p.longitude, 0) / currentCluster.length;
          waypoints.push({ lat: avgLat, lng: avgLng, startTime, endTime, dwellMinutes });
        }
      }
      currentCluster = [];
    }
  }
  
  return waypoints;
};

// Generate memory nudges for waypoints without journal entries
const generateMemoryNudges = (
  identifiedWaypoints: Array<{ lat: number; lng: number; startTime: Date; endTime: Date; dwellMinutes: number }>,
  existingEntries: Array<{ timestamp: Date; location?: { lat?: number; lng?: number } }>
): TimelineEvent[] => {
  const nudges: TimelineEvent[] = [];
  
  for (const waypoint of identifiedWaypoints) {
    // Check if there's already a journal entry near this waypoint
    const hasEntry = existingEntries.some(entry => {
      if (!entry.location?.lat || !entry.location?.lng) return false;
      const distance = getDistance(waypoint.lat, waypoint.lng, entry.location.lat, entry.location.lng);
      const timeDiff = Math.abs(differenceInMinutes(entry.timestamp, waypoint.startTime));
      return distance < 1 && timeDiff < 120; // Within 1km and 2 hours
    });
    
    if (!hasEntry && waypoint.dwellMinutes >= 30) {
      const dwellHours = Math.floor(waypoint.dwellMinutes / 60);
      const dwellMins = waypoint.dwellMinutes % 60;
      const dwellStr = dwellHours > 0 ? `${dwellHours}h ${dwellMins}m` : `${dwellMins}m`;
      
      nudges.push({
        id: `nudge-${waypoint.startTime.getTime()}`,
        type: 'memory_nudge',
        timestamp: waypoint.startTime,
        title: 'A moment worth remembering?',
        subtitle: `You spent ${dwellStr} here`,
        description: 'Did you meet someone new? See something surprising? This could be worth a memory.',
        location: {
          name: 'Unknown Location',
          lat: waypoint.lat,
          lng: waypoint.lng
        },
        metadata: {
          nudgeReason: 'long_stay',
          suggested: true
        }
      });
    }
  }
  
  return nudges;
};

const UnifiedTripTimeline: React.FC<UnifiedTripTimelineProps> = ({
  journeyId,
  className,
  showNudges = true
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<TimelineEvent | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    if (user && journeyId) {
      fetchAllData();
    }
  }, [user, journeyId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [journalRes, mediaRes, chargingRes, statesRes, driveRes] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('*')
          .eq('journey_id', journeyId)
          .order('entry_date', { ascending: true }),
        supabase
          .from('journey_media')
          .select('*')
          .eq('journey_id', journeyId)
          .order('taken_at', { ascending: true }),
        supabase
          .from('charging_sessions')
          .select('*')
          .eq('journey_id', journeyId)
          .order('started_at', { ascending: true }),
        supabase
          .from('states_visited')
          .select('*')
          .eq('journey_id', journeyId)
          .order('first_entered_at', { ascending: true }),
        supabase
          .from('drive_data')
          .select('recorded_at, latitude, longitude, speed_mph, battery_level')
          .eq('journey_id', journeyId)
          .order('recorded_at', { ascending: true })
          .limit(1000)
      ]);

      const allEvents: TimelineEvent[] = [];

      // Process journal entries
      if (journalRes.data) {
        for (const entry of journalRes.data) {
          allEvents.push({
            id: entry.id,
            type: 'journal',
            timestamp: parseISO(entry.created_at),
            title: entry.title || 'Voice Note',
            subtitle: entry.transcription_source === 'voice' ? 'Voice recording' : 
                     entry.transcription_source === 'audio_only' ? 'Audio memory' : 'Written note',
            description: entry.content || undefined,
            location: entry.location_name ? {
              name: entry.location_name,
              state: entry.state_code || undefined,
              lat: entry.latitude ? Number(entry.latitude) : undefined,
              lng: entry.longitude ? Number(entry.longitude) : undefined
            } : undefined,
            metadata: {
              mood: entry.mood || undefined,
              audioUrl: entry.audio_url || undefined,
              isHighlight: entry.is_highlight || false,
              transcriptionSource: entry.transcription_source || 'manual',
              peopleMet: entry.people_met || undefined
            }
          });
        }
      }

      // Process media
      if (mediaRes.data && mediaRes.data.length > 0) {
        const filesToFetch = mediaRes.data.map(item => ({
          file_path: item.file_path,
          journey_id: journeyId
        }));
        const signedUrls = await fetchSignedUrls(filesToFetch);

        for (const item of mediaRes.data) {
          allEvents.push({
            id: item.id,
            type: item.type === 'video' ? 'video' : 'photo',
            timestamp: item.taken_at ? parseISO(item.taken_at) : parseISO(item.created_at),
            title: item.caption || (item.type === 'video' ? 'Video' : 'Photo'),
            location: item.location_name ? {
              name: item.location_name,
              state: item.state_code || undefined,
              lat: item.latitude ? Number(item.latitude) : undefined,
              lng: item.longitude ? Number(item.longitude) : undefined
            } : undefined,
            metadata: {
              mediaUrl: signedUrls.get(item.file_path) || '',
              mediaType: item.type as 'photo' | 'video'
            }
          });
        }
      }

      // Process charging sessions
      if (chargingRes.data) {
        for (const session of chargingRes.data) {
          allEvents.push({
            id: session.id,
            type: 'charging',
            timestamp: parseISO(session.started_at),
            title: session.location_name || 'Charging Stop',
            subtitle: session.charger_type || 'Supercharger',
            location: session.location_name ? {
              name: session.location_name,
              lat: session.latitude ? Number(session.latitude) : undefined,
              lng: session.longitude ? Number(session.longitude) : undefined
            } : undefined,
            metadata: {
              energyAdded: session.energy_added_kwh ? Number(session.energy_added_kwh) : undefined,
              chargerType: session.charger_type || undefined,
              startBattery: session.start_battery_level || undefined,
              endBattery: session.end_battery_level || undefined,
              durationMinutes: session.duration_minutes || undefined
            }
          });
        }
      }

      // Process state crossings
      if (statesRes.data) {
        for (const state of statesRes.data) {
          if (state.first_entered_at) {
            allEvents.push({
              id: `state-${state.id}`,
              type: 'state_crossing',
              timestamp: parseISO(state.first_entered_at),
              title: `Welcome to ${state.state_name}!`,
              subtitle: state.state_code,
              metadata: {
                newState: state.state_code
              }
            });
          }
        }
      }

      // Identify waypoints from drive data and generate nudges
      if (showNudges && driveRes.data && driveRes.data.length > 0) {
        const identifiedWaypoints = identifyUniqueWaypoints(
          driveRes.data.map(d => ({
            recorded_at: d.recorded_at,
            latitude: Number(d.latitude),
            longitude: Number(d.longitude),
            speed_mph: d.speed_mph ? Number(d.speed_mph) : undefined
          }))
        );

        const existingEntriesForNudges = allEvents
          .filter(e => e.type === 'journal' || e.type === 'photo')
          .map(e => ({
            timestamp: e.timestamp,
            location: e.location
          }));

        const nudges = generateMemoryNudges(identifiedWaypoints, existingEntriesForNudges);
        allEvents.push(...nudges);
      }

      // Sort all events chronologically
      allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setEvents(allEvents);

      // Expand today and most recent days by default
      const uniqueDays = new Set(allEvents.map(e => format(e.timestamp, 'yyyy-MM-dd')));
      const daysArray = Array.from(uniqueDays).sort().reverse();
      setExpandedDays(new Set(daysArray.slice(0, 3)));

    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const dayKey = format(event.timestamp, 'yyyy-MM-dd');
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, []);
      }
      grouped.get(dayKey)!.push(event);
    }
    return grouped;
  }, [events]);

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  };

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'journal': return Mic;
      case 'photo': return Image;
      case 'video': return Video;
      case 'charging': return Zap;
      case 'state_crossing': return Flag;
      case 'drive_start': return Navigation;
      case 'drive_end': return MapPin;
      case 'waypoint': return MapPin;
      case 'memory_nudge': return Sparkles;
      default: return Clock;
    }
  };

  const getEventColor = (type: TimelineEventType) => {
    switch (type) {
      case 'journal': return 'bg-primary text-primary-foreground';
      case 'photo': return 'bg-info text-info-foreground';
      case 'video': return 'bg-purple-500 text-white';
      case 'charging': return 'bg-success text-success-foreground';
      case 'state_crossing': return 'bg-sunset text-white';
      case 'memory_nudge': return 'bg-warning/20 text-warning border border-warning/50';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'excited': return '🤩';
      case 'happy': return '😊';
      case 'peaceful': return '😌';
      case 'tired': return '😴';
      case 'adventurous': return '🏔️';
      case 'grateful': return '🙏';
      default: return null;
    }
  };

  const handleAudioPlay = async (event: TimelineEvent) => {
    if (!event.metadata?.audioUrl) return;

    if (playingAudioId === event.id) {
      audioElements.get(event.id)?.pause();
      setPlayingAudioId(null);
      return;
    }

    // Stop any playing audio
    if (playingAudioId) {
      audioElements.get(playingAudioId)?.pause();
    }

    // Get signed URL and play
    try {
      const { data } = await supabase.functions.invoke('signed-url', {
        body: { path: event.metadata.audioUrl, bucket: 'journey-media' }
      });

      if (data?.signedUrl) {
        let audio = audioElements.get(event.id);
        if (!audio) {
          audio = new Audio(data.signedUrl);
          audio.addEventListener('ended', () => setPlayingAudioId(null));
          audioElements.set(event.id, audio);
        } else {
          audio.src = data.signedUrl;
        }
        audio.play();
        setPlayingAudioId(event.id);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  if (loading) {
    return (
      <Card className={cn("card-tesla", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Trip Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className={cn("card-tesla", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Trip Timeline
          </CardTitle>
          <CardDescription>
            Your complete journey story will unfold here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Route className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No timeline events yet.</p>
            <p className="text-sm mt-2">Start recording memories and your story will appear here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedDays = Array.from(eventsByDay.keys()).sort().reverse();

  return (
    <>
      <Card className={cn("card-tesla", className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-primary" />
              Trip Timeline
            </div>
            <Badge className="bg-primary/20 text-primary border-0">
              {events.length} moments
            </Badge>
          </CardTitle>
          <CardDescription>
            Your complete journey story — memories, photos, and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {sortedDays.map((dayKey) => {
                const dayEvents = eventsByDay.get(dayKey) || [];
                const isExpanded = expandedDays.has(dayKey);
                const date = parseISO(dayKey);
                const journalCount = dayEvents.filter(e => e.type === 'journal').length;
                const photoCount = dayEvents.filter(e => e.type === 'photo' || e.type === 'video').length;
                const nudgeCount = dayEvents.filter(e => e.type === 'memory_nudge').length;

                return (
                  <div key={dayKey} className="border rounded-lg overflow-hidden">
                    {/* Day Header */}
                    <button
                      className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary/70 transition-colors"
                      onClick={() => toggleDay(dayKey)}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-semibold">
                          {format(date, 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {journalCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Mic className="w-3 h-3 mr-1" />
                            {journalCount}
                          </Badge>
                        )}
                        {photoCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Image className="w-3 h-3 mr-1" />
                            {photoCount}
                          </Badge>
                        )}
                        {nudgeCount > 0 && (
                          <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {nudgeCount}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Day Events */}
                    {isExpanded && (
                      <div className="p-3 space-y-3">
                        {dayEvents.map((event, idx) => {
                          const Icon = getEventIcon(event.type);
                          const colorClass = getEventColor(event.type);

                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "relative pl-8 pb-3",
                                idx !== dayEvents.length - 1 && "border-b border-border/50"
                              )}
                            >
                              {/* Timeline dot */}
                              <div className={cn(
                                "absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center",
                                colorClass
                              )}>
                                <Icon className="w-3 h-3" />
                              </div>

                              {/* Event content */}
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-medium text-foreground">
                                        {event.title}
                                      </h4>
                                      {event.metadata?.isHighlight && (
                                        <Star className="w-4 h-4 text-sunset fill-sunset" />
                                      )}
                                      {getMoodEmoji(event.metadata?.mood)}
                                    </div>
                                    {event.subtitle && (
                                      <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(event.timestamp, 'h:mm a')}
                                  </span>
                                </div>

                                {/* Location */}
                                {event.location && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    {event.location.name}
                                    {event.location.state && `, ${event.location.state}`}
                                  </div>
                                )}

                                {/* People met */}
                                {event.metadata?.peopleMet && event.metadata.peopleMet.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="w-3 h-3" />
                                    Met: {event.metadata.peopleMet.join(', ')}
                                  </div>
                                )}

                                {/* Description */}
                                {event.description && (
                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                    {event.description}
                                  </p>
                                )}

                                {/* Audio player for journal entries */}
                                {event.metadata?.audioUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleAudioPlay(event)}
                                  >
                                    {playingAudioId === event.id ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                    {playingAudioId === event.id ? 'Pause' : 'Play audio'}
                                  </Button>
                                )}

                                {/* Photo/Video thumbnail */}
                                {event.metadata?.mediaUrl && (
                                  <div
                                    className="relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer group"
                                    onClick={() => setSelectedMedia(event)}
                                  >
                                    {event.metadata.mediaType === 'video' ? (
                                      <div className="relative w-full h-full bg-secondary">
                                        <video src={event.metadata.mediaUrl} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                          <Play className="w-6 h-6 text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <img
                                        src={event.metadata.mediaUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    )}
                                  </div>
                                )}

                                {/* Charging details */}
                                {event.type === 'charging' && event.metadata && (
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {event.metadata.energyAdded && (
                                      <span className="flex items-center gap-1">
                                        <Zap className="w-3 h-3 text-success" />
                                        +{event.metadata.energyAdded.toFixed(1)} kWh
                                      </span>
                                    )}
                                    {event.metadata.startBattery && event.metadata.endBattery && (
                                      <span className="flex items-center gap-1">
                                        <Battery className="w-3 h-3" />
                                        {event.metadata.startBattery}% → {event.metadata.endBattery}%
                                      </span>
                                    )}
                                    {event.metadata.durationMinutes && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {event.metadata.durationMinutes} min
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Memory nudge action */}
                                {event.type === 'memory_nudge' && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button size="sm" variant="outline" className="gap-1">
                                      <Mic className="w-3 h-3" />
                                      Add voice note
                                    </Button>
                                    <Button size="sm" variant="ghost" className="gap-1">
                                      <Image className="w-3 h-3" />
                                      Add photo
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Media Viewer Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          {selectedMedia && (
            <div className="relative">
              {selectedMedia.metadata?.mediaType === 'video' ? (
                <video
                  src={selectedMedia.metadata.mediaUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh]"
                />
              ) : (
                <img
                  src={selectedMedia.metadata?.mediaUrl}
                  alt={selectedMedia.title}
                  className="w-full max-h-[80vh] object-contain"
                />
              )}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <p className="text-white font-medium">{selectedMedia.title}</p>
                {selectedMedia.location && (
                  <div className="flex items-center gap-2 mt-1 text-white/70 text-sm">
                    <MapPin className="w-4 h-4" />
                    {selectedMedia.location.name}
                    {selectedMedia.location.state && `, ${selectedMedia.location.state}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnifiedTripTimeline;