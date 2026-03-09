import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Zap,
  Gauge,
  ChevronDown,
  ChevronUp,
  Loader2,
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
import type mapboxgl from "mapbox-gl";
import { dynamicConfig } from "@/lib/dynamic-config";

// Lazy load mapbox-gl
let mapboxPromise: Promise<typeof mapboxgl> | null = null;
function getMapbox(): Promise<typeof mapboxgl> {
  if (!mapboxPromise) {
    mapboxPromise = import("mapbox-gl").then((m) => {
      import("mapbox-gl/dist/mapbox-gl.css");
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [stopsExpanded, setStopsExpanded] = useState(false);
  const [selectedStop, setSelectedStop] = useState<TripStop | null>(null);

  // Fetch and parse CSV
  useEffect(() => {
    fetch("/data/drives.csv")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load drive data");
        return r.text();
      })
      .then((text) => {
        const parsed = parseDriveCsv(text);
        setDrives(parsed);
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
    const totalMiles = Math.round(last.endOdometer - first.startOdometer);
    const totalEnergy = drives.reduce((s, d) => s + d.energyKwh, 0);
    const stateSet = new Set<string>();
    for (const d of drives) {
      const s1 = extractStateFromLocation(d.startLocation);
      const s2 = extractStateFromLocation(d.endLocation);
      if (s1) stateSet.add(s1);
      if (s2) stateSet.add(s2);
    }
    return {
      totalMiles,
      totalDrives: drives.length,
      totalEnergy: Math.round(totalEnergy),
      statesCount: stateSet.size,
      startDate: first.startedAt.split(" ")[0],
      endDate: last.endedAt.split(" ")[0],
      avgEfficiency: totalMiles > 0 ? Math.round((totalEnergy / totalMiles) * 1000) : 0,
    };
  }, [drives]);

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

  const flyToStop = useCallback((stop: TripStop) => {
    setSelectedStop(stop);
    mapRef.current?.flyTo({ center: [stop.lng, stop.lat], zoom: 11, duration: 1200 });
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
      <div className="flex-1 relative min-h-0">
        {/* Map container */}
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Gradient overlay at bottom */}
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

        {/* Info panel */}
        {stats && (
          <Card className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100vh-2rem)] bg-card/90 backdrop-blur-md border-border/50 shadow-xl overflow-hidden flex flex-col">
            <CardContent className="p-4 space-y-3 overflow-y-auto">
              {/* Title */}
              <div>
                <h1 className="text-lg font-semibold leading-tight">
                  A Whittle Wandering
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Summer 2025 Tesla Road Trip &middot; 48 States
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <StatBadge icon={<Gauge className="h-3 w-3" />} value={`${stats.totalMiles.toLocaleString()} mi`} />
                <StatBadge icon={<MapPin className="h-3 w-3" />} value={`${stats.statesCount} states`} />
                <StatBadge icon={<Calendar className="h-3 w-3" />} value={`${stats.startDate} \u2013 ${stats.endDate}`} />
                <StatBadge icon={<Zap className="h-3 w-3" />} value={`${stats.totalEnergy.toLocaleString()} kWh`} />
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
    </div>
  );
};

// --- Helpers ---

function StatBadge({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <Badge variant="secondary" className="gap-1 text-xs justify-start font-normal">
      {icon}
      {value}
    </Badge>
  );
}

function extractStateFromLocation(location: string): string {
  const match = location.match(/, ([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+\d{5}/);
  return match?.[1] ?? "";
}

function extractCity(location: string): string {
  // "1053 Herndon Street, Corpus Christi, Texas 78411, United States"
  // Extract the city name (second comma-separated field typically)
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length >= 3) return parts[1];
  if (parts.length >= 2) return parts[0];
  return location;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T") + ":00");
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

  // Glow
  map.addLayer({
    id: "trip-route-glow",
    type: "line",
    source: "trip-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#22d3ee",
      "line-width": 6,
      "line-opacity": 0.25,
      "line-blur": 4,
    },
  });

  // Main line
  map.addLayer({
    id: "trip-route-line",
    type: "line",
    source: "trip-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#3b82f6",
      "line-width": 2.5,
      "line-opacity": 0.9,
    },
  });
}

function addStopMarkers(
  map: mapboxgl.Map,
  mb: typeof mapboxgl,
  stops: TripStop[],
) {
  for (const stop of stops) {
    const el = document.createElement("div");
    el.style.cssText =
      "width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 6px rgba(59,130,246,0.5);cursor:pointer;";

    const city = extractCity(stop.location);
    const popup = new mb.Popup({ offset: 12, closeButton: false, maxWidth: "220px" }).setHTML(`
      <div style="font-size:13px;">
        <div style="font-weight:600;">${city}${stop.state ? `, ${stop.state}` : ""}</div>
        <div style="opacity:0.7;font-size:12px;margin-top:2px;">${formatDate(stop.arrivedAt)} &middot; ${formatDwell(stop.dwellMinutes)}</div>
      </div>
    `);

    new mb.Marker(el)
      .setLngLat([stop.lng, stop.lat])
      .setPopup(popup)
      .addTo(map);
  }

  // Start marker (green)
  if (stops.length > 0) {
    addSpecialMarker(map, mb, stops[0], "#22c55e", "START");
  }
  // End marker (red)
  if (stops.length > 1) {
    addSpecialMarker(map, mb, stops[stops.length - 1], "#ef4444", "END");
  }
}

function addSpecialMarker(
  map: mapboxgl.Map,
  mb: typeof mapboxgl,
  stop: TripStop,
  color: string,
  label: string,
) {
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
