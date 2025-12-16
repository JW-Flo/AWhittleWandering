import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { JourneyManagement } from './JourneyManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, Route } from 'lucide-react';

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
}

export function JourneyList() {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJourneys = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('journeys')
      .select('id, name, start_date, end_date, archived_at, archive_expires_at, export_generated_at, total_miles, cloudflare_d1_id')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    if (!error && data) {
      setJourneys(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchJourneys();
  }, [user]);

  const activeJourneys = journeys.filter(j => !j.archived_at);
  const archivedJourneys = journeys.filter(j => j.archived_at);

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
    </Tabs>
  );
}
