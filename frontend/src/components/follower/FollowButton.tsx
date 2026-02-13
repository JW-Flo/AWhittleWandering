import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, UserMinus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FollowButtonProps = {
  journeyId: string;
  apiBaseUrl: string;
};

type FollowSettingsResponse =
  | { ok: true; following: boolean; followerCount?: number; prefs?: Record<string, unknown> }
  | { ok: false; error?: string };

type FollowResponse =
  | { ok: true; following: boolean; followerCount?: number }
  | { ok: false; error?: string };

const safeJourneyId = (id: string) => {
  // External input is untrusted; keep the key conservative for API calls.
  // This is not a security boundary (backend must still validate).
  const trimmed = id.trim();
  if (!trimmed) return "live";
  return trimmed;
};

const FollowButton: React.FC<FollowButtonProps> = ({ journeyId, apiBaseUrl }) => {
  const safeId = useMemo(() => safeJourneyId(journeyId), [journeyId]);
  const [following, setFollowing] = useState<boolean>(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/v1/journeys/${encodeURIComponent(safeId)}/follow/settings`,
          { method: "GET" }
        );
        if (res.status === 401 || res.status === 403) {
          // Not signed in; follower flow can still be browsed.
          if (!cancelled) setFollowing(false);
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as FollowSettingsResponse;
        if (!cancelled && json && "ok" in json && json.ok) {
          setFollowing(!!json.following);
          if (typeof json.followerCount === "number") {
            setFollowerCount(json.followerCount);
          }
        }
      } catch {
        // Soft-fail: do not block reading the journey.
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, safeId]);

  const toggleFollow = async () => {
    const wasFollowing = following;
    setIsLoading(true);

    // Optimistic update
    setFollowing(!wasFollowing);
    setFollowerCount(prev => wasFollowing ? Math.max(0, prev - 1) : prev + 1);

    try {
      const path = wasFollowing ? "unfollow" : "follow";
      const res = await fetch(
        `${apiBaseUrl}/api/v1/journeys/${encodeURIComponent(safeId)}/${path}`,
        { method: "POST" }
      );

      if (res.status === 401 || res.status === 403) {
        // Revert optimistic update
        setFollowing(wasFollowing);
        setFollowerCount(prev => wasFollowing ? prev + 1 : Math.max(0, prev - 1));
        toast({
          title: "Sign in required",
          description: "Sign in to follow this journey (notifications require an account).",
          variant: "destructive",
        });
        return;
      }

      if (!res.ok) {
        // Revert optimistic update
        setFollowing(wasFollowing);
        setFollowerCount(prev => wasFollowing ? prev + 1 : Math.max(0, prev - 1));
        toast({
          title: "Something went wrong",
          description: `Unable to ${wasFollowing ? "unfollow" : "follow"} right now. Please try again.`,
          variant: "destructive",
        });
        return;
      }

      // Update with actual count from server
      const json = (await res.json()) as FollowResponse;
      if (json && "ok" in json && json.ok && typeof json.followerCount === "number") {
        setFollowerCount(json.followerCount);
      }

      // Success toast
      toast({
        title: wasFollowing ? "Unfollowed" : "Following",
        description: wasFollowing
          ? "You've unfollowed this journey."
          : "You're now following this journey — updates will appear as moments are posted.",
      });
    } catch {
      // Revert optimistic update
      setFollowing(wasFollowing);
      setFollowerCount(prev => wasFollowing ? prev + 1 : Math.max(0, prev - 1));
      toast({
        title: "Network error",
        description: "Could not reach the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showUnfollow = following && isHovered && !isLoading;

  const buttonVariant = showUnfollow
    ? "destructive"
    : following
      ? "outline"
      : "default";

  const buttonLabel = isLoading
    ? following
      ? "Following"
      : "Follow"
    : showUnfollow
      ? "Unfollow"
      : following
        ? "Following"
        : "Follow";

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={buttonVariant}
        onClick={toggleFollow}
        disabled={isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="min-w-[110px] transition-colors"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : showUnfollow ? (
          <UserMinus className="w-4 h-4 mr-1.5" />
        ) : following ? (
          <Check className="w-4 h-4 mr-1.5" />
        ) : null}
        {buttonLabel}
      </Button>
      {followerCount > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {followerCount}
        </Badge>
      )}
      {following && !showUnfollow && (
        <Badge variant="outline">Notifications enabled</Badge>
      )}
    </div>
  );
};

export default FollowButton;
