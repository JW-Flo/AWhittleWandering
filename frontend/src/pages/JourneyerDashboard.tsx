import React, { Suspense, lazy, useEffect, useMemo, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import TeslaDataContext, { TeslaDataProvider } from "@/contexts/TeslaDataContext";
import { api } from "@/lib/api-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehicleStats from "@/components/VehicleStats";
import TripTimeline from "@/components/TripTimeline";
import JourneyJournal from "@/components/JourneyJournal";
import MediaUpload from "@/components/MediaUpload";
import ConsolidatedRouteOptimizer from "@/components/ConsolidatedRouteOptimizer";
import { AdvancedAnalyticsDashboard } from "@/components/AdvancedAnalyticsDashboard";
import { Activity, Compass, Route, PenLine, Server, RefreshCw, Wifi, WifiOff, Clock, Info } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const LazyTeslaMap = lazy(() => import("@/components/LazyTeslaMap"));

type AppConfig = {
  mapboxToken: string | null;
  apiBaseUrl: string;
  appName: string;
  apiVersion: string;
  features: {
    liveTeslaData: boolean;
    mapIntegration: boolean;
    realtimeUpdates: boolean;
  };
  updateInterval: number;
};

/** Connection status banner */
const ConnectionBanner: React.FC<{
  isConnected: boolean;
  isLoading: boolean;
  dataFreshness?: string;
  lastUpdate?: string;
}> = ({ isConnected, isLoading, dataFreshness, lastUpdate }) => {
  if (isLoading) return null;

  // Determine status
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm">
        <WifiOff className="w-4 h-4 text-destructive flex-shrink-0" />
        <span className="text-destructive/90">Offline — unable to reach backend. Showing last known data.</span>
      </div>
    );
  }

  if (dataFreshness === 'live') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <span className="text-primary/90">Live</span>
      </div>
    );
  }

  if (dataFreshness === 'cached' && lastUpdate) {
    const age = Date.now() - new Date(lastUpdate).getTime();
    const hoursAgo = Math.floor(age / (1000 * 60 * 60));
    const label = hoursAgo > 0 ? `${hoursAgo}h ago` : `${Math.floor(age / (1000 * 60))}m ago`;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5 text-sm">
        <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
        <span className="text-yellow-700 dark:text-yellow-400">Last updated {label}</span>
      </div>
    );
  }

  // Between trips / unknown freshness
  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-2.5 text-sm">
      <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <span className="text-blue-600 dark:text-blue-400">Between trips — showing historical data</span>
    </div>
  );
};

const JourneyerDashboardInner: React.FC = () => {
  useDocumentTitle("Dashboard");
  const ctx = useContext(TeslaDataContext);
  const data = ctx?.data ?? null;
  const isLoading = ctx?.isLoading ?? false;
  const error = ctx?.error ?? null;
  const isConnected = ctx?.isConnected ?? false;
  const refreshData = ctx?.refreshData;

  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`${api.baseUrl}/api/v1/config`);
        if (!response.ok) return;
        const cfg = (await response.json()) as AppConfig;
        if (!cancelled) setAppConfig(cfg);
      } catch {
        // Soft-fail; dashboard remains usable without config.
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const chargingRaw = String(data?.currentStatus?.battery?.charging || "").toLowerCase();
  const chargingState: "charging" | "complete" | "disconnected" =
    chargingRaw.includes("charging") ? "charging" : chargingRaw.includes("complete") ? "complete" : "disconnected";

  const routeLocations = useMemo(() => {
    if (data?.routePath && data.routePath.length > 0) {
      return data.routePath.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number" && (p.lat !== 0 || p.lng !== 0)
      );
    }
    // Sort chronologically — API returns drives in DESC order
    const drives = [...(data?.timeline?.drives || [])].sort((a, b) => {
      const tA = new Date(a.startTime || a.date).getTime();
      const tB = new Date(b.startTime || b.date).getTime();
      return tA - tB;
    });
    const points: Array<{ lat: number; lng: number; timestamp: string }> = [];
    for (const drive of drives) {
      if (drive.startCoordinates?.lat && drive.startCoordinates?.lng) {
        points.push({ lat: drive.startCoordinates.lat, lng: drive.startCoordinates.lng, timestamp: drive.startTime || drive.date });
      }
      if (drive.endCoordinates?.lat && drive.endCoordinates?.lng) {
        points.push({ lat: drive.endCoordinates.lat, lng: drive.endCoordinates.lng, timestamp: drive.endTime || drive.date });
      }
    }
    return points;
  }, [data]);

  const currentLocation = data?.currentStatus?.location;

  const handleDriveSelect = useCallback((drive: { id: number }) => {
    setSelectedDriveId(prev => prev === drive.id ? null : drive.id);
  }, []);

  const hasDrives = (data?.timeline?.drives?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Journeyer command center</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight truncate">
                {data?.overview?.tripName || appConfig?.appName || "A Whittle Wandering"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.overview?.vehicle || "Vehicle"} • v{appConfig?.apiVersion || "—"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/journey/live">Public view</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard/coordination">Coordination</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/settings">Settings</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshData?.()}
                disabled={!refreshData || isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-secondary/40">
            <TabsTrigger value="live" className="data-[state=active]:bg-card">
              <Activity className="w-4 h-4 mr-2" />
              Live
            </TabsTrigger>
            <TabsTrigger value="navigation" className="data-[state=active]:bg-card">
              <Route className="w-4 h-4 mr-2" />
              Navigation
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-card">
              <Compass className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="author" className="data-[state=active]:bg-card">
              <PenLine className="w-4 h-4 mr-2" />
              Author
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-card">
              <Server className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {/* Connection status banner */}
            <ConnectionBanner
              isConnected={isConnected}
              isLoading={isLoading}
              dataFreshness={data?.tessieStatus?.dataFreshness}
              lastUpdate={data?.tessieStatus?.lastUpdate}
            />

            {/* Map + Stats row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2">
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      Orientation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[50vh] min-h-[300px] max-h-[600px] p-0">
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                          Loading map…
                        </div>
                      }
                    >
                      <LazyTeslaMap
                        vehicleLocation={
                          currentLocation && currentLocation.coordinates.lat !== 0
                            ? {
                                latitude: currentLocation.coordinates.lat,
                                longitude: currentLocation.coordinates.lng,
                                heading: data?.currentStatus?.vehicle?.heading ?? 0,
                                speed: data?.currentStatus?.vehicle?.speed ?? 0,
                              }
                            : undefined
                        }
                        mapboxToken={appConfig?.mapboxToken || undefined}
                        onTokenChange={() => {}}
                        routeLocations={routeLocations}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <VehicleStats
                  batteryLevel={data?.currentStatus?.battery?.level}
                  range={data?.currentStatus?.battery?.range}
                  chargingState={chargingState}
                  temperature={data?.currentStatus?.vehicle?.temperature?.outside}
                  odometer={data?.currentStatus?.vehicle?.odometer}
                  speed={data?.currentStatus?.vehicle?.speed}
                  location={
                    currentLocation && currentLocation.city !== 'Unknown'
                      ? `${currentLocation.city}, ${currentLocation.state}`
                      : currentLocation?.state !== 'Unknown' ? currentLocation?.state : undefined
                  }
                  lastUpdate={data?.currentStatus?.location?.lastUpdate}
                  isLoading={isLoading}
                  error={error}
                />

                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      Trip
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Days</span>
                      <span className="font-mono">{data?.overview?.daysElapsed ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Miles</span>
                      <span className="font-mono">
                        {typeof data?.overview?.totalMiles === "number"
                          ? data.overview.totalMiles.toLocaleString()
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">States</span>
                      <span className="font-mono">
                        {typeof data?.overview?.statesVisited === "number" && typeof data?.overview?.totalStates === "number"
                          ? `${data.overview.statesVisited} / ${data.overview.totalStates}`
                          : "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Trip Timeline */}
            {hasDrives && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Drive Timeline</h3>
                <TripTimeline
                  drives={data?.timeline?.drives ?? []}
                  charges={data?.timeline?.charges ?? []}
                  onDriveSelect={handleDriveSelect}
                  selectedDriveId={selectedDriveId}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
            <ConsolidatedRouteOptimizer
              vehicleData={{
                batteryLevel: data?.currentStatus?.battery?.level,
                range: data?.currentStatus?.battery?.range,
              }}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="author" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <JourneyJournal />
              <MediaUpload
                onMediaUploaded={() => {}}
                currentLocation={
                  currentLocation
                    ? { state: currentLocation.state, coordinates: currentLocation.coordinates }
                    : undefined
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Connection status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Backend API</span>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                      {isConnected ? "Connected" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Data freshness</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {data?.tessieStatus?.dataFreshness ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Last sync</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {data?.tessieStatus?.lastUpdate ? new Date(data.tessieStatus.lastUpdate).toLocaleString() : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Mapbox token</span>
                    <Badge variant={appConfig?.mapboxToken ? "default" : "outline"}>
                      {appConfig?.mapboxToken ? "Configured" : "Not set"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>API version</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      v{appConfig?.apiVersion ?? "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Power tools live here so the public journey experience stays calm.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/dashboard/coordination">Open coordination dashboard</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/demo">Demo</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const JourneyerDashboard: React.FC = () => {
  return (
    <TeslaDataProvider>
      <JourneyerDashboardInner />
    </TeslaDataProvider>
  );
};

export default JourneyerDashboard;
