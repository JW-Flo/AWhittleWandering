import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserCheck, Bell, BellOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FollowButtonProps {
  journeyId: string;
  journeyOwnerId: string;
  className?: string;
}

export default function FollowButton({ journeyId, journeyOwnerId, className = '' }: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) checkFollowStatus();
    else setLoading(false);
  }, [user, journeyId]);

  const checkFollowStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('journey_followers')
        .select('approved')
        .eq('journey_id', journeyId)
        .eq('follower_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setIsFollowing(true);
        setIsApproved(data.approved ?? false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please sign in to follow journeys');
      return;
    }

    setActionLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('journey_followers')
          .delete()
          .eq('journey_id', journeyId)
          .eq('follower_user_id', user.id);

        if (error) throw error;
        setIsFollowing(false);
        setIsApproved(false);
        toast.success('Unfollowed journey');
      } else {
        // Follow
        const { error } = await supabase
          .from('journey_followers')
          .insert({
            journey_id: journeyId,
            follower_user_id: user.id,
            approved: true // Auto-approve for now, can be changed to require approval
          });

        if (error) throw error;
        setIsFollowing(true);
        setIsApproved(true);
        toast.success('Now following this journey!');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    } finally {
      setActionLoading(false);
    }
  };

  // Don't show follow button for journey owner
  if (user?.id === journeyOwnerId) {
    return null;
  }

  if (loading) {
    return (
      <Button variant="outline" disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="secondary"
          onClick={handleFollow}
          disabled={actionLoading}
          className="gap-2"
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              Following
            </>
          )}
        </Button>
        {!isApproved && (
          <Badge variant="outline" className="text-xs">
            Pending
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={actionLoading}
      className={`gap-2 ${className}`}
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow Journey
        </>
      )}
    </Button>
  );
}
