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
import { MapPin, BookOpen, Calendar, MessageSquare, Brain, Zap, TrendingUp, ChevronRight } from "lucide-react";

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

interface StateRow {
  state_name: string;
  state_code: string | null;
  first_visited_date: string | null;
  visit_count: number;
  total_miles_in_state: number;
  is_current_state: number;
}

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  location: string | null;
  mood: string;
  entry_type: string;
  auto_generated: number;
  created_at: string;
}

const safePercent = (num?: number, den?: number) => {
  if (!num || !den || !Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0;
  return Math.max(0, Math.min(100, (num / den) * 100));
};

// All 48 contiguous US states for the progress grid
const CONTIGUOUS_STATES = [
  "Alabama","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Idaho","Illinois","Indiana",
  "Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana",
  "Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York",
  "North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah",
  "Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const StatesProgress: React.FC<{ visited: StateRow[] }> = ({ visited }) => {
  const visitedNames = new Set(visited.map(s => s.state_name));
  const currentState = visited.find(s => s.is_current_state)?.state_name;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {CONTIGUOUS_STATES.map(state => {
          const isCurrent = state === currentState;
          const isVisited = visitedNames.has(state);
          return (
            <div
              key={state}
              title={state}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors
                ${isCurrent
                  ? "bg-primary text-primary-foreground ring-1 ring-primary"
                  : isVisited
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground/40"
                }`}
            >
              {state.slice(0, 2).toUpperCase()}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {visitedNames.size} of 48 contiguous states visited
        {currentState ? ` — currently in ${currentState}` : ""}
      </p>
    </div>
  );
};

const JournalIcon: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
  if (entry.entry_type === 'charging_started' || entry.entry_type === 'charging_completed')
    return <Zap className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />;
  if (entry.entry_type === 'efficiency_milestone')
    return <TrendingUp className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />;
  if (entry.auto_generated)
    return <Brain className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />;
  return <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
};

function updateMetaTags(data: UnifiedData) {
  const state = data.currentStatus?.location?.state;
  const miles = data.overview?.totalMiles;
  const states = data.overview?.statesVisited;
  const parts: string[] = [];
  if (state && state !== "Unknown") parts.push(`Currently in ${state}`);
  if (typeof miles === "number" && miles > 0) parts.push(`${Math.round(miles).toLocaleString()} miles`);
  if (typeof states === "number" && states > 0) parts.push(`across ${states} states`);
  const desc = parts.length > 0 ? parts.join(". ") + "." : "48 State Tesla Road Trip — follow along live.";
  const title = "A Whittle Wandering — 48 State Tesla Road Trip";
  document.title = title;
  const setMeta = (attr: string, key: string, content: string) => {
    const el = document.querySelector(`meta[${attr}="${key}"]`);
    if (el) el.setAttribute("content", content);
  };
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", desc);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", desc);
  setMeta("name", "description", desc);
}

const FollowerView: React.FC = () => {
  useDocumentTitle("Journey");
  const { id } = useParams();
  const [data, setData] = useState<UnifiedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<{ mapboxToken?: string | null } | null>(null);
  const [states, setStates] = useState<StateRow[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [showAllJournal, setShowAllJournal] = useState(false);

  const journeyId = id && id !== "live" ? id : "continental-usa-2025";

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const suffix = id && id !== "live" ? `/${id}` : "";
        const [dataRes, cfgRes, statesRes, journalRes] = await Promise.allSettled([
          fetch(`${api.baseUrl}/api/v1/unified-data${suffix}`),
          fetch(`${api.baseUrl}/api/v1/config`),
          fetch(`${api.baseUrl}/api/v1/unified-data/${journeyId}/states`),
          fetch(`${api.baseUrl}/api/v1/journal/${journeyId}`),
        ]);

        if (cancelled) return;

        if (dataRes.status === "fulfilled" && dataRes.value.ok) {
          const json = await dataRes.value.json() as UnifiedData;
          setData(json);
          updateMetaTags(json);
        } else {
          throw new Error("Unable to load journey");
        }

        if (cfgRes.status === "fulfilled" && cfgRes.value.ok) {
          setAppConfig(await cfgRes.value.json() as any);
        }
        if (statesRes.status === "fulfilled" && statesRes.value.ok) {
          const s = await statesRes.value.json() as { ok: boolean; states: StateRow[] };
          if (s.ok) setStates(s.states);
        }
        if (journalRes.status === "fulfilled" && journalRes.value.ok) {
          const j = await journalRes.value.json() as { ok: boolean; entries: JournalEntry[] };
          if (j.ok) setJournal(j.entries);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load journey");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id, journeyId]);

  const journeyTitle = data?.overview?.tripName || "A Whittle Wandering";
  const locationLabel = data?.currentStatus?.location?.state;
  const city = data?.currentStatus?.location?.city;
  const days = data?.overview?.daysElapsed;
  const statesVisited = data?.overview?.statesVisited;
  const totalStates = data?.overview?.totalStates;
  const totalMiles = data?.overview?.totalMiles;
  const arcPct = useMemo(() => safePercent(statesVisited, totalStates), [statesVisited, totalStates]);
  const lastUpdate = data?.currentStatus?.location?.lastUpdate
    ? new Date(data.currentStatus.location.lastUpdate).toLocaleString()
    : undefined;

  const routeLocations = useMemo(() => {
    if (data?.routePath && data.routePath.length > 0) {
      return data.routePath.filter(
        p => typeof p.lat === "number" && typeof p.lng === "number" && (p.lat !== 0 || p.lng !== 0)
      );
    }
    const drives = [...(data?.timeline?.drives || [])].sort((a, b) =>
      new Date(a.startTime || a.date).getTime() - new Date(b.startTime || b.date).getTime()
    );
    const points: RoutePoint[] = [];
    for (const drive of drives) {
      if ((drive as any).startCoordinates?.lat) points.push({ lat: (drive as any).startCoordinates.lat, lng: (drive as any).startCoordinates.lng, timestamp: drive.startTime || drive.date });
      if ((drive as any).endCoordinates?.lat) points.push({ lat: (drive as any).endCoordinates.lat, lng: (drive as any).endCoordinates.lng, timestamp: drive.endTime || drive.date });
    }
    return points;
  }, [data]);

  const vehicleLocation = useMemo(() => {
    const loc = data?.currentStatus?.location as any;
    if (!loc?.coordinates || (loc.coordinates.lat === 0 && loc.coordinates.lng === 0)) return undefined;
    return { latitude: loc.coordinates.lat, longitude: loc.coordinates.lng, heading: data?.currentStatus?.vehicle?.heading ?? 0, speed: data?.currentStatus?.vehicle?.speed ?? 0 };
  }, [data]);

  const hasJourneyData = !!(data && (
    (data.overview?.totalMiles && data.overview.totalMiles > 0) ||
    (data.overview?.statesVisited && data.overview.statesVisited > 0) ||
    (data.timeline?.drives && data.timeline.drives.length > 0)
  ));

  const heroLocation = city && city !== "Unknown" && locationLabel && locationLabel !== "Unknown"
    ? `${city}, ${locationLabel}` : locationLabel && locationLabel !== "Unknown" ? locationLabel : null;

  const visibleJournal = showAllJournal ? journal : journal.slice(0, 4);

  return (
    <div className="journey-typography min-h-screen bg-background text-foreground overflow-y-auto overflow-x-hidden">
      <header className="container mx-auto px-4 pt-8 sm:pt-10 pb-4 sm:pb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Following</p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight truncate" data-testid="journey-title">
              {journeyTitle}
            </h1>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16 space-y-8">
        {/* === MAP === */}
        {!isLoading && (routeLocations.length > 0 || vehicleLocation) && (
          <section>
            <Card className="border-border/60 overflow-hidden">
              <CardContent className="h-[50vh] min-h-[280px] max-h-[500px] p-0" style={{ height: '50vh', minHeight: '280px' }}>
                <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading map…</div>}>
                  <LazyTeslaMap
                    vehicleLocation={vehicleLocation}
                    mapboxToken={appConfig?.mapboxToken || undefined}
                    onTokenChange={() => {}}
                    routeLocations={routeLocations}
                    readOnly
                  />
                </Suspense>
              </CardContent>
            </Card>
          </section>
        )}

        {/* === HERO === */}
        <section>
          <Card className="hero-card" data-testid="hero-card">
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl leading-tight font-semibold tracking-tight">
                {heroLocation
                  ? `Day ${days ?? "—"} — ${heroLocation}`
                  : hasJourneyData ? "Between trips" : "Journey in progress"}
              </CardTitle>
              <p className="mt-3 text-sm md:text-base text-foreground/80 leading-relaxed max-w-2xl">
                Orientation, not surveillance. This view is here to help you feel present—where the traveler
                is in the arc of the trip, what's unfolding, and what moments matter.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {typeof statesVisited === "number" && typeof totalStates === "number" && (
                  <Badge variant="secondary" data-testid="states-badge">{statesVisited} of {totalStates} states</Badge>
                )}
                {typeof totalMiles === "number" && totalMiles > 0 && (
                  <Badge variant="secondary" data-testid="miles-badge">{Math.round(totalMiles).toLocaleString()} miles</Badge>
                )}
                {typeof days === "number" && days > 0 && (
                  <Badge variant="outline" data-testid="days-badge">Day {days}</Badge>
                )}
                {lastUpdate && <Badge variant="outline">Updated {lastUpdate}</Badge>}
              </div>
              <div className="mt-5">
                <FollowButton journeyId={id || "live"} apiBaseUrl={api.baseUrl} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-foreground/10 overflow-hidden">
                  <div className="h-full rounded-full bg-foreground/60" style={{ width: `${arcPct}%`, transition: "width 600ms ease" }} />
                </div>
                <p className="mt-2 text-xs text-foreground/70">
                  The arc so far{typeof arcPct === "number" ? `: ${Math.round(arcPct)}%` : ""}.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* === LOADING SKELETON === */}
        {isLoading && (
          <section className="space-y-4">
            <Card className="animate-pulse"><CardContent className="p-0 h-[40vh] min-h-[240px] bg-muted rounded-lg" /></Card>
            <Card className="story-card animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
              </CardContent>
            </Card>
          </section>
        )}

        {/* === ERROR === */}
        {!isLoading && error && (
          <Card className="story-card border-destructive/20">
            <CardContent className="p-6 space-y-3">
              <p className="text-sm font-medium">This journey is temporarily unavailable.</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Try again</Button>
            </CardContent>
          </Card>
        )}

        {/* === EMPTY STATE === */}
        {!isLoading && !error && data && !hasJourneyData && (
          <Card className="story-card">
            <CardContent className="p-6">
              <EmptyState icon={<MapPin className="h-8 w-8" />} title="The journey hasn't started yet. Check back for live updates!" description="When the traveler sets out, the arc and moments will appear here." />
            </CardContent>
          </Card>
        )}

        {/* === STATS GRID === */}
        {hasJourneyData && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="stats-grid">
            {[
              { label: "Miles driven", value: typeof totalMiles === "number" ? Math.round(totalMiles).toLocaleString() : "—" },
              { label: "States visited", value: statesVisited !== undefined ? `${statesVisited} / 48` : "—" },
              { label: "Days on road", value: typeof days === "number" ? String(days) : "—" },
              { label: "Drives logged", value: data?.timeline?.drives?.length ? data.timeline.drives.length.toLocaleString() : "—" },
            ].map(({ label, value }) => (
              <Card key={label} className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-mono font-semibold mt-1">{value}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {/* === STATES PROGRESS === */}
        {states.length > 0 && (
          <section>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">States visited</CardTitle>
              </CardHeader>
              <CardContent>
                <StatesProgress visited={states} />
              </CardContent>
            </Card>
          </section>
        )}

        {/* === JOURNAL === */}
        {journal.length > 0 && (
          <section data-testid="journal-section">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    Journey Journal
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{journal.length} entries</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {visibleJournal.map(entry => (
                  <div key={entry.id} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2 mb-1.5">
                      <JournalIcon entry={entry} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{entry.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          <Calendar className="w-3 h-3 inline" />
                          {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {entry.location && <><MapPin className="w-3 h-3 inline ml-1" />{entry.location}</>}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.content}</p>
                  </div>
                ))}
                {journal.length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full gap-1 text-xs" onClick={() => setShowAllJournal(!showAllJournal)}>
                    {showAllJournal ? "Show less" : `Show ${journal.length - 4} more entries`}
                    <ChevronRight className={`w-3 h-3 transition-transform ${showAllJournal ? "rotate-90" : ""}`} />
                  </Button>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* === NARRATIVE === */}
        <JourneyNarrative data={data} />
      </main>
    </div>
  );
};

export default FollowerView;
