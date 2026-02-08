import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  BarChart3,
  Route,
  Server,
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import ConsolidatedRouteOptimizer from './ConsolidatedRouteOptimizer';
import JourneyArc from './follower/JourneyArc';
import { backendApi, type HealthResponse, type UnifiedDataResponse } from '@/services/backendApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface MasterCoordinationDashboardProps {
  journeyData?: unknown[];
  currentLocation: [number, number];
  destination?: [number, number];
}

export const MasterCoordinationDashboard: React.FC<MasterCoordinationDashboardProps> = () => {
  useDocumentTitle('Coordination');
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [unified, setUnified] = useState<UnifiedDataResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [unifiedLoading, setUnifiedLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [unifiedError, setUnifiedError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await backendApi.health();
      setHealth(res);
    } catch (e) {
      setHealthError(e instanceof Error ? e.message : 'Failed to reach backend');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchUnified = useCallback(async () => {
    setUnifiedLoading(true);
    setUnifiedError(null);
    try {
      const res = await backendApi.getUnifiedData();
      setUnified(res);
    } catch (e) {
      setUnifiedError(e instanceof Error ? e.message : 'Failed to load journey data');
    } finally {
      setUnifiedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchUnified();
  }, [fetchHealth, fetchUnified]);

  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />;

  return (
    <div data-testid="coordination-page" className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Coordination</h1>
                <p className="text-xs text-muted-foreground">Operational overview and tools</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={health?.status === 'ok' ? 'text-primary border-primary/40' : ''}>
                {healthLoading ? 'Checking...' : health?.status === 'ok' ? 'Backend OK' : 'Backend issue'}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => { fetchHealth(); fetchUnified(); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-secondary/40">
            <TabsTrigger value="overview" className="data-[state=active]:bg-card">
              <Activity className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-card">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="route" className="data-[state=active]:bg-card">
              <Route className="w-4 h-4 mr-2" /> Route
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-card">
              <Server className="w-4 h-4 mr-2" /> System
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Trip Overview */}
          <TabsContent value="overview" className="space-y-6">
            {unifiedLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading trip data...</span>
              </div>
            ) : unifiedError ? (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <p className="text-destructive text-sm">{unifiedError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={fetchUnified}>Retry</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <JourneyArc
                  daysElapsed={(unified as any)?.overview?.daysElapsed}
                  totalMiles={(unified as any)?.overview?.totalMiles}
                  statesVisited={(unified as any)?.overview?.statesVisited}
                  totalStates={(unified as any)?.overview?.totalStates}
                />

                {/* Recent drives */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">Recent drives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const drives = (unified as any)?.timeline?.drives || [];
                      if (drives.length === 0) {
                        return <p className="text-sm text-muted-foreground">No drives recorded yet.</p>;
                      }
                      return (
                        <div className="space-y-2">
                          {drives.slice(0, 8).map((d: any) => (
                            <div key={d.id} className="flex items-center justify-between text-sm border-b border-border/40 pb-2 last:border-0">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{d.endLocation || d.end_address || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{d.date || d.started_at}</p>
                              </div>
                              <span className="font-mono text-muted-foreground shrink-0 ml-2">
                                {typeof d.distance === 'number' ? `${Math.round(d.distance)} mi` : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tab 2: Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalyticsDashboard />
          </TabsContent>

          {/* Tab 3: Route Planning */}
          <TabsContent value="route" className="space-y-6">
            <ConsolidatedRouteOptimizer />
          </TabsContent>

          {/* Tab 4: System Health */}
          <TabsContent value="system" className="space-y-6">
            {healthLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Checking system health...</span>
              </div>
            ) : healthError ? (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <p className="text-destructive text-sm">{healthError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={fetchHealth}>Retry</Button>
                </CardContent>
              </Card>
            ) : health ? (
              <div className="space-y-4">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">Backend health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={health.status === 'ok'} />
                        <Badge variant={health.status === 'ok' ? 'default' : 'destructive'}>{health.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Version</span>
                      <span className="font-mono text-muted-foreground">{health.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Response time</span>
                      <span className="font-mono text-muted-foreground">{health.performance?.responseTimeMs ?? '—'}ms</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">Data pipeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {health.ingestion && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span>Vehicle state</span>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-muted-foreground">
                              {health.ingestion.vehicleState?.ageSeconds != null
                                ? `${Math.round(health.ingestion.vehicleState.ageSeconds / 60)}m ago`
                                : '—'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Drives ingested</span>
                          <span className="font-mono text-muted-foreground">{health.ingestion.drives?.total ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Charges ingested</span>
                          <span className="font-mono text-muted-foreground">{health.ingestion.charges?.total ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>States visited</span>
                          <span className="font-mono text-muted-foreground">{health.ingestion.statesVisited ?? '—'}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {health.resources && Object.keys(health.resources).length > 0 && (
                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle className="text-base font-medium text-muted-foreground">Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(health.resources).map(([name, status]) => (
                        <div key={name} className="flex items-center justify-between text-sm">
                          <span>{name}</span>
                          <div className="flex items-center gap-2">
                            <StatusIcon ok={status === 'connected' || status === 'ok'} />
                            <span className="text-muted-foreground">{status}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {health.warnings && health.warnings.length > 0 && (
                  <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader>
                      <CardTitle className="text-base font-medium text-yellow-600">Warnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {health.warnings.map((w, i) => (
                          <li key={i} className="text-sm text-yellow-700">{w}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
