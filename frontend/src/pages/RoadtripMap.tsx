import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Zap,
  Gauge,
  ChevronDown,
  ChevronUp,
  Loader2,
  Battery,
  Thermometer,
  BatteryCharging,
  DollarSign,
  Route,
  Users,
} from "lucide-react";
import {
  parseDriveCsv,
  extractRoute,
  extractStops,
  simplifyRoute,
  type DriveRow,
  type RoutePoint,
  type TripStop,
} from "@/data/parseDriveData";
import {
  loadChargingSessions,
  loadBatteryTimeline,
  loadClimateTimeline,
  loadDailyCharging,
  loadTripItinerary,
  loadTripSummary,
  type ChargingSession,
  type BatterySample,
  type ClimateSample,
  type DailyCharging,
  type TripItineraryEntry,
  type TripSummary,
} from "@/data/parseTelemetry";
import type mapboxgl from "mapbox-gl";
import { dynamicConfig } from "@/lib/dynamic-config";

// Lazy load mapbox-gl
let mapboxPromise: Promise<typeof mapboxgl> | null = null;
function getMapbox(): Promise<typeof mapboxgl> {
  if (!mapboxPromise) {
    mapboxPromise = import("mapbox-gl").then((m) => {
      return m.default || m;
    });
  }
  return mapboxPromise;
}

const RoadtripMap = () => {
  useDocumentTitle("AWW Summer 2025 Roadtrip Map");

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mbRef = useRef<typeof mapboxgl | null>(null);

  const [drives, setDrives] = useState<DriveRow[]>([]);
  const [chargingSessions, setChargingSessions] = useState<ChargingSession[]>([]);
  const [batteryTimeline, setBatteryTimeline] = useState<BatterySample[]>([]);
  const [climateTimeline, setClimateTimeline] = useState<ClimateSample[]>([]);
  const [dailyCharging, setDailyCharging] = useState<DailyCharging[]>([]);
  const [itinerary, setItinerary] = useState<TripItineraryEntry[]>([]);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [stopsExpanded, setStopsExpanded] = useState(false);
  const [selectedStop, setSelectedStop] = useState<TripStop | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showChargers, setShowChargers] = useState(true);

  // Fetch all data in parallel
  useEffect(() => {
    Promise.all([
      fetch("/data/drives.csv").then((r) => {
        if (!r.ok) throw new Error("Failed to load drive data");
        return r.text();
      }).then(parseDriveCsv),
      loadChargingSessions().catch(() => []),
      loadBatteryTimeline().catch(() => []),
      loadClimateTimeline().catch(() => []),
      loadDailyCharging().catch(() => []),
      loadTripItinerary().catch(() => []),
      loadTripSummary().catch(() => null),
    ])
      .then(([parsedDrives, sessions, battery, climate, daily, itin, summary]) => {
        setDrives(parsedDrives);
        setChargingSessions(sessions);
        setBatteryTimeline(battery);
        setClimateTimeline(climate);
        setDailyCharging(daily);
        setItinerary(itin);
        setTripSummary(summary);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Derived data
  const route = useMemo(() => (drives.length ? simplifyRoute(extractRoute(drives), 600) : []), [drives]);
  const stops = useMemo(() => (drives.length ? extractStops(drives, 60, 5) : []), [drives]);

  const stats = useMemo(() => {
    if (!drives.length) return null;
    const first = drives[0];
    const last = drives[drives.length - 1];
    const totalMiles = tripSummary?.totalMiles ?? Math.round(last.endOdometer - first.startOdometer);
    const totalEnergy = tripSummary?.totalEnergyKwh ?? Math.round(drives.reduce((s, d) => s + d.energyKwh, 0));
    const stateSet = new Set<string>();
    for (const d of drives) {
      const s1 = extractStateFromLocation(d.startLocation);
      const s2 = extractStateFromLocation(d.endLocation);
      if (s1) stateSet.add(s1);
      if (s2) stateSet.add(s2);
    }
    const totalCost = tripSummary?.totalCostUsd ?? chargingSessions.reduce((s, c) => s + c.costUsd, 0);
    return {
      totalMiles,
      totalDrives: drives.length,
      totalEnergy,
      statesCount: tripSummary?.statesVisited ?? stateSet.size,
      startDate: first.startedAt.split(" ")[0],
      endDate: last.endedAt.split(" ")[0],
      tripDays: tripSummary?.tripDurationDays ?? 0,
      chargingSessions: chargingSessions.length,
      totalCost: Math.round(totalCost),
      costPerMile: tripSummary?.costPerMile ?? (totalMiles > 0 ? totalCost / totalMiles : 0),
      peopleMet: tripSummary?.peopleMet ?? 0,
    };
  }, [drives, chargingSessions, tripSummary]);

  // Battery chart data
  const batteryChartData = useMemo(() => {
    if (!batteryTimeline.length) return [];
    const step = Math.max(1, Math.floor(batteryTimeline.length / 800));
    return batteryTimeline
      .filter((_, i) => i % step === 0)
      .map((s) => ({
        date: formatChartDate(s.t),
        pct: s.pct,
        range: s.range,
        charging: s.state === "Charging" ? s.pct : null,
      }));
  }, [batteryTimeline]);

  // Climate chart data
  const climateChartData = useMemo(() => {
    if (!climateTimeline.length) return [];
    const step = Math.max(1, Math.floor(climateTimeline.length / 600));
    return climateTimeline
      .filter((_, i) => i % step === 0)
      .map((s) => ({
        date: formatChartDate(s.t),
        outside: s.outsideF,
        inside: s.insideF,
      }));
  }, [climateTimeline]);

  // Daily cost chart
  const dailyCostChartData = useMemo(() => {
    return dailyCharging.map((d) => ({
      date: formatChartDate(d.date),
      cost: d.costUsd,
      energy: d.energyKwh,
      sessions: d.sessions,
    }));
  }, [dailyCharging]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!route.length) return;
    let cancelled = false;

    (async () => {
      const token = await dynamicConfig.getMapboxToken().catch(() => {
        const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (envToken) return envToken as string;
        throw new Error("No Mapbox token");
      });
      if (cancelled) return;

      const mb = await getMapbox();
      if (cancelled) return;
      mbRef.current = mb;
      mb.accessToken = token;

      if (!mapContainer.current) return;

      const map = new mb.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-98.5, 39.8],
        zoom: 3.5,
        pitch: 0,
      });
      mapRef.current = map;

      map.addControl(new mb.NavigationControl({ visualizePitch: false }), "bottom-right");

      map.on("load", () => {
        if (cancelled) return;
        addRouteLayer(map, route);
        addStopMarkers(map, mb, stops);
        if (showChargers) addChargingMarkers(map, mb, chargingSessions);
        fitToRoute(map, route);
        setMapReady(true);
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, stops]);

  // Toggle charging markers
  useEffect(() => {
    const map = mapRef.current;
    const mb = mbRef.current;
    if (!map || !mb || !mapReady) return;

    const existing = document.querySelectorAll("[data-charging-marker]");
    existing.forEach((el) => el.remove());

    if (showChargers) {
      addChargingMarkers(map, mb, chargingSessions);
    }
  }, [showChargers, mapReady, chargingSessions]);

  const flyToStop = useCallback((stop: TripStop) => {
    setSelectedStop(stop);
    mapRef.current?.flyTo({ center: [stop.lng, stop.lat], zoom: 11, duration: 1200 });
  }, []);

  const flyToSession = useCallback((session: ChargingSession) => {
    if (session.lat && session.lng) {
      mapRef.current?.flyTo({ center: [session.lng, session.lat], zoom: 13, duration: 1200 });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading 15,000+ miles of drive data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="max-w-sm">
          <CardContent className="p-6 text-center space-y-2">
            <p className="font-medium">Failed to load drive data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Map area */}
      <div className="relative min-h-0" style={{ flex: panelOpen ? "1 1 55%" : "1 1 100%" }}>
        <div ref={mapContainer} className="absolute inset-0" />

        {mapReady && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
        )}

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button asChild variant="secondary" size="sm" className="gap-1.5 shadow-md backdrop-blur-sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        {/* Layer toggles */}
        <div className="absolute top-4 left-28 z-10 flex gap-1.5">
          <Button
            variant={showChargers ? "default" : "secondary"}
            size="sm"
            className="gap-1 shadow-md backdrop-blur-sm text-xs h-8"
            onClick={() => setShowChargers((v) => !v)}
          >
            <Zap className="h-3 w-3" />
            Chargers
          </Button>
          <Button
            variant={panelOpen ? "default" : "secondary"}
            size="sm"
            className="gap-1 shadow-md backdrop-blur-sm text-xs h-8"
            onClick={() => setPanelOpen((v) => !v)}
          >
            <Battery className="h-3 w-3" />
            Telemetry
          </Button>
        </div>

        {/* Info panel */}
        {stats && (
          <Card className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100vh-2rem)] bg-card/90 backdrop-blur-md border-border/50 shadow-xl overflow-hidden flex flex-col">
            <CardContent className="p-4 space-y-3 overflow-y-auto">
              <div>
                <h1 className="text-lg font-semibold leading-tight">
                  A Whittle Wandering
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Summer 2025 Tesla Road Trip &middot; {stats.statesCount} States &middot; {stats.tripDays} Days
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatBadge icon={<Gauge className="h-3 w-3" />} value={`${stats.totalMiles.toLocaleString()} mi`} />
                <StatBadge icon={<MapPin className="h-3 w-3" />} value={`${stats.statesCount} states`} />
                <StatBadge icon={<Zap className="h-3 w-3" />} value={`${stats.totalEnergy.toLocaleString()} kWh`} />
                <StatBadge icon={<BatteryCharging className="h-3 w-3" />} value={`${stats.chargingSessions} charges`} />
                <StatBadge icon={<DollarSign className="h-3 w-3" />} value={`$${stats.totalCost.toLocaleString()}`} />
                <StatBadge icon={<DollarSign className="h-3 w-3" />} value={`$${stats.costPerMile.toFixed(3)}/mi`} />
                {stats.peopleMet > 0 && (
                  <StatBadge icon={<Users className="h-3 w-3" />} value={`${stats.peopleMet} people met`} />
                )}
              </div>

              {/* Stops list */}
              <div>
                <button
                  onClick={() => setStopsExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {stopsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {stops.length} stops {stopsExpanded ? "(hide)" : "(show)"}
                </button>

                {stopsExpanded && (
                  <ol className="mt-2 space-y-1 max-h-64 overflow-y-auto pr-1">
                    {stops.map((stop, i) => {
                      const city = extractCity(stop.location);
                      const isSelected = selectedStop === stop;
                      return (
                        <li key={i}>
                          <button
                            onClick={() => flyToStop(stop)}
                            className={`flex items-baseline gap-2 text-xs w-full text-left rounded px-1 py-0.5 hover:bg-accent/50 transition-colors ${
                              isSelected ? "bg-accent/70 font-semibold" : ""
                            }`}
                          >
                            <span className="text-muted-foreground tabular-nums w-20 shrink-0">
                              {formatDate(stop.arrivedAt)}
                            </span>
                            <span className="truncate">
                              {city}
                              {stop.state ? `, ${stop.state}` : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Telemetry panel */}
      {panelOpen && (
        <div className="border-t border-border bg-card/95 backdrop-blur-md" style={{ flex: "0 0 45%", minHeight: 0 }}>
          <Tabs defaultValue="battery" className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 pt-2">
              <TabsList className="h-8">
                <TabsTrigger value="battery" className="text-xs h-7 gap-1">
                  <Battery className="h-3 w-3" />
                  Battery
                </TabsTrigger>
                <TabsTrigger value="charging" className="text-xs h-7 gap-1">
                  <BatteryCharging className="h-3 w-3" />
                  Charging
                </TabsTrigger>
                <TabsTrigger value="costs" className="text-xs h-7 gap-1">
                  <DollarSign className="h-3 w-3" />
                  Costs
                </TabsTrigger>
                <TabsTrigger value="climate" className="text-xs h-7 gap-1">
                  <Thermometer className="h-3 w-3" />
                  Climate
                </TabsTrigger>
                <TabsTrigger value="itinerary" className="text-xs h-7 gap-1">
                  <Route className="h-3 w-3" />
                  Route
                </TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPanelOpen(false)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Battery tab */}
            <TabsContent value="battery" className="flex-1 min-h-0 px-4 pb-3">
              {batteryChartData.length > 0 ? (
                <ChartContainer config={batteryChartConfig} className="h-full w-full aspect-auto">
                  <AreaChart data={batteryChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={50} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={32} tickFormatter={(v: number) => `${v}%`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="chargingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="pct" stroke="#22c55e" strokeWidth={1.5} fill="url(#batteryGrad)" name="Battery %" dot={false} isAnimationActive={false} />
                    <Area type="monotone" dataKey="charging" stroke="#eab308" strokeWidth={0} fill="url(#chargingGrad)" name="Charging" dot={false} isAnimationActive={false} connectNulls={false} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <EmptyState text="No battery data available" />
              )}
            </TabsContent>

            {/* Charging tab */}
            <TabsContent value="charging" className="flex-1 min-h-0 overflow-hidden flex flex-col px-4 pb-3">
              {chargingSessions.length > 0 ? (
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card z-10">
                      <tr className="text-muted-foreground border-b border-border/50">
                        <th className="text-left py-1 font-medium">Date</th>
                        <th className="text-left py-1 font-medium">Location</th>
                        <th className="text-left py-1 font-medium">Type</th>
                        <th className="text-right py-1 font-medium">Dur</th>
                        <th className="text-right py-1 font-medium">kWh</th>
                        <th className="text-right py-1 font-medium">Battery</th>
                        <th className="text-right py-1 font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargingSessions.map((s, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/20 hover:bg-accent/30 cursor-pointer transition-colors"
                          onClick={() => flyToSession(s)}
                        >
                          <td className="py-1 tabular-nums whitespace-nowrap">{formatChartDate(s.start)}</td>
                          <td className="py-1 max-w-[140px] truncate" title={s.location}>
                            {extractCity(s.location)}
                          </td>
                          <td className="py-1">
                            <Badge variant={s.isSupercharger ? "default" : "secondary"} className="text-[10px] h-4 px-1">
                              {s.isSupercharger ? "SC" : "L2"}
                            </Badge>
                          </td>
                          <td className="py-1 text-right tabular-nums">{s.durationMin}m</td>
                          <td className="py-1 text-right tabular-nums">{s.energyAddedKwh.toFixed(1)}</td>
                          <td className="py-1 text-right tabular-nums">{s.startBattery}→{s.endBattery}%</td>
                          <td className="py-1 text-right tabular-nums font-medium">
                            {s.costUsd > 0 ? `$${s.costUsd.toFixed(2)}` : <span className="text-green-500">Free</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState text="No charging data available" />
              )}
            </TabsContent>

            {/* Costs tab */}
            <TabsContent value="costs" className="flex-1 min-h-0 px-4 pb-3 flex flex-col">
              {dailyCostChartData.length > 0 ? (
                <>
                  <div className="flex gap-4 text-xs mb-2">
                    <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">${dailyCharging.reduce((s, d) => s + d.costUsd, 0).toFixed(2)}</span></span>
                    <span className="text-muted-foreground">Avg/day: <span className="font-semibold text-foreground">${(dailyCharging.reduce((s, d) => s + d.costUsd, 0) / dailyCharging.length).toFixed(2)}</span></span>
                    <span className="text-muted-foreground">Free days: <span className="font-semibold text-foreground">{dailyCharging.filter((d) => d.costUsd === 0).length}</span></span>
                  </div>
                  <ChartContainer config={costChartConfig} className="flex-1 min-h-0 w-full aspect-auto">
                    <BarChart data={dailyCostChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={40} />
                      <YAxis tick={{ fontSize: 10 }} width={32} tickFormatter={(v: number) => `$${v}`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cost" fill="#22c55e" name="Daily Cost ($)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ChartContainer>
                </>
              ) : (
                <EmptyState text="No cost data available" />
              )}
            </TabsContent>

            {/* Climate tab */}
            <TabsContent value="climate" className="flex-1 min-h-0 px-4 pb-3">
              {climateChartData.length > 0 ? (
                <ChartContainer config={climateChartConfig} className="h-full w-full aspect-auto">
                  <LineChart data={climateChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={50} />
                    <YAxis tick={{ fontSize: 10 }} width={32} tickFormatter={(v: number) => `${v}°F`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="outside" stroke="#ef4444" strokeWidth={1.5} name="Outside Temp" dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="inside" stroke="#3b82f6" strokeWidth={1.5} name="Inside Temp" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <EmptyState text="No climate data available" />
              )}
            </TabsContent>

            {/* Itinerary tab */}
            <TabsContent value="itinerary" className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
              {itinerary.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="text-muted-foreground border-b border-border/50">
                      <th className="text-left py-1.5 font-medium">State</th>
                      <th className="text-left py-1.5 font-medium">Locations</th>
                      <th className="text-left py-1.5 font-medium">Dates</th>
                      <th className="text-left py-1.5 font-medium">People</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itinerary.map((entry, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                        <td className="py-1.5">
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                            {entry.state}
                          </Badge>
                        </td>
                        <td className="py-1.5 max-w-[200px]">{entry.locations}</td>
                        <td className="py-1.5 tabular-nums text-muted-foreground whitespace-nowrap">{entry.dates}</td>
                        <td className="py-1.5">
                          {entry.peopleMet ? (
                            <span className="text-primary">{entry.peopleMet}</span>
                          ) : (
                            <span className="text-muted-foreground/40">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState text="No itinerary data available" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

// --- Chart configs ---

const batteryChartConfig: ChartConfig = {
  pct: { label: "Battery %", color: "#22c55e" },
  charging: { label: "Charging", color: "#eab308" },
};

const costChartConfig: ChartConfig = {
  cost: { label: "Daily Cost ($)", color: "#22c55e" },
};

const climateChartConfig: ChartConfig = {
  outside: { label: "Outside (°F)", color: "#ef4444" },
  inside: { label: "Inside (°F)", color: "#3b82f6" },
};

// --- Components ---

function StatBadge({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <Badge variant="secondary" className="gap-1 text-xs justify-start font-normal">
      {icon}
      {value}
    </Badge>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
      {text}
    </div>
  );
}

// --- Helpers ---

function extractStateFromLocation(location: string): string {
  const match = location.match(/, ([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+\d{5}/);
  return match?.[1] ?? "";
}

function extractCity(location: string): string {
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length >= 3) return parts[1];
  if (parts.length >= 2) return parts[0];
  return location;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T") + ":00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function addRouteLayer(map: mapboxgl.Map, route: RoutePoint[]) {
  const coordinates = route.map((p) => [p.lng, p.lat]);

  map.addSource("trip-route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates },
    },
  });

  map.addLayer({
    id: "trip-route-glow",
    type: "line",
    source: "trip-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#22d3ee", "line-width": 6, "line-opacity": 0.25, "line-blur": 4 },
  });

  map.addLayer({
    id: "trip-route-line",
    type: "line",
    source: "trip-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#3b82f6", "line-width": 2.5, "line-opacity": 0.9 },
  });
}

function addStopMarkers(map: mapboxgl.Map, mb: typeof mapboxgl, stops: TripStop[]) {
  for (const stop of stops) {
    const el = document.createElement("div");
    el.style.cssText = "width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 6px rgba(59,130,246,0.5);cursor:pointer;";

    const city = extractCity(stop.location);
    const popup = new mb.Popup({ offset: 12, closeButton: false, maxWidth: "220px" }).setHTML(`
      <div style="font-size:13px;">
        <div style="font-weight:600;">${city}${stop.state ? `, ${stop.state}` : ""}</div>
        <div style="opacity:0.7;font-size:12px;margin-top:2px;">${formatDate(stop.arrivedAt)} &middot; ${formatDwell(stop.dwellMinutes)}</div>
      </div>
    `);

    new mb.Marker(el).setLngLat([stop.lng, stop.lat]).setPopup(popup).addTo(map);
  }

  if (stops.length > 0) addSpecialMarker(map, mb, stops[0], "#22c55e", "START");
  if (stops.length > 1) addSpecialMarker(map, mb, stops[stops.length - 1], "#ef4444", "END");
}

function addChargingMarkers(map: mapboxgl.Map, mb: typeof mapboxgl, sessions: ChargingSession[]) {
  const seen = new Set<string>();
  for (const s of sessions) {
    if (!s.lat || !s.lng) continue;
    const key = `${s.lat.toFixed(2)},${s.lng.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const isSC = s.isSupercharger;
    const el = document.createElement("div");
    el.setAttribute("data-charging-marker", "true");
    el.style.cssText = `
      width:${isSC ? 14 : 10}px;height:${isSC ? 14 : 10}px;
      border-radius:${isSC ? "3px" : "50%"};
      background:${isSC ? "#eab308" : "#a855f7"};
      border:2px solid ${isSC ? "#fef08a" : "#e9d5ff"};
      box-shadow:0 0 8px ${isSC ? "rgba(234,179,8,0.5)" : "rgba(168,85,247,0.4)"};
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      font-size:8px;color:#000;font-weight:bold;
    `;
    el.textContent = isSC ? "\u26A1" : "";

    const city = extractCity(s.location);
    const costStr = s.costUsd > 0 ? `$${s.costUsd.toFixed(2)}` : "Free";
    const popup = new mb.Popup({ offset: 12, closeButton: false, maxWidth: "260px" }).setHTML(`
      <div style="font-size:12px;line-height:1.4;">
        <div style="font-weight:600;margin-bottom:2px;">${isSC ? "\u26A1 Supercharger" : "L2 / Destination"}</div>
        <div style="opacity:0.8;font-size:11px;">${city}</div>
        <div>${formatChartDate(s.start)} &middot; ${s.durationMin}min</div>
        <div>Battery: ${s.startBattery}% → ${s.endBattery}% (+${s.energyAddedKwh.toFixed(1)} kWh)</div>
        <div style="font-weight:600;color:${s.costUsd > 0 ? "#22c55e" : "#eab308"};">Cost: ${costStr}</div>
      </div>
    `);

    new mb.Marker(el).setLngLat([s.lng, s.lat]).setPopup(popup).addTo(map);
  }
}

function addSpecialMarker(map: mapboxgl.Map, mb: typeof mapboxgl, stop: TripStop, color: string, label: string) {
  const el = document.createElement("div");
  el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 10px ${color}80;cursor:pointer;`;
  el.title = label;
  new mb.Marker(el).setLngLat([stop.lng, stop.lat]).addTo(map);
}

function formatDwell(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
  }
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fitToRoute(map: mapboxgl.Map, route: RoutePoint[]) {
  if (route.length < 2) return;
  const lngs = route.map((p) => p.lng);
  const lats = route.map((p) => p.lat);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
  map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
}

export default RoadtripMap;
