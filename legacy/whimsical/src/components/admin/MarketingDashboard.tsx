import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, MousePointerClick, Globe, Target, Megaphone, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface UTMData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  count: number;
}

interface ReferrerData {
  referrer: string | null;
  count: number;
}

interface TrafficTrend {
  date: string;
  visits: number;
  utm_visits: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658'];

export default function MarketingDashboard() {
  const [utmData, setUtmData] = useState<UTMData[]>([]);
  const [referrerData, setReferrerData] = useState<ReferrerData[]>([]);
  const [trafficTrends, setTrafficTrends] = useState<TrafficTrend[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalVisits: 0,
    utmVisits: 0,
    organicVisits: 0,
    referralVisits: 0,
  });

  useEffect(() => {
    fetchMarketingData();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const fetchMarketingData = async () => {
    setLoading(true);
    const dateFilter = getDateFilter();

    try {
      // Fetch UTM data
      const { data: utmResults } = await supabase
        .from('page_views')
        .select('utm_source, utm_medium, utm_campaign, utm_content, utm_term, viewed_at')
        .gte('viewed_at', dateFilter)
        .not('utm_source', 'is', null);

      // Process UTM data into aggregates
      const utmAggregates: Record<string, UTMData> = {};
      utmResults?.forEach((row) => {
        const key = `${row.utm_source || ''}-${row.utm_medium || ''}-${row.utm_campaign || ''}`;
        if (!utmAggregates[key]) {
          utmAggregates[key] = {
            utm_source: row.utm_source,
            utm_medium: row.utm_medium,
            utm_campaign: row.utm_campaign,
            utm_content: row.utm_content,
            utm_term: row.utm_term,
            count: 0,
          };
        }
        utmAggregates[key].count++;
      });
      setUtmData(Object.values(utmAggregates).sort((a, b) => b.count - a.count));

      // Fetch referrer data
      const { data: referrerResults } = await supabase
        .from('page_views')
        .select('referrer, viewed_at')
        .gte('viewed_at', dateFilter)
        .not('referrer', 'is', null)
        .neq('referrer', '');

      // Process referrer data
      const referrerAggregates: Record<string, ReferrerData> = {};
      referrerResults?.forEach((row) => {
        try {
          const url = new URL(row.referrer || '');
          const domain = url.hostname;
          if (!referrerAggregates[domain]) {
            referrerAggregates[domain] = { referrer: domain, count: 0 };
          }
          referrerAggregates[domain].count++;
        } catch {
          // Invalid URL, skip
        }
      });
      setReferrerData(Object.values(referrerAggregates).sort((a, b) => b.count - a.count).slice(0, 10));

      // Fetch traffic trends
      const { data: trendResults } = await supabase
        .from('page_views')
        .select('viewed_at, utm_source')
        .gte('viewed_at', dateFilter)
        .order('viewed_at', { ascending: true });

      // Process into daily trends
      const trendMap: Record<string, { visits: number; utm_visits: number }> = {};
      trendResults?.forEach((row) => {
        const date = new Date(row.viewed_at).toLocaleDateString();
        if (!trendMap[date]) {
          trendMap[date] = { visits: 0, utm_visits: 0 };
        }
        trendMap[date].visits++;
        if (row.utm_source) {
          trendMap[date].utm_visits++;
        }
      });
      setTrafficTrends(Object.entries(trendMap).map(([date, data]) => ({
        date,
        visits: data.visits,
        utm_visits: data.utm_visits,
      })));

      // Calculate totals
      const { count: totalCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', dateFilter);

      const { count: utmCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', dateFilter)
        .not('utm_source', 'is', null);

      const { count: referralCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', dateFilter)
        .not('referrer', 'is', null)
        .neq('referrer', '');

      setTotals({
        totalVisits: totalCount || 0,
        utmVisits: utmCount || 0,
        organicVisits: (totalCount || 0) - (utmCount || 0) - (referralCount || 0),
        referralVisits: referralCount || 0,
      });

    } catch (error) {
      console.error('Error fetching marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sourceChartData = utmData.slice(0, 6).map((item) => ({
    name: item.utm_source || 'Unknown',
    value: item.count,
  }));

  const trafficSourcePie = [
    { name: 'UTM Tracked', value: totals.utmVisits },
    { name: 'Referral', value: totals.referralVisits },
    { name: 'Direct/Organic', value: totals.organicVisits },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Marketing & Attribution
          </h2>
          <p className="text-sm text-muted-foreground">Track campaign performance and traffic sources</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{totals.totalVisits.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">UTM Tracked</p>
                <p className="text-2xl font-bold">{totals.utmVisits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {totals.totalVisits > 0 ? ((totals.utmVisits / totals.totalVisits) * 100).toFixed(1) : 0}% of traffic
                </p>
              </div>
              <Target className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Referral Traffic</p>
                <p className="text-2xl font-bold">{totals.referralVisits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {totals.totalVisits > 0 ? ((totals.referralVisits / totals.totalVisits) * 100).toFixed(1) : 0}% of traffic
                </p>
              </div>
              <ExternalLink className="w-8 h-8 text-accent/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Direct/Organic</p>
                <p className="text-2xl font-bold">{totals.organicVisits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {totals.totalVisits > 0 ? ((totals.organicVisits / totals.totalVisits) * 100).toFixed(1) : 0}% of traffic
                </p>
              </div>
              <Globe className="w-8 h-8 text-secondary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Traffic Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Traffic Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trafficTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} name="Total Visits" />
                <Line type="monotone" dataKey="utm_visits" stroke="hsl(var(--accent))" strokeWidth={2} name="UTM Tracked" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Traffic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={trafficSourcePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {trafficSourcePie.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* UTM Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            UTM Campaign Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {utmData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No UTM-tagged traffic in this period</p>
              <p className="text-xs mt-1">Add UTM parameters to your marketing links to track campaigns</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utmData.slice(0, 15).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="outline">{row.utm_source || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.utm_medium || '-'}</TableCell>
                    <TableCell>{row.utm_campaign || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{row.utm_content || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrerData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No referral traffic in this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrerData.map((ref, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
                    <span className="text-sm">{ref.referrer}</span>
                  </div>
                  <Badge variant="secondary">{ref.count} visits</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}