import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Route, Zap, Calendar, Users, ArrowRight, Globe, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import FollowButton from './FollowButton';

interface PublicJourney {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  start_date: string;
  end_date: string | null;
  total_miles: number | null;
  total_kwh: number | null;
  states_count: number | null;
  created_at: string;
  updated_at: string;
}

export default function PublicJourneyFeed() {
  const [journeys, setJourneys] = useState<PublicJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPublicJourneys();
    
    // Set up real-time subscription for new public journeys
    const channel = supabase
      .channel('public-journeys-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journeys',
          filter: 'is_public=eq.true'
        },
        () => {
          fetchPublicJourneys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPublicJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('public_journeys')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setJourneys(data || []);
    } catch (error) {
      console.error('Error fetching public journeys:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPublicJourneys();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="card-nature">
            <CardContent className="p-4">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Public Journeys</h2>
          <Badge variant="outline" className="text-xs">
            {journeys.length} active
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {journeys.length === 0 ? (
        <Card className="card-nature">
          <CardContent className="py-12 text-center">
            <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No public journeys yet</p>
            <p className="text-sm text-muted-foreground/70">Be the first to share your adventure!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {journeys.map((journey) => (
            <Card 
              key={journey.id} 
              className="card-nature overflow-hidden hover:border-primary/50 transition-colors group"
            >
              {journey.cover_image_url && (
                <div className="h-32 overflow-hidden">
                  <img 
                    src={journey.cover_image_url} 
                    alt={journey.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                      {journey.name}
                    </h3>
                    {journey.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {journey.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Live
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                  {journey.total_miles && (
                    <span className="flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      {Math.round(journey.total_miles).toLocaleString()} mi
                    </span>
                  )}
                  {journey.states_count && journey.states_count > 0 && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {journey.states_count} states
                    </span>
                  )}
                  {journey.total_kwh && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {Math.round(journey.total_kwh)} kWh
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(journey.updated_at), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-2">
                    <FollowButton 
                      journeyId={journey.id} 
                      journeyOwnerId="" 
                      className="h-7 text-xs"
                    />
                    <Link to={`/explore?journey=${journey.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}