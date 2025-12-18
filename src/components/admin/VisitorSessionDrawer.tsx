import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, Smartphone, Tablet, Globe, MapPin, Clock, 
  MousePointer, ArrowRight, ExternalLink, Eye, Wifi,
  Languages, Timer, Target, RefreshCw, Chrome, Activity,
  ScrollText
} from 'lucide-react';

interface PageView {
  id: string;
  page_path: string;
  viewed_at: string;
  referrer: string | null;
  scroll_depth_percent: number | null;
  time_on_page_ms: number | null;
  click_count: number | null;
  is_bounce: boolean | null;
  entry_page: boolean | null;
  exit_page: boolean | null;
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

interface VisitorSessionDrawerProps {
  session: VisitorSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VisitorSessionDrawer({ session, open, onOpenChange }: VisitorSessionDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [pageViews, setPageViews] = useState<PageView[]>([]);

  useEffect(() => {
    if (session && open) {
      fetchSessionDetails();
    }
  }, [session, open]);

  const fetchSessionDetails = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_views')
        .select('id, page_path, viewed_at, referrer, scroll_depth_percent, time_on_page_ms, click_count, is_bounce, entry_page, exit_page')
        .eq('visitor_id', session.visitor_id)
        .order('viewed_at', { ascending: true });

      if (error) throw error;
      setPageViews(data || []);
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device === 'Mobile') return <Smartphone className="w-5 h-5" />;
    if (device === 'Tablet') return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const getSessionDuration = () => {
    if (!session) return '-';
    const start = new Date(session.first_seen).getTime();
    const end = new Date(session.last_seen).getTime();
    return formatDuration(end - start);
  };

  const getReferrerDomain = (referrer: string | null) => {
    if (!referrer) return 'Direct';
    try {
      return new URL(referrer).hostname;
    } catch {
      return 'Direct';
    }
  };

  if (!session) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              {getDeviceIcon(session.device_type)}
            </div>
            <div>
              <SheetTitle className="text-left flex items-center gap-2">
                Visitor Session
                {session.is_returning && <Badge variant="outline">Returning</Badge>}
              </SheetTitle>
              <SheetDescription className="text-left font-mono text-xs">
                {session.visitor_id}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {/* Session Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-primary/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-lg font-bold">{pageViews.length}</p>
                        <p className="text-xs text-muted-foreground">Page Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-success/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-success" />
                      <div>
                        <p className="text-lg font-bold">{getSessionDuration()}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-lg font-bold">{session.total_clicks}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-lg font-bold">
                          {Math.round(pageViews.reduce((sum, v) => sum + (v.scroll_depth_percent || 0), 0) / (pageViews.length || 1))}%
                        </p>
                        <p className="text-xs text-muted-foreground">Avg Scroll</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Location & Device Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Visitor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{[session.city, session.region, session.country_code].filter(Boolean).join(', ') || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-muted-foreground" />
                        <span>{session.language || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{session.timezone || 'Unknown timezone'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-muted-foreground" />
                        <span>{session.connection_type || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.device_type)}
                        <span>{session.device_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chrome className="w-4 h-4 text-muted-foreground" />
                        <span>{session.browser}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                        <span>{session.os}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span>{session.screen_resolution || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Traffic Source */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Traffic Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{getReferrerDomain(session.referrer)}</Badge>
                    {session.referrer && (
                      <span className="text-muted-foreground truncate text-xs">{session.referrer}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Session Timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Session Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {pageViews.map((view, index) => (
                      <div key={view.id} className="relative">
                        {index < pageViews.length - 1 && (
                          <div className="absolute left-3 top-8 w-0.5 h-full bg-border" />
                        )}
                        <div className="flex items-start gap-3 p-2 hover:bg-secondary/30 rounded">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            view.entry_page ? 'bg-success/20 text-success' : 
                            view.exit_page ? 'bg-destructive/20 text-destructive' : 
                            'bg-secondary'
                          }`}>
                            {view.entry_page ? (
                              <ArrowRight className="w-3 h-3" />
                            ) : view.exit_page ? (
                              <ExternalLink className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono text-xs">
                                {view.page_path}
                              </Badge>
                              {view.entry_page && <Badge variant="outline" className="text-xs bg-success/10 text-success">Entry</Badge>}
                              {view.exit_page && <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive">Exit</Badge>}
                              {view.is_bounce && <Badge variant="outline" className="text-xs">Bounce</Badge>}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{format(new Date(view.viewed_at), 'h:mm:ss a')}</span>
                              {view.time_on_page_ms && (
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  {formatDuration(view.time_on_page_ms)}
                                </span>
                              )}
                              {view.scroll_depth_percent !== null && (
                                <span className="flex items-center gap-1">
                                  <ScrollText className="w-3 h-3" />
                                  {view.scroll_depth_percent}% scroll
                                </span>
                              )}
                              {view.click_count !== null && view.click_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <MousePointer className="w-3 h-3" />
                                  {view.click_count} clicks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Raw User Agent */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">User Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {session.user_agent || 'Unknown'}
                  </p>
                </CardContent>
              </Card>

              {/* Session Timestamps */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Session Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First Seen</span>
                    <span>{format(new Date(session.first_seen), 'MMM d, yyyy h:mm:ss a')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Seen</span>
                    <span>{format(new Date(session.last_seen), 'MMM d, yyyy h:mm:ss a')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
