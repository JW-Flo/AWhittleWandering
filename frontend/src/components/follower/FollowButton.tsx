import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FollowButtonProps = {
  journeyId: string;
  apiBaseUrl: string;
};

type FollowSettingsResponse =
  | { ok: true; following: boolean; prefs?: Record<string, unknown> }
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setMessage(null);
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
    setIsLoading(true);
    setMessage(null);
    try {
      const path = following ? "unfollow" : "follow";
      const res = await fetch(
        `${apiBaseUrl}/api/v1/journeys/${encodeURIComponent(safeId)}/${path}`,
        { method: "POST" }
      );

      if (res.status === 401 || res.status === 403) {
        setMessage("Sign in to follow this journey (notifications require an account).");
        return;
      }

      if (!res.ok) {
        setMessage(`Unable to ${following ? "unfollow" : "follow"} right now.`);
        return;
      }

      setFollowing(!following);
      setMessage(following ? "Unfollowed." : "Following—updates will appear here as moments are posted.");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant={following ? "outline" : "default"} onClick={toggleFollow} disabled={isLoading}>
          {following ? "Following" : "Follow"}
        </Button>
        {following && <Badge variant="outline">Notifications enabled</Badge>}
      </div>
      {message && (
        <output className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
          {message}
        </output>
      )}
    </div>
  );
};

export default FollowButton;

