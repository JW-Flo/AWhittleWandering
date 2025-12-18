import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Eye, 
  Globe, 
  Monitor, 
  Smartphone, 
  RefreshCw,
  TrendingUp,
  Clock,
  MapPin,
  ExternalLink,
  Activity,
  MousePointer
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface PageView {
  id: string;
  page_path: string;
  visitor_id: string;
  user_agent: string;
  referrer: string | null;
  viewed_at: string;
  country_code: string | null;
}

interface VisitorSession {
  visitor_id: string;
  first_seen: string;
  last_seen: string;
  page_views: number;
  pages_visited: string[];
  user_agent: string;
  referrer: string | null;
  device_type: string;
  browser: string;
  os: string;
}

interface AnalyticsSummary {
  total_views: number;
  unique_visitors: number;
  top_pages: { path: string; views: number }[];
  top_referrers: { referrer: string; count: number }[];
  views_by_day: { date: string; views: number; visitors: number }[];
  device_breakdown: { device: string; count: number }[];
  browser_breakdown: { browser: string; count: number }[];
}

function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const device = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 
                 /Tablet/.test(ua) ? 'Tablet' : 'Desktop';
  
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return { device, browser, os };
}

export function VisitorAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    total_views: 0,
    unique_visitors: 0,
    top_pages: [],
    top_referrers: [],
    views_by_day: [],
    device_breakdown: [],
    browser_breakdown: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('viewed_at', startDate.toISOString())
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      const views = data || [];
      setPageViews(views);

      // Group by visitor to create sessions
      const visitorMap = new Map<string, PageView[]>();
      views.forEach(view => {
        const existing = visitorMap.get(view.visitor_id || 'unknown') || [];
        existing.push(view);
        visitorMap.set(view.visitor_id || 'unknown', existing);
      });

      const sessionList: VisitorSession[] = [];
      visitorMap.forEach((visitorViews, visitorId) => {
        const sortedViews = visitorViews.sort((a, b) => 
          new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime()
        );
        const firstView = sortedViews[0];
        const lastView = sortedViews[sortedViews.length - 1];
        const parsed = parseUserAgent(firstView.user_agent || '');
        
        sessionList.push({
          visitor_id: visitorId,
          first_seen: firstView.viewed_at,
          last_seen: lastView.viewed_at,
          page_views: visitorViews.length,
          pages_visited: [...new Set(visitorViews.map(v => v.page_path))],
          user_agent: firstView.user_agent || '',
          referrer: firstView.referrer,
          device_type: parsed.device,
          browser: parsed.browser,
          os: parsed.os
        });
      });

      setSessions(sessionList.sort((a, b) => 
        new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
      ));

      // Calculate summary stats
      const pageCount = new Map<string, number>();
      const referrerCount = new Map<string, number>();
      const deviceCount = new Map<string, number>();
      const browserCount = new Map<string, number>();
      const dayCount = new Map<string, { views: number; visitors: Set<string> }>();

      views.forEach(view => {
        // Pages
        pageCount.set(view.page_path, (pageCount.get(view.page_path) || 0) + 1);
        
        // Referrers
        const ref = view.referrer ? new URL(view.referrer).hostname : 'Direct';
        referrerCount.set(ref, (referrerCount.get(ref) || 0) + 1);
        
        // Device & Browser
        const { device, browser } = parseUserAgent(view.user_agent || '');
        deviceCount.set(device, (deviceCount.get(device) || 0) + 1);
        browserCount.set(browser, (browserCount.get(browser) || 0) + 1);
        
        // By day
        const day = format(new Date(view.viewed_at), 'yyyy-MM-dd');
        const dayData = dayCount.get(day) || { views: 0, visitors: new Set<string>() };
        dayData.views++;
        dayData.visitors.add(view.visitor_id || 'unknown');
        dayCount.set(day, dayData);
      });

      setSummary({
        total_views: views.length,
        unique_visitors: visitorMap.size,
        top_pages: Array.from(pageCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([path, views]) => ({ path, views })),
        top_referrers: Array.from(referrerCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([referrer, count]) => ({ referrer, count })),
        views_by_day: Array.from(dayCount.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, data]) => ({ date, views: data.views, visitors: data.visitors.size })),
        device_breakdown: Array.from(deviceCount.entries())
          .map(([device, count]) => ({ device, count })),
        browser_breakdown: Array.from(browserCount.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([browser, count]) => ({ browser, count }))
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({ title: "Error", description: "Failed to fetch analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device === 'Mobile') return <Smartphone className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-lg">Visitor Analytics</h3>
          <p className="text-sm text-muted-foreground">Detailed visitor tracking and behavior analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{summary.total_views}</p>
                <p className="text-xs text-muted-foreground">Total Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{summary.unique_visitors}</p>
                <p className="text-xs text-muted-foreground">Unique Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MousePointer className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">
                  {summary.unique_visitors > 0 ? (summary.total_views / summary.unique_visitors).toFixed(1) : 0}
                </p>
                <p className="text-xs text-muted-foreground">Pages/Visitor</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.views_by_day.length}</p>
                <p className="text-xs text-muted-foreground">Active Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="sessions">Visitor Sessions</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Visitor Sessions</CardTitle>
              <CardDescription>Individual visitor journeys through your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sessions.slice(0, 50).map((session) => (
                  <div 
                    key={session.visitor_id} 
                    className="p-4 bg-secondary/30 rounded-lg border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.device_type)}
                        <span className="font-mono text-sm text-muted-foreground">
                          {session.visitor_id}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {session.page_views} views
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(session.last_seen), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {session.pages_visited.map((page, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-mono">
                          {page}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        {session.browser} / {session.os}
                      </span>
                      {session.referrer && (
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {(() => {
                            try {
                              return new URL(session.referrer).hostname;
                            } catch {
                              return 'Direct';
                            }
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No visitor sessions in this time period</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Most Visited Pages</CardTitle>
              <CardDescription>Pages ranked by total views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.top_pages.map((page, i) => (
                  <div 
                    key={page.path}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="font-mono text-sm">{page.path}</span>
                    </div>
                    <Badge variant="outline">{page.views} views</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Traffic Sources</CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.top_referrers.map((ref) => (
                  <div 
                    key={ref.referrer}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{ref.referrer}</span>
                    </div>
                    <Badge variant="outline">{ref.count} visits</Badge>
                  </div>
                ))}
                {summary.top_referrers.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">No referrer data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.device_breakdown.map((item) => (
                    <div 
                      key={item.device}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(item.device)}
                        <span>{item.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${(item.count / summary.total_views) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {Math.round((item.count / summary.total_views) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.browser_breakdown.map((item) => (
                    <div 
                      key={item.browser}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <span>{item.browser}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${(item.count / summary.total_views) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {Math.round((item.count / summary.total_views) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Real-time Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-success animate-pulse" />
            Recent Page Views
          </CardTitle>
          <CardDescription>Live feed of page views (last 20)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {pageViews.slice(0, 20).map((view) => (
              <div 
                key={view.id}
                className="flex items-center gap-3 py-2 px-3 text-sm hover:bg-secondary/30 rounded"
              >
                <span className="text-muted-foreground w-32 shrink-0">
                  {format(new Date(view.viewed_at), 'MMM d, h:mm:ss a')}
                </span>
                <Badge variant="secondary" className="font-mono shrink-0">
                  {view.page_path}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">
                  {view.visitor_id}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
