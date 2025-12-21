import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Public interface with obfuscated coordinates (~11km precision)
export interface FlagshipWaypoint {
  id: string;
  waypoint_number: number;
  name: string;
  latitude: number;
  longitude: number;
  arrived_at: string;
  waypoint_type: string;
  state_code: string | null;
  is_highlight: boolean;
}

// Full interface for admin use only
export interface FlagshipWaypointFull extends FlagshipWaypoint {
  location: string;
  departed_at: string | null;
  description: string | null;
  people_met: string[] | null;
  battery_on_arrival: number | null;
  odometer_miles: number | null;
  dwell_minutes: number | null;
}

export function useFlagshipWaypoints() {
  return useQuery({
    queryKey: ['flagship-waypoints'],
    queryFn: async () => {
      // Use secure RPC function that returns obfuscated coordinates
      const { data, error } = await supabase
        .rpc('get_public_flagship_waypoints');

      if (error) {
        console.error('Error fetching flagship waypoints:', error);
        throw error;
      }

      // Map the response to our interface
      return (data || []).map((wp: any) => ({
        id: wp.id,
        waypoint_number: wp.waypoint_number,
        name: wp.name,
        latitude: wp.latitude_approx,
        longitude: wp.longitude_approx,
        arrived_at: wp.arrived_at,
        waypoint_type: wp.waypoint_type,
        state_code: wp.state_code,
        is_highlight: wp.is_highlight,
      })) as FlagshipWaypoint[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useHighlightWaypoints() {
  return useQuery({
    queryKey: ['flagship-waypoints-highlights'],
    queryFn: async () => {
      // Use secure RPC function and filter highlights client-side
      const { data, error } = await supabase
        .rpc('get_public_flagship_waypoints');

      if (error) {
        console.error('Error fetching highlight waypoints:', error);
        throw error;
      }

      // Filter highlights and map to our interface
      return (data || [])
        .filter((wp: any) => wp.is_highlight)
        .map((wp: any) => ({
          id: wp.id,
          waypoint_number: wp.waypoint_number,
          name: wp.name,
          latitude: wp.latitude_approx,
          longitude: wp.longitude_approx,
          arrived_at: wp.arrived_at,
          waypoint_type: wp.waypoint_type,
          state_code: wp.state_code,
          is_highlight: wp.is_highlight,
        })) as FlagshipWaypoint[];
    },
    staleTime: 5 * 60 * 1000,
  });
}