import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useFlagshipGating() {
  const { user } = useAuth();
  const [hasViewedFlagship, setHasViewedFlagship] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function checkFlagshipStatus() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_viewed_flagship')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setHasViewedFlagship(data?.has_viewed_flagship || false);
      } catch (error) {
        console.error('Error checking flagship status:', error);
        setHasViewedFlagship(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkFlagshipStatus();
  }, [user]);

  const markFlagshipViewed = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ has_viewed_flagship: true })
        .eq('user_id', user.id);
      
      setHasViewedFlagship(true);
    } catch (error) {
      console.error('Error updating flagship status:', error);
    }
  };

  return {
    hasViewedFlagship,
    isLoading,
    markFlagshipViewed
  };
}
