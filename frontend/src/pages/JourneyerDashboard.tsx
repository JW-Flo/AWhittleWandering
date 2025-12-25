import React, { Suspense, lazy, useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";
import TeslaDataContext, { TeslaDataProvider } from "@/contexts/TeslaDataContext";
import { api } from "@/lib/api-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehicleStats from "@/components/VehicleStats";
import JourneyJournal from "@/components/JourneyJournal";
import MediaUpload from "@/components/MediaUpload";
import ConsolidatedRouteOptimizer from "@/components/ConsolidatedRouteOptimizer";
import { AdvancedAnalyticsDashboard } from "@/components/AdvancedAnalyticsDashboard";
import { Activity, Compass, Route, PenLine, Server, RefreshCw } from "lucide-react";

const LazyTeslaMap = lazy(() => import("@/components/LazyTeslaMap"));

/**
 * Journeyer (owner) command center.
 * For now this wraps the existing dashboard implementation; we’ll progressively
 * redesign it while keeping functionality intact.
 */
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

const JourneyerDashboardInner: React.FC = () => {
  const ctx = useContext(TeslaDataContext);
  const data = ctx?.data ?? null;
  const isLoading = ctx?.isLoading ?? false;
  const error = ctx?.error ?? null;
  const isConnected = ctx?.isConnected ?? false;
  const refreshData = ctx?.refreshData;

  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

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
    const drives = data?.timeline?.drives || [];
    return drives
      .map((drive) => ({
        lat: drive.endCoordinates?.lat,
        lng: drive.endCoordinates?.lng,
        timestamp: drive.endTime,
      }))
      .filter((p) => typeof p.lat === "number" && typeof p.lng === "number");
  }, [data]);

  const currentLocation = data?.currentStatus?.location;

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
              <Badge variant="outline" className={isConnected ? "text-primary border-primary/40" : ""}>
                {isConnected ? "Connected" : "Offline"}
              </Badge>
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
          <TabsList className="grid w-full grid-cols-5 bg-secondary/40">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2">
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      Orientation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[420px] p-0">
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                          Loading map…
                        </div>
                      }
                    >
                      <LazyTeslaMap
                        vehicleLocation={
                          currentLocation
                            ? {
                                latitude: currentLocation.coordinates.lat,
                                longitude: currentLocation.coordinates.lng,
                                heading: 0,
                                speed: data?.currentStatus?.vehicle?.speed ?? 0,
                              }
                            : undefined
                        }
                        mapboxToken={appConfig?.mapboxToken || undefined}
                        onTokenChange={() => {}}
                        routeLocations={routeLocations as any}
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
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  System & tools
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


