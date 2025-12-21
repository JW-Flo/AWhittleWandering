import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, X, Users, Loader2, UserCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Follower {
  id: string;
  follower_user_id: string;
  approved: boolean;
  created_at: string;
  profile?: {
    display_name: string | null;
    full_name: string | null;
  };
}

interface FollowerApprovalManagerProps {
  journeyId: string;
  journeyName: string;
}

export function FollowerApprovalManager({ journeyId, journeyName }: FollowerApprovalManagerProps) {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchFollowers();
  }, [user, journeyId]);

  const fetchFollowers = async () => {
    try {
      const { data, error } = await supabase
        .from('journey_followers')
        .select('id, follower_user_id, approved, created_at')
        .eq('journey_id', journeyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each follower
      const followersWithProfiles = await Promise.all(
        (data || []).map(async (follower) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, full_name')
            .eq('user_id', follower.follower_user_id)
            .maybeSingle();
          
          return { ...follower, profile: profile || undefined };
        })
      );

      setFollowers(followersWithProfiles);
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast.error('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (followerId: string, approve: boolean) => {
    setActionLoading(followerId);
    try {
      const { error } = await supabase
        .from('journey_followers')
        .update({ approved: approve })
        .eq('id', followerId);

      if (error) throw error;

      setFollowers(prev => 
        prev.map(f => f.id === followerId ? { ...f, approved: approve } : f)
      );

      toast.success(approve ? 'Follower approved' : 'Follower request rejected');
    } catch (error) {
      console.error('Error updating follower:', error);
      toast.error('Failed to update follower status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (followerId: string) => {
    setActionLoading(followerId);
    try {
      const { error } = await supabase
        .from('journey_followers')
        .delete()
        .eq('id', followerId);

      if (error) throw error;

      setFollowers(prev => prev.filter(f => f.id !== followerId));
      toast.success('Follower removed');
    } catch (error) {
      console.error('Error removing follower:', error);
      toast.error('Failed to remove follower');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = followers.filter(f => !f.approved).length;
  const approvedCount = followers.filter(f => f.approved).length;

  const getDisplayName = (follower: Follower) => {
    return follower.profile?.display_name || 
           follower.profile?.full_name || 
           `User ${follower.follower_user_id.slice(0, 8)}`;
  };

  const getInitials = (follower: Follower) => {
    const name = getDisplayName(follower);
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Follower Management
        </CardTitle>
        <CardDescription>
          Manage who can follow and view "{journeyName}"
        </CardDescription>
        <div className="flex gap-2 mt-2">
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-600/30">
              <Clock className="w-3 h-3 mr-1" />
              {pendingCount} pending
            </Badge>
          )}
          <Badge variant="outline" className="text-green-600 border-green-600/30">
            <UserCheck className="w-3 h-3 mr-1" />
            {approvedCount} approved
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {followers.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No follow requests yet
          </p>
        ) : (
          <div className="space-y-3">
            {/* Pending requests first */}
            {followers.filter(f => !f.approved).map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-amber-600/20 text-amber-700 text-xs">
                      {getInitials(follower)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{getDisplayName(follower)}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDistanceToNow(new Date(follower.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-green-600/30 text-green-600 hover:bg-green-600/10"
                    onClick={() => handleApproval(follower.id, true)}
                    disabled={actionLoading === follower.id}
                  >
                    {actionLoading === follower.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(follower.id)}
                    disabled={actionLoading === follower.id}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Approved followers */}
            {followers.filter(f => f.approved).map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-600/20 text-green-700 text-xs">
                      {getInitials(follower)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{getDisplayName(follower)}</p>
                    <p className="text-xs text-muted-foreground">
                      Approved • Following since {formatDistanceToNow(new Date(follower.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(follower.id)}
                  disabled={actionLoading === follower.id}
                >
                  {actionLoading === follower.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Remove'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
