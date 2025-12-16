import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFlagshipGating } from '@/hooks/useFlagshipGating';
import RoutePlayback from '@/components/RoutePlayback';
import LocationMediaGallery from '@/components/LocationMediaGallery';
import JourneyTimeline from '@/components/JourneyTimeline';
import PhotoUpload from '@/components/PhotoUpload';
import LiveVehicleStatus from '@/components/LiveVehicleStatus';
import { JourneyWaypoint } from '@/data/journeyRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Map, Image, Calendar, Zap, Activity, CheckCircle, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export default function Explore() {
  const { user } = useAuth();
  const { hasViewedFlagship, markFlagshipViewed } = useFlagshipGating();
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [currentWaypoint, setCurrentWaypoint] = useState<JourneyWaypoint | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [explorationProgress, setExplorationProgress] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Mapbox token
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-mapbox-token');
        if (tokenError) throw tokenError;
        setMapboxToken(tokenData.token);

        // Fetch first journey for photo uploads
        if (user) {
          const { data: journeys } = await supabase
            .from('journeys')
            .select('id')
            .order('start_date', { ascending: false })
            .limit(1);
          
          if (journeys && journeys.length > 0) {
            setJourneyId(journeys[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleWaypointChange = (waypoint: JourneyWaypoint, index: number) => {
    setCurrentWaypoint(waypoint);
    setCurrentIndex(index);
    
    // Track exploration progress
    const progress = Math.round(((index + 1) / 57) * 100);
    setExplorationProgress(prev => Math.max(prev, progress));
    
    // Mark as viewed after exploring significant portion (25%+)
    if (progress >= 25 && !hasViewedFlagship) {
      markFlagshipViewed();
      toast.success('Consumer features unlocked!', {
        description: 'You can now create your own journeys and track your vehicle.'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gradient-primary">Explore AWW Journey</h1>
                <p className="text-sm text-muted-foreground">48-state Tesla road trip • June - August 2025</p>
              </div>
              {/* Unlock indicator */}
              {!hasViewedFlagship && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                  <Unlock className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary font-medium">{explorationProgress}% explored</span>
                </div>
              )}
              {hasViewedFlagship && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-forest/10 rounded-full border border-forest/20">
                  <CheckCircle className="w-4 h-4 text-forest" />
                  <span className="text-xs text-forest font-medium">Features Unlocked</span>
                </div>
              )}
            </div>
            {currentWaypoint && (
              <div className="text-right">
                <p className="font-semibold text-foreground">{currentWaypoint.name}</p>
                <p className="text-sm text-muted-foreground">{currentWaypoint.state} • {currentWaypoint.date}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - Takes 2/3 on large screens */}
          <div className="lg:col-span-2">
            <RoutePlayback
              mapboxToken={mapboxToken}
              className="h-[500px] lg:h-[600px]"
              onWaypointChange={handleWaypointChange}
            />
          </div>

          {/* Sidebar - Takes 1/3 on large screens */}
          <div className="space-y-6">
            <Tabs defaultValue="media" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="media" className="flex items-center gap-1.5">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">Media</span>
                </TabsTrigger>
                <TabsTrigger value="live" className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Live</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Stats</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="media" className="mt-4 space-y-4">
                <LocationMediaGallery
                  currentWaypoint={currentWaypoint}
                  currentIndex={currentIndex}
                />
                {journeyId && (
                  <PhotoUpload
                    journeyId={journeyId}
                    currentWaypoint={currentWaypoint}
                  />
                )}
              </TabsContent>

              <TabsContent value="live" className="mt-4">
                <LiveVehicleStatus />
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <JourneyTimeline />
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                <div className="card-tesla p-4 space-y-4">
                  <h3 className="font-semibold text-lg">Journey Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">15,847</p>
                      <p className="text-xs text-muted-foreground">Miles Traveled</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">48</p>
                      <p className="text-xs text-muted-foreground">States Visited</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">6,915</p>
                      <p className="text-xs text-muted-foreground">kWh Consumed</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">259</p>
                      <p className="text-xs text-muted-foreground">Charging Stops</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">89</p>
                      <p className="text-xs text-muted-foreground">Days on Road</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">436</p>
                      <p className="text-xs text-muted-foreground">Wh/mi Average</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
