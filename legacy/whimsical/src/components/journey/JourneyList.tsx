import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { JourneyManagement } from './JourneyManagement';
import { FollowerApprovalManager } from './FollowerApprovalManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Archive, Route, Users } from 'lucide-react';

interface Journey {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  archived_at: string | null;
  archive_expires_at: string | null;
  export_generated_at: string | null;
  total_miles: number | null;
  cloudflare_d1_id: string | null;
  is_complete: boolean | null;
  is_public: boolean | null;
}

interface FollowerCount {
  journeyId: string;
  pending: number;
  total: number;
}

export function JourneyList() {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [followerCounts, setFollowerCounts] = useState<FollowerCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJourneyForFollowers, setSelectedJourneyForFollowers] = useState<Journey | null>(null);

  const fetchJourneys = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('journeys')
      .select('id, name, start_date, end_date, archived_at, archive_expires_at, export_generated_at, total_miles, cloudflare_d1_id, is_complete, is_public')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    if (!error && data) {
      setJourneys(data);
      
      // Fetch follower counts for each journey
      const counts = await Promise.all(
        data.map(async (journey) => {
          const { data: followers } = await supabase
            .from('journey_followers')
            .select('approved')
            .eq('journey_id', journey.id);
          
          return {
            journeyId: journey.id,
            pending: followers?.filter(f => !f.approved).length || 0,
            total: followers?.length || 0
          };
        })
      );
      setFollowerCounts(counts);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchJourneys();
  }, [user]);

  const activeJourneys = journeys.filter(j => !j.archived_at);
  const archivedJourneys = journeys.filter(j => j.archived_at);
  const totalPendingFollowers = followerCounts.reduce((sum, c) => sum + c.pending, 0);

  const getFollowerCount = (journeyId: string) => {
    return followerCounts.find(c => c.journeyId === journeyId) || { pending: 0, total: 0 };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="active" className="flex items-center gap-2">
          <Route className="w-4 h-4" />
          Active ({activeJourneys.length})
        </TabsTrigger>
        <TabsTrigger value="archived" className="flex items-center gap-2">
          <Archive className="w-4 h-4" />
          Archived ({archivedJourneys.length})
        </TabsTrigger>
        <TabsTrigger value="followers" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Followers
          {totalPendingFollowers > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
              {totalPendingFollowers}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4">
        {activeJourneys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Route className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active journeys</p>
            <p className="text-sm">Create a new journey to start tracking!</p>
          </div>
        ) : (
          activeJourneys.map(journey => (
            <JourneyManagement key={journey.id} journey={journey} onUpdate={fetchJourneys} />
          ))
        )}
      </TabsContent>

      <TabsContent value="archived" className="space-y-4">
        {archivedJourneys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No archived journeys</p>
            <p className="text-sm">Archive journeys to free up slots while keeping your data in cold storage.</p>
          </div>
        ) : (
          archivedJourneys.map(journey => (
            <JourneyManagement key={journey.id} journey={journey} onUpdate={fetchJourneys} />
          ))
        )}
      </TabsContent>

      <TabsContent value="followers" className="space-y-4">
        {journeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No journeys yet</p>
            <p className="text-sm">Create a journey to start receiving follow requests.</p>
          </div>
        ) : selectedJourneyForFollowers ? (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedJourneyForFollowers(null)}
              className="text-sm text-primary hover:underline"
            >
              ← Back to journey list
            </button>
            <FollowerApprovalManager 
              journeyId={selectedJourneyForFollowers.id} 
              journeyName={selectedJourneyForFollowers.name}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              Select a journey to manage its followers
            </p>
            {journeys.map(journey => {
              const counts = getFollowerCount(journey.id);
              return (
                <button
                  key={journey.id}
                  onClick={() => setSelectedJourneyForFollowers(journey)}
                  className="w-full p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-medium">{journey.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {counts.total} follower{counts.total !== 1 ? 's' : ''}
                      {journey.is_public ? ' • Public' : ' • Private'}
                    </p>
                  </div>
                  {counts.pending > 0 && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600/30">
                      {counts.pending} pending
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
