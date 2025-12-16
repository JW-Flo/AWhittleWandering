import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FlagshipWaypoint {
  id: string;
  waypoint_number: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  arrived_at: string;
  departed_at: string | null;
  waypoint_type: string;
  description: string | null;
  state_code: string | null;
  is_highlight: boolean;
  people_met: string[] | null;
  battery_on_arrival: number | null;
  odometer_miles: number | null;
  dwell_minutes: number | null;
}

export function useFlagshipWaypoints() {
  return useQuery({
    queryKey: ['flagship-waypoints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flagship_waypoints')
        .select('*')
        .order('waypoint_number', { ascending: true });

      if (error) {
        console.error('Error fetching flagship waypoints:', error);
        throw error;
      }

      return data as FlagshipWaypoint[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useHighlightWaypoints() {
  return useQuery({
    queryKey: ['flagship-waypoints-highlights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flagship_waypoints')
        .select('*')
        .eq('is_highlight', true)
        .order('waypoint_number', { ascending: true });

      if (error) {
        console.error('Error fetching highlight waypoints:', error);
        throw error;
      }

      return data as FlagshipWaypoint[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
