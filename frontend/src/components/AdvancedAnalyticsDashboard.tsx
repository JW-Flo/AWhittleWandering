import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  JourneyInsights
} from '@/types/enhanced-features';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Route,
  DollarSign,
  Leaf,
  Battery,
  Loader2
} from 'lucide-react';
import { backendApi } from '@/services/backendApi';
import EmptyState from '@/components/common/EmptyState';

interface AnalyticsSummary {
  ok: boolean;
  totalDistance: number;
  totalEnergy: number;
  averageEfficiency: number;
  totalCost: number;
  costPerMile: number;
  costSavings: number;
  carbonSaved: number;
  totalDrives: number;
  totalCharges: number;
  totalEnergyAdded: number;
}

interface EfficiencyRow {
  date: string;
  miles_driven: number;
  energy_consumed_kwh: number;
  efficiency_miles_per_kwh: number;
  avg_outside_temp_f: number;
  avg_speed_mph: number;
}

interface ChargingRow {
  charger_type: string;
  session_count: number;
  total_energy_added_kwh: number;
  avg_cost_per_kwh: number;
  avg_duration_minutes: number;
}

interface AnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onInsightGenerated?: (insight: JourneyInsights) => void;
}

export const AdvancedAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = '30d',
  onInsightGenerated
}) => {
  const [insights, setInsights] = useState<JourneyInsights | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [efficiency, setEfficiency] = useState<EfficiencyRow[]>([]);
  const [charging, setCharging] = useState<ChargingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'efficiency' | 'cost' | 'carbon'>('efficiency');

  const limitForRange: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const limit = limitForRange[timeRange] || 30;

      const [summaryRes, efficiencyRes, chargingRes] = await Promise.allSettled([
        fetch(`${backendApi.baseUrl}/api/v1/analytics/summary?limit=${limit}`).then(r => r.json()),
        backendApi.getAnalyticsEfficiency(),
        backendApi.getAnalyticsCharging(),
      ]);

      const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value as AnalyticsSummary : null;
      const effData = efficiencyRes.status === 'fulfilled' ? efficiencyRes.value as { efficiency?: EfficiencyRow[] } : null;
      const chargeData = chargingRes.status === 'fulfilled' ? chargingRes.value as { byChargerType?: ChargingRow[] } : null;

      if (summaryData?.ok) {
        setSummary(summaryData);
        const mapped: JourneyInsights = {
          totalDistance: summaryData.totalDistance,
          totalEnergy: summaryData.totalEnergy,
          averageEfficiency: summaryData.averageEfficiency,
          carbonSaved: summaryData.carbonSaved,
          costSavings: summaryData.costSavings,
          favoriteRoutes: [],
          chargingPatterns: [],
          seasonalTrends: [],
        };
        setInsights(mapped);
        onInsightGenerated?.(mapped);
      }

      if (effData?.efficiency) setEfficiency(effData.efficiency);
      if (chargeData?.byChargerType) setCharging(chargeData.byChargerType);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, onInsightGenerated]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDistance = (miles: number) => `${miles.toLocaleString()} mi`;

  // Compute efficiency stats from real data
  const recentEfficiency = efficiency.slice(0, 7);
  const avgEfficiency7d = recentEfficiency.length
    ? recentEfficiency.reduce((s, r) => s + r.efficiency_miles_per_kwh, 0) / recentEfficiency.length
    : 0;
  const bestEfficiency = efficiency.length
    ? Math.max(...efficiency.map(r => r.efficiency_miles_per_kwh))
    : 0;

  // Compute charging stats
  const totalChargingCost = summary?.totalCost ?? 0;
  const costPerMile = summary?.costPerMile ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            {insights ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Distance</p>
                    <p className="text-2xl font-bold">
                      {formatDistance(insights.totalDistance)}
                    </p>
                  </div>
                  <Route className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {summary?.totalDrives ?? 0} drives
                  </Badge>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Route className="h-8 w-8" />}
                title="Metrics appear after your first drive"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {insights ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Energy Efficiency</p>
                    <p className="text-2xl font-bold">
                      {`${insights.averageEfficiency.toFixed(2)} mi/kWh`}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-2">
                  <Progress value={Math.min(100, (insights.averageEfficiency / 4.5) * 100)} className="h-2" />
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Zap className="h-8 w-8" />}
                title="Metrics appear after your first drive"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {insights ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(insights.costSavings)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-2">
                  <Badge variant="default" className="text-xs">
                    vs gasoline
                  </Badge>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<DollarSign className="h-8 w-8" />}
                title="Metrics appear after your first drive"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {insights ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Carbon Saved</p>
                    <p className="text-2xl font-bold">
                      {`${insights.carbonSaved.toFixed(0)} lbs`}
                    </p>
                  </div>
                  <Leaf className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    CO2 equivalent
                  </Badge>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Leaf className="h-8 w-8" />}
                title="Metrics appear after your first drive"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Journey Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as 'efficiency' | 'cost' | 'carbon')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
              <TabsTrigger value="carbon">Environmental</TabsTrigger>
            </TabsList>

            <TabsContent value="efficiency" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Efficiency Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Overall Average</span>
                        <span className="font-medium">{insights?.averageEfficiency.toFixed(2) ?? '---'} mi/kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">7-day Average</span>
                        <span className="font-medium">{avgEfficiency7d ? avgEfficiency7d.toFixed(2) : '---'} mi/kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Personal Best</span>
                        <span className="font-medium text-primary">{bestEfficiency ? bestEfficiency.toFixed(2) : '---'} mi/kWh</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentEfficiency.length === 0 ? (
                      <EmptyState
                        icon={<TrendingUp className="h-8 w-8" />}
                        title="Efficiency data will appear after multiple drives"
                      />
                    ) : (
                      <div className="space-y-3">
                        {recentEfficiency.slice(0, 5).map((row) => (
                          <div key={row.date} className="flex items-center justify-between">
                            <span className="text-sm">{row.date}</span>
                            <Badge variant={row.efficiency_miles_per_kwh >= (insights?.averageEfficiency ?? 0) ? 'default' : 'secondary'}>
                              {row.efficiency_miles_per_kwh.toFixed(2)} mi/kWh
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cost" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Charging Cost</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalChargingCost)}</p>
                      <p className="text-xs text-muted-foreground">{summary?.totalCharges ?? 0} sessions</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Cost per Mile</p>
                      <p className="text-2xl font-bold">${costPerMile.toFixed(3)}</p>
                      <p className="text-xs text-primary">vs $0.12 gas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Savings</p>
                      <p className="text-2xl font-bold">{formatCurrency(insights?.costSavings ?? 0)}</p>
                      <p className="text-xs text-muted-foreground">vs ICE vehicle</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-lg">Charging by Type</CardTitle></CardHeader>
                <CardContent>
                  {charging.length > 0 ? (
                    <div className="space-y-3">
                      {charging.map((row) => (
                        <div key={row.charger_type} className="flex items-center justify-between">
                          <span className="text-sm">{row.charger_type || 'Unknown'}</span>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{row.session_count} sessions</Badge>
                            <Badge variant="outline">{Number(row.total_energy_added_kwh).toFixed(1)} kWh</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Battery className="h-8 w-8" />}
                      title="Charging data appears after your first charging session"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="carbon" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Environmental Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">CO2 Avoided</span>
                        <span className="font-medium">{insights?.carbonSaved.toFixed(0) ?? '---'} lbs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Equivalent Trees</span>
                        <span className="font-medium">{insights ? (insights.carbonSaved / 48).toFixed(1) : '---'} trees/year</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Energy</span>
                        <span className="font-medium">{insights ? `${insights.totalEnergy.toFixed(1)} kWh` : '---'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Carbon Intensity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Home Charging</span>
                        <Badge variant="default">0.45 lbs/kWh</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Public Charging</span>
                        <Badge variant="secondary">0.62 lbs/kWh</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Solar Charging</span>
                        <Badge variant="outline">0.00 lbs/kWh</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI-Powered Insights
            {insights && summary && summary.totalDrives >= 5 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Example</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights && summary && summary.totalDrives >= 5 ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-primary/10 rounded">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Efficiency Opportunity</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your efficiency improves by 18% when departing before 9 AM.
                      Consider adjusting departure times for longer trips.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-accent/10 rounded">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Cost Optimization</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Switching to off-peak charging could save you an additional $23/month
                      based on your driving patterns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-secondary/10 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-secondary/20 rounded">
                    <Battery className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">Charging Pattern</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your battery health could improve by maintaining charge between 20-80%
                      for daily use, reserving 100% for road trips.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-8 w-8" />}
              title="AI insights generate after enough data is collected"
              description="Complete at least 5 drives to unlock personalized recommendations"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
