import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { VisitorSessionDrawer } from './VisitorSessionDrawer';
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
  MousePointer,
  Tablet,
  Wifi,
  Languages,
  Timer,
  Target,
  ArrowRight,
  Repeat,
  Chrome,
  Megaphone,
  Download
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

interface PageView {
  id: string;
  page_path: string;
  visitor_id: string;
  user_agent: string;
  referrer: string | null;
  viewed_at: string;
  country_code: string | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  timezone: string | null;
  session_id: string | null;
  scroll_depth_percent: number | null;
  time_on_page_ms: number | null;
  click_count: number | null;
  is_bounce: boolean | null;
  entry_page: boolean | null;
  exit_page: boolean | null;
  device_type: string | null;
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  os_version: string | null;
  city: string | null;
  region: string | null;
  connection_type: string | null;
  is_returning_visitor: boolean | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
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
  screen_resolution: string | null;
  language: string | null;
  timezone: string | null;
  is_returning: boolean;
  avg_time_on_page: number | null;
  total_clicks: number;
  city: string | null;
  region: string | null;
  country_code: string | null;
  connection_type: string | null;
}

interface AnalyticsSummary {
  total_views: number;
  unique_visitors: number;
  returning_visitors: number;
  new_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  avg_pages_per_session: number;
  top_pages: { path: string; views: number; avg_time: number }[];
  top_referrers: { referrer: string; count: number }[];
  views_by_day: { date: string; views: number; visitors: number }[];
  device_breakdown: { device: string; count: number }[];
  browser_breakdown: { browser: string; count: number }[];
  os_breakdown: { os: string; count: number }[];
  screen_resolutions: { resolution: string; count: number }[];
  languages: { language: string; count: number }[];
  timezones: { timezone: string; count: number }[];
  utm_campaigns: { source: string; medium: string; campaign: string; count: number }[];
  connection_types: { type: string; count: number }[];
}

export function VisitorAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<VisitorSession | null>(null);
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    total_views: 0,
    unique_visitors: 0,
    returning_visitors: 0,
    new_visitors: 0,
    bounce_rate: 0,
    avg_session_duration: 0,
    avg_pages_per_session: 0,
    top_pages: [],
    top_referrers: [],
    views_by_day: [],
    device_breakdown: [],
    browser_breakdown: [],
    os_breakdown: [],
    screen_resolutions: [],
    languages: [],
    timezones: [],
    utm_campaigns: [],
    connection_types: []
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

      const views = (data || []) as PageView[];
      setPageViews(views);

      // Group by visitor to create sessions
      const visitorMap = new Map<string, PageView[]>();
      views.forEach(view => {
        const existing = visitorMap.get(view.visitor_id || 'unknown') || [];
        existing.push(view);
        visitorMap.set(view.visitor_id || 'unknown', existing);
      });

      const sessionList: VisitorSession[] = [];
      let totalTimeOnPage = 0;
      let timeOnPageCount = 0;

      visitorMap.forEach((visitorViews, visitorId) => {
        const sortedViews = visitorViews.sort((a, b) => 
          new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime()
        );
        const firstView = sortedViews[0];
        const lastView = sortedViews[sortedViews.length - 1];
        
        // Calculate avg time on page for this session
        const sessionTimes = visitorViews.filter(v => v.time_on_page_ms).map(v => v.time_on_page_ms!);
        const avgTimeOnPage = sessionTimes.length > 0 
          ? sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length 
          : null;
        
        if (avgTimeOnPage) {
          totalTimeOnPage += avgTimeOnPage;
          timeOnPageCount++;
        }
        
        const totalClicks = visitorViews.reduce((sum, v) => sum + (v.click_count || 0), 0);
        
        sessionList.push({
          visitor_id: visitorId,
          first_seen: firstView.viewed_at,
          last_seen: lastView.viewed_at,
          page_views: visitorViews.length,
          pages_visited: [...new Set(visitorViews.map(v => v.page_path))],
          user_agent: firstView.user_agent || '',
          referrer: firstView.referrer,
          device_type: firstView.device_type || 'Desktop',
          browser: firstView.browser || 'Unknown',
          os: firstView.os || 'Unknown',
          screen_resolution: firstView.screen_width && firstView.screen_height 
            ? `${firstView.screen_width}x${firstView.screen_height}` 
            : null,
          language: firstView.language,
          timezone: firstView.timezone,
          is_returning: firstView.is_returning_visitor || false,
          avg_time_on_page: avgTimeOnPage,
          total_clicks: totalClicks,
          city: firstView.city,
          region: firstView.region,
          country_code: firstView.country_code,
          connection_type: firstView.connection_type
        });
      });

      setSessions(sessionList.sort((a, b) => 
        new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
      ));

      // Calculate summary stats
      const pageCount = new Map<string, { views: number; totalTime: number; timeCount: number }>();
      const referrerCount = new Map<string, number>();
      const deviceCount = new Map<string, number>();
      const browserCount = new Map<string, number>();
      const osCount = new Map<string, number>();
      const resolutionCount = new Map<string, number>();
      const languageCount = new Map<string, number>();
      const timezoneCount = new Map<string, number>();
      const utmCount = new Map<string, number>();
      const connectionCount = new Map<string, number>();
      const dayCount = new Map<string, { views: number; visitors: Set<string> }>();

      let returningVisitors = 0;
      let bounceCount = 0;

      views.forEach(view => {
        // Pages with time tracking
        const pageData = pageCount.get(view.page_path) || { views: 0, totalTime: 0, timeCount: 0 };
        pageData.views++;
        if (view.time_on_page_ms) {
          pageData.totalTime += view.time_on_page_ms;
          pageData.timeCount++;
        }
        pageCount.set(view.page_path, pageData);
        
        // Referrers
        try {
          const ref = view.referrer ? new URL(view.referrer).hostname : 'Direct';
          referrerCount.set(ref, (referrerCount.get(ref) || 0) + 1);
        } catch {
          referrerCount.set('Direct', (referrerCount.get('Direct') || 0) + 1);
        }
        
        // Device & Browser & OS
        const device = view.device_type || 'Desktop';
        deviceCount.set(device, (deviceCount.get(device) || 0) + 1);
        
        const browser = view.browser || 'Unknown';
        browserCount.set(browser, (browserCount.get(browser) || 0) + 1);
        
        const os = view.os || 'Unknown';
        osCount.set(os, (osCount.get(os) || 0) + 1);
        
        // Screen resolution
        if (view.screen_width && view.screen_height) {
          const res = `${view.screen_width}x${view.screen_height}`;
          resolutionCount.set(res, (resolutionCount.get(res) || 0) + 1);
        }
        
        // Language
        if (view.language) {
          const lang = view.language.split('-')[0].toUpperCase();
          languageCount.set(lang, (languageCount.get(lang) || 0) + 1);
        }
        
        // Timezone
        if (view.timezone) {
          timezoneCount.set(view.timezone, (timezoneCount.get(view.timezone) || 0) + 1);
        }
        
        // UTM Campaigns
        if (view.utm_source) {
          const utmKey = `${view.utm_source}|${view.utm_medium || 'none'}|${view.utm_campaign || 'none'}`;
          utmCount.set(utmKey, (utmCount.get(utmKey) || 0) + 1);
        }
        
        // Connection type
        if (view.connection_type) {
          connectionCount.set(view.connection_type, (connectionCount.get(view.connection_type) || 0) + 1);
        }
        
        // By day
        const day = format(new Date(view.viewed_at), 'yyyy-MM-dd');
        const dayData = dayCount.get(day) || { views: 0, visitors: new Set<string>() };
        dayData.views++;
        dayData.visitors.add(view.visitor_id || 'unknown');
        dayCount.set(day, dayData);
        
        // Returning & Bounce
        if (view.is_returning_visitor) returningVisitors++;
        if (view.is_bounce) bounceCount++;
      });

      const uniqueVisitors = visitorMap.size;
      const newVisitors = sessionList.filter(s => !s.is_returning).length;
      const returningUnique = sessionList.filter(s => s.is_returning).length;

      setSummary({
        total_views: views.length,
        unique_visitors: uniqueVisitors,
        returning_visitors: returningUnique,
        new_visitors: newVisitors,
        bounce_rate: views.length > 0 ? (bounceCount / views.length) * 100 : 0,
        avg_session_duration: timeOnPageCount > 0 ? totalTimeOnPage / timeOnPageCount : 0,
        avg_pages_per_session: uniqueVisitors > 0 ? views.length / uniqueVisitors : 0,
        top_pages: Array.from(pageCount.entries())
          .sort((a, b) => b[1].views - a[1].views)
          .slice(0, 10)
          .map(([path, data]) => ({ 
            path, 
            views: data.views, 
            avg_time: data.timeCount > 0 ? data.totalTime / data.timeCount : 0 
          })),
        top_referrers: Array.from(referrerCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([referrer, count]) => ({ referrer, count })),
        views_by_day: Array.from(dayCount.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, data]) => ({ date, views: data.views, visitors: data.visitors.size })),
        device_breakdown: Array.from(deviceCount.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([device, count]) => ({ device, count })),
        browser_breakdown: Array.from(browserCount.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([browser, count]) => ({ browser, count })),
        os_breakdown: Array.from(osCount.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([os, count]) => ({ os, count })),
        screen_resolutions: Array.from(resolutionCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([resolution, count]) => ({ resolution, count })),
        languages: Array.from(languageCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([language, count]) => ({ language, count })),
        timezones: Array.from(timezoneCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([timezone, count]) => ({ timezone, count })),
        utm_campaigns: Array.from(utmCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([key, count]) => {
            const [source, medium, campaign] = key.split('|');
            return { source, medium, campaign, count };
          }),
        connection_types: Array.from(connectionCount.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => ({ type, count }))
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({ title: "Error", description: "Failed to fetch analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const exportObj = {
      exported_at: new Date().toISOString(),
      date_range: `Last ${dateRange} days`,
      summary,
      sessions,
      raw_views: pageViews
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Analytics data exported successfully' });
  };

  const getDeviceIcon = (device: string) => {
    if (device === 'Mobile') return <Smartphone className="w-4 h-4" />;
    if (device === 'Tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-lg">Visitor Analytics</h3>
          <p className="text-sm text-muted-foreground">Comprehensive visitor tracking and behavior analysis</p>
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
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{summary.total_views.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{summary.unique_visitors.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Unique Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Repeat className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{summary.returning_visitors}</p>
                <p className="text-xs text-muted-foreground">Returning Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.new_visitors}</p>
                <p className="text-xs text-muted-foreground">New Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-destructive" />
              <div>
                <p className="text-xl font-bold">{summary.bounce_rate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-primary" />
              <div>
                <p className="text-xl font-bold">{formatDuration(summary.avg_session_duration)}</p>
                <p className="text-xs text-muted-foreground">Avg Time on Page</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MousePointer className="w-6 h-6 text-amber-500" />
              <div>
                <p className="text-xl font-bold">{summary.avg_pages_per_session.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Pages/Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-success" />
              <div>
                <p className="text-xl font-bold">{summary.views_by_day.length}</p>
                <p className="text-xs text-muted-foreground">Active Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="bg-secondary flex-wrap h-auto">
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="geo">Geography</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visitor Sessions</CardTitle>
              <CardDescription>Detailed view of each visitor's journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {sessions.slice(0, 50).map((session) => (
                  <div 
                    key={session.visitor_id} 
                    className="p-4 bg-secondary/30 rounded-lg border border-border/50 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                    onClick={() => {
                      setSelectedSession(session);
                      setSessionDrawerOpen(true);
                    }}
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
                        {session.is_returning && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400">
                            Returning
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(session.last_seen), 'MMM d, h:mm a')}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {session.pages_visited.map((page, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-mono">
                          {page}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
                      {(session.city || session.region || session.country_code) && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <MapPin className="w-3 h-3" />
                          {[session.city, session.region, session.country_code].filter(Boolean).join(', ')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Chrome className="w-3 h-3" />
                        {session.browser} / {session.os}
                      </span>
                      {session.screen_resolution && (
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          {session.screen_resolution}
                        </span>
                      )}
                      {session.language && (
                        <span className="flex items-center gap-1">
                          <Languages className="w-3 h-3" />
                          {session.language}
                        </span>
                      )}
                      {session.timezone && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.timezone}
                        </span>
                      )}
                      {session.connection_type && (
                        <span className="flex items-center gap-1">
                          <Wifi className="w-3 h-3" />
                          {session.connection_type}
                        </span>
                      )}
                      {session.avg_time_on_page && (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {formatDuration(session.avg_time_on_page)} avg
                        </span>
                      )}
                      {session.total_clicks > 0 && (
                        <span className="flex items-center gap-1">
                          <MousePointer className="w-3 h-3" />
                          {session.total_clicks} clicks
                        </span>
                      )}
                      {session.referrer && (
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {(() => {
                            try { return new URL(session.referrer).hostname; } 
                            catch { return 'Direct'; }
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
              <CardDescription>Pages ranked by views with engagement metrics</CardDescription>
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
                    <div className="flex items-center gap-3">
                      {page.avg_time > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {formatDuration(page.avg_time)}
                        </span>
                      )}
                      <Badge variant="outline">{page.views} views</Badge>
                    </div>
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
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.device_breakdown.map((item) => (
                    <div key={item.device} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(item.device)}
                        <span>{item.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-secondary rounded-full h-2 overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${(item.count / summary.total_views) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
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
                  {summary.browser_breakdown.slice(0, 5).map((item) => (
                    <div key={item.browser} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span>{item.browser}</span>
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Operating Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.os_breakdown.slice(0, 5).map((item) => (
                    <div key={item.os} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span>{item.os}</span>
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Screen Resolutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {summary.screen_resolutions.map((item) => (
                  <Badge key={item.resolution} variant="outline" className="font-mono">
                    {item.resolution} ({item.count})
                  </Badge>
                ))}
                {summary.screen_resolutions.length === 0 && (
                  <p className="text-muted-foreground">No screen resolution data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geo" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Languages className="w-4 h-4" /> Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.languages.map((item) => (
                    <div key={item.language} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span>{item.language}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                  {summary.languages.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">No language data</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Timezones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.timezones.map((item) => (
                    <div key={item.timezone} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="text-sm truncate">{item.timezone}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                  {summary.timezones.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">No timezone data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {summary.connection_types.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> Connection Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary.connection_types.map((item) => (
                    <Badge key={item.type} variant="outline">
                      {item.type} ({item.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> UTM Campaigns
              </CardTitle>
              <CardDescription>Marketing campaign performance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.utm_campaigns.length > 0 ? (
                <div className="space-y-2">
                  {summary.utm_campaigns.map((item, i) => (
                    <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.source}</Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <Badge variant="secondary">{item.medium}</Badge>
                        </div>
                        <Badge>{item.count} visits</Badge>
                      </div>
                      {item.campaign !== 'none' && (
                        <p className="text-xs text-muted-foreground">Campaign: {item.campaign}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No UTM campaign data yet</p>
                  <p className="text-xs">Add ?utm_source=... to your links to track campaigns</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-success animate-pulse" />
            Live Page Views
          </CardTitle>
          <CardDescription>Real-time feed of page views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {pageViews.slice(0, 25).map((view) => (
              <div 
                key={view.id}
                className="flex items-center gap-3 py-2 px-3 text-sm hover:bg-secondary/30 rounded"
              >
                <span className="text-muted-foreground w-36 shrink-0">
                  {format(new Date(view.viewed_at), 'MMM d, h:mm:ss a')}
                </span>
                {getDeviceIcon(view.device_type || 'Desktop')}
                <Badge variant="secondary" className="font-mono shrink-0">
                  {view.page_path}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {view.browser} / {view.os}
                </span>
                {view.is_returning_visitor && (
                  <Badge variant="outline" className="text-xs">Returning</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    
    {/* Visitor Session Drawer */}
    <VisitorSessionDrawer
      session={selectedSession}
      open={sessionDrawerOpen}
      onOpenChange={setSessionDrawerOpen}
    />
    </>
  );
}
