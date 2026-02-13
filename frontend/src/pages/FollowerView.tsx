import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-config";
import JourneyNarrative, { type NarrativeUnifiedData } from "@/components/follower/JourneyNarrative";
import FollowButton from "@/components/follower/FollowButton";
import EmptyState from "@/components/common/EmptyState";
import { MapPin } from "lucide-react";

const LazyTeslaMap = lazy(() => import("@/components/LazyTeslaMap"));

type RoutePoint = { lat: number; lng: number; timestamp: string };

type UnifiedData = NarrativeUnifiedData & {
  overview?: NarrativeUnifiedData["overview"] & { tripName?: string; totalMiles?: number };
  currentStatus?: NarrativeUnifiedData["currentStatus"] & {
    battery?: { level?: number; range?: number; charging?: string };
    vehicle?: { speed?: number; heading?: number };
  };
  routePath?: RoutePoint[];
};

const safePercent = (num?: number, den?: number) => {
  if (!num || !den) return 0;
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0;
  return Math.max(0, Math.min(100, (num / den) * 100));
};

const formatDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleString();
};

const FollowerView: React.FC = () => {
  useDocumentTitle("Journey");
  const { id } = useParams();
  const [data, setData] = useState<UnifiedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<{ mapboxToken?: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // "live" is a virtual alias for the default active journey — omit it from the URL
        // so the backend returns the default journey data.
        const suffix = id && id !== "live" ? `/${id}` : "";
        const res = await fetch(`${api.baseUrl}/api/v1/unified-data${suffix}`, { method: "GET" });
        if (!res.ok) throw new Error(`Unable to load journey (${res.status})`);
        const json = (await res.json()) as unknown;
        if (cancelled) return;
        setData((json ?? null) as UnifiedData | null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unable to load journey");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch Mapbox token for the map
  useEffect(() => {
    let cancelled = false;
    fetch(`${api.baseUrl}/api/v1/config`)
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => { if (!cancelled && cfg) setAppConfig(cfg as any); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const journeyTitle = data?.overview?.tripName || "A Whittle Wandering";
  const locationLabel = data?.currentStatus?.location?.state;
  const days = data?.overview?.daysElapsed;
  const statesVisited = data?.overview?.statesVisited;
  const totalStates = data?.overview?.totalStates;
  const totalMiles = data?.overview?.totalMiles;
  const arcPct = useMemo(() => safePercent(statesVisited, totalStates), [statesVisited, totalStates]);
  const lastUpdate = formatDate(data?.currentStatus?.location?.lastUpdate);

  const routeLocations = useMemo(() => {
    if (data?.routePath && data.routePath.length > 0) {
      return data.routePath.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number" && p.lat !== 0 && p.lng !== 0
      );
    }
    return [];
  }, [data]);

  const vehicleLocation = useMemo(() => {
    const loc = data?.currentStatus?.location;
    if (!loc || !loc.coordinates || (loc.coordinates.lat === 0 && loc.coordinates.lng === 0)) return undefined;
    return {
      latitude: loc.coordinates.lat,
      longitude: loc.coordinates.lng,
      heading: data?.currentStatus?.vehicle?.heading ?? 0,
      speed: data?.currentStatus?.vehicle?.speed ?? 0,
    };
  }, [data]);

  const hasJourneyData = !!(data && (
    (data.overview?.totalMiles && data.overview.totalMiles > 0) ||
    (data.overview?.statesVisited && data.overview.statesVisited > 0) ||
    (data.timeline?.drives && data.timeline.drives.length > 0)
  ));

  return (
    <div className="journey-typography min-h-screen bg-background text-foreground overflow-y-auto">
      <header className="container mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Following</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight truncate">
              {journeyTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/">Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        {/* Hero / Current chapter */}
        <section className="mb-12">
          <Card className="hero-card">
            <CardHeader className="relative z-10">
              <CardTitle className="text-3xl md:text-4xl leading-tight font-semibold tracking-tight">
                {locationLabel && locationLabel !== "Unknown"
                  ? `Day ${days ?? "—"} — ${locationLabel}`
                  : "Journey in progress"}
              </CardTitle>
              <p className="mt-3 text-sm md:text-base text-foreground/80 leading-relaxed max-w-2xl">
                Orientation, not surveillance. This view is here to help you feel present—where the traveler
                is in the arc of the trip, what's unfolding, and what moments matter.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {typeof statesVisited === "number" && typeof totalStates === "number" && (
                  <Badge variant="secondary">
                    {statesVisited} of {totalStates} states
                  </Badge>
                )}
                {typeof totalMiles === "number" && totalMiles > 0 && (
                  <Badge variant="secondary">
                    {Math.round(totalMiles).toLocaleString()} miles
                  </Badge>
                )}
                {typeof data?.currentStatus?.battery?.level === "number" && data.currentStatus.battery.level > 0 && (
                  <Badge variant="outline">Battery {Math.round(data.currentStatus.battery.level)}%</Badge>
                )}
                {lastUpdate && <Badge variant="outline">Updated {lastUpdate}</Badge>}
              </div>
              <div className="mt-6">
                <FollowButton journeyId={id || "live"} apiBaseUrl={api.baseUrl} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <div className="mt-6">
                <div className="h-2 w-full rounded-full bg-foreground/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/60"
                    style={{ width: `${arcPct}%`, transition: "width 600ms ease" }}
                  />
                </div>
                <p className="mt-2 text-xs text-foreground/70">
                  The arc so far{typeof arcPct === "number" ? `: ${Math.round(arcPct)}%` : ""}.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Live map */}
        {!isLoading && hasJourneyData && (routeLocations.length > 0 || vehicleLocation) && (
          <section className="mb-10">
            <Card className="border-border/60 overflow-hidden">
              <CardContent className="h-[400px] p-0">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      Loading map…
                    </div>
                  }
                >
                  <LazyTeslaMap
                    vehicleLocation={vehicleLocation}
                    mapboxToken={appConfig?.mapboxToken || undefined}
                    onTokenChange={() => {}}
                    routeLocations={routeLocations}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <section className="mb-10 space-y-4">
            <Card className="story-card animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
              </CardContent>
            </Card>
            <Card className="story-card animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-20 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          </section>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <section className="mb-10">
            <Card className="story-card border-destructive/20">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm font-medium">This journey is temporarily unavailable.</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Empty data state — backend returned skeleton data */}
        {!isLoading && !error && data && !hasJourneyData && (
          <section className="mb-10">
            <Card className="story-card">
              <CardContent className="p-6">
                <EmptyState
                  icon={<MapPin className="h-8 w-8" />}
                  title="The journey hasn't started yet. Check back for live updates!"
                  description="When the traveler sets out, the arc and moments will appear here."
                />
              </CardContent>
            </Card>
          </section>
        )}

        {/* Narrative */}
        <JourneyNarrative data={data} />
      </main>
    </div>
  );
};

export default FollowerView;
