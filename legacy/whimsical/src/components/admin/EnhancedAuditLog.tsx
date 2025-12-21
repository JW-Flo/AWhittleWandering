import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Calendar as CalendarIcon, Filter, Save, Trash2, RefreshCw,
  Download, ChevronDown, User, Shield, FileText, Activity, Settings,
  Eye, Lock, Unlock, Bell, Database
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: unknown;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
}

interface FilterState {
  action: string;
  resourceType: string;
  userId: string;
  dateRange: { from: Date | undefined; to: Date | undefined };
  search: string;
}

const ACTION_CATEGORIES = {
  auth: ['admin_login', 'admin_logout', 'login', 'logout', 'signup', 'password_reset'],
  user_management: ['role_change', 'account_lock', 'account_unlock', 'account_suspend', 'view_user_data', 'export_user_data'],
  incidents: ['incident_create', 'incident_resolve'],
  dsar: ['dsar_view', 'dsar_process', 'dsar_submit'],
  settings: ['settings_change', 'privacy_update', 'notification_update', 'notification_toggle', 'vehicle_add', 'vehicle_edit', 'vehicle_delete', 'api_key_add', 'api_key_remove'],
  security: ['security_review', '2fa_enabled', '2fa_disabled', 'password_change'],
  journey: ['journey_create', 'journey_update', 'journey_delete', 'journey_publish', 'journey_view', 'journey_share', 'journey_follow', 'journey_unfollow'],
  analytics: ['analytics_view', 'report_generate', 'export_analytics'],
  navigation: ['page_view', 'navigate'],
  media: ['media_view', 'media_upload', 'media_delete', 'media_download', 'gallery_open'],
  social: ['social_share', 'social_connect', 'social_disconnect', 'follow_user', 'unfollow_user'],
  ui: ['button_click', 'tab_change', 'modal_open', 'modal_close', 'drawer_open', 'drawer_close', 'search', 'filter_apply', 'sort_change'],
  playback: ['waypoint_view', 'waypoint_click', 'route_playback_start', 'route_playback_pause', 'route_playback_complete'],
  map: ['map_zoom', 'map_pan', 'map_marker_click', 'map_load_failed'],
  errors: ['error_occurred'],
  features: ['feature_request_submit'],
};

const ACTION_ICONS: Record<string, typeof User> = {
  auth: User,
  user_management: Shield,
  incidents: Bell,
  dsar: FileText,
  settings: Settings,
  security: Lock,
  journey: Activity,
  analytics: Eye,
  navigation: Eye,
  media: FileText,
  social: User,
  ui: Activity,
  playback: Activity,
  map: Activity,
  errors: Bell,
  features: FileText,
};

export function EnhancedAuditLog() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    action: 'all',
    resourceType: 'all',
    userId: 'all',
    dateRange: { from: subDays(new Date(), 7), to: new Date() },
    search: ''
  });
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
    loadSavedViews();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters.action, filters.resourceType, filters.userId, filters.dateRange]);

  const loadSavedViews = () => {
    const stored = localStorage.getItem('audit_saved_views');
    if (stored) {
      try {
        const views = JSON.parse(stored);
        setSavedViews(views.map((v: SavedView) => ({
          ...v,
          filters: {
            ...v.filters,
            dateRange: {
              from: v.filters.dateRange.from ? new Date(v.filters.dateRange.from) : undefined,
              to: v.filters.dateRange.to ? new Date(v.filters.dateRange.to) : undefined,
            }
          }
        })));
      } catch (e) {
        console.error('Error loading saved views:', e);
      }
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (filters.dateRange.from) {
        query = query.gte('created_at', startOfDay(filters.dateRange.from).toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('created_at', endOfDay(filters.dateRange.to).toISOString());
      }
      if (filters.action !== 'all') {
        const categoryActions = ACTION_CATEGORIES[filters.action as keyof typeof ACTION_CATEGORIES];
        if (categoryActions) {
          query = query.in('action', categoryActions);
        } else {
          query = query.eq('action', filters.action);
        }
      }
      if (filters.resourceType !== 'all') {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters.userId !== 'all') {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
      
      // Extract unique user IDs for the filter dropdown
      const users = [...new Set((data || []).map(l => l.user_id))];
      setUniqueUsers(users);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({ title: 'Error', description: 'Failed to fetch audit logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    const metadataStr = log.metadata ? JSON.stringify(log.metadata) : '';
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource_type.toLowerCase().includes(searchLower) ||
      log.user_id.toLowerCase().includes(searchLower) ||
      (log.resource_id?.toLowerCase().includes(searchLower)) ||
      metadataStr.toLowerCase().includes(searchLower)
    );
  });

  const saveView = () => {
    if (!newViewName.trim()) return;
    const newView: SavedView = {
      id: Date.now().toString(),
      name: newViewName,
      filters: { ...filters }
    };
    const updated = [...savedViews, newView];
    setSavedViews(updated);
    localStorage.setItem('audit_saved_views', JSON.stringify(updated));
    setNewViewName('');
    setSaveDialogOpen(false);
    toast({ title: 'View Saved', description: `"${newViewName}" has been saved` });
  };

  const loadView = (view: SavedView) => {
    setFilters(view.filters);
    toast({ title: 'View Loaded', description: `Loaded "${view.name}"` });
  };

  const deleteView = (viewId: string) => {
    const updated = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updated);
    localStorage.setItem('audit_saved_views', JSON.stringify(updated));
    toast({ title: 'View Deleted' });
  };

  const exportLogs = () => {
    const exportData = filteredLogs.map(log => ({
      timestamp: log.created_at,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      user_id: log.user_id,
      metadata: log.metadata,
      ip_address: log.ip_address
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${filteredLogs.length} logs exported` });
  };

  const getActionCategory = (action: string): string => {
    for (const [category, actions] of Object.entries(ACTION_CATEGORIES)) {
      if (actions.includes(action)) return category;
    }
    return 'other';
  };

  const getActionColor = (action: string): string => {
    const category = getActionCategory(action);
    const colors: Record<string, string> = {
      auth: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      user_management: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      incidents: 'bg-destructive/20 text-destructive border-destructive/30',
      dsar: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      settings: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      security: 'bg-success/20 text-success border-success/30',
      journey: 'bg-primary/20 text-primary border-primary/30',
      analytics: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10"
          />
        </div>

        <Select value={filters.action} onValueChange={(v) => setFilters(prev => ({ ...prev, action: v }))}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="auth">Authentication</SelectItem>
            <SelectItem value="user_management">User Management</SelectItem>
            <SelectItem value="navigation">Page Views</SelectItem>
            <SelectItem value="journey">Journeys</SelectItem>
            <SelectItem value="playback">Route Playback</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="ui">UI Interactions</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="incidents">Incidents</SelectItem>
            <SelectItem value="dsar">DSAR</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="map">Map</SelectItem>
            <SelectItem value="errors">Errors</SelectItem>
            <SelectItem value="features">Feature Requests</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.resourceType} onValueChange={(v) => setFilters(prev => ({ ...prev, resourceType: v }))}>
          <SelectTrigger className="w-[140px]">
            <Database className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="journey">Journey</SelectItem>
            <SelectItem value="page">Pages</SelectItem>
            <SelectItem value="ui">UI</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="playback">Playback</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="search">Search</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
            <SelectItem value="admin_portal">Admin Portal</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
          </SelectContent>
        </Select>

        {uniqueUsers.length > 1 && (
          <Select value={filters.userId} onValueChange={(v) => setFilters(prev => ({ ...prev, userId: v }))}>
            <SelectTrigger className="w-[160px]">
              <User className="w-4 h-4 mr-2" />
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users ({uniqueUsers.length})</SelectItem>
              {uniqueUsers.map(userId => (
                <SelectItem key={userId} value={userId}>
                  {userId.substring(0, 8)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {filters.dateRange.from ? (
                filters.dateRange.to ? (
                  `${format(filters.dateRange.from, 'MMM d')} - ${format(filters.dateRange.to, 'MMM d')}`
                ) : (
                  format(filters.dateRange.from, 'MMM d, yyyy')
                )
              ) : (
                'Pick date range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
              onSelect={(range) => setFilters(prev => ({
                ...prev,
                dateRange: { from: range?.from, to: range?.to }
              }))}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Saved Views & Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {savedViews.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Saved Views
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-1">
                  {savedViews.map((view) => (
                    <div key={view.id} className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded">
                      <button className="flex-1 text-left text-sm" onClick={() => loadView(view)}>
                        {view.name}
                      </button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteView(view.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Current View</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="viewName">View Name</Label>
                <Input
                  id="viewName"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g., Security Events Last Week"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveView} disabled={!newViewName.trim()}>Save View</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{filteredLogs.length} events</span>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No audit events found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const ActionIcon = ACTION_ICONS[getActionCategory(log.action)] || Activity;
            const isExpanded = expandedLog === log.id;
            
            return (
              <Card 
                key={log.id} 
                className={`cursor-pointer transition-colors hover:bg-secondary/30 ${isExpanded ? 'ring-1 ring-primary/50' : ''}`}
                onClick={() => setExpandedLog(isExpanded ? null : log.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <ActionIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground w-32 shrink-0">
                          {format(new Date(log.created_at), 'MMM d, h:mm a')}
                        </span>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{log.resource_type}</span>
                        {log.resource_id && (
                          <span className="text-xs font-mono text-muted-foreground">
                            {log.resource_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-secondary/30 rounded text-sm space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">User ID:</span>
                              <span className="ml-2 font-mono text-xs">{log.user_id}</span>
                            </div>
                            {log.ip_address && (
                              <div>
                                <span className="text-muted-foreground">IP:</span>
                                <span className="ml-2 font-mono text-xs">{log.ip_address}</span>
                              </div>
                            )}
                          </div>
                          {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata as Record<string, unknown>).length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Details:</span>
                              <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
