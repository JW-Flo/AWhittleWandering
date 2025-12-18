import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAudit } from '@/hooks/useAdminAudit';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings';
import FeatureRequestWidget from '@/components/FeatureRequestWidget';
import { PreLaunchChecklist } from '@/components/admin/PreLaunchChecklist';
import { VisitorAnalytics } from '@/components/admin/VisitorAnalytics';
import { UserDetailDrawer } from '@/components/admin/UserDetailDrawer';
import { EnhancedAuditLog } from '@/components/admin/EnhancedAuditLog';
import { IncidentDetailDrawer } from '@/components/admin/IncidentDetailDrawer';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import MarketingDashboard from '@/components/admin/MarketingDashboard';
import { UserFeedback } from '@/components/admin/UserFeedback';
import { BetaAccessAudit } from '@/components/admin/BetaAccessAudit';
import { GPSWaypointRebuild } from '@/components/admin/GPSWaypointRebuild';
import { WaypointDetailsEditor } from '@/components/admin/WaypointDetailsEditor';
import { 
  Shield, 
  Users, 
  Database, 
  ChevronLeft,
  AlertTriangle,
  Search,
  RefreshCw,
  Car,
  Image,
  FileText,
  Lock,
  Eye,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Gauge,
  ScrollText,
  Zap,
  Settings,
  ExternalLink,
  LockKeyhole,
  Unlock,
  ShieldAlert,
  Bell,
  Plug,
  Send,
  Rocket,
  BarChart3,
  Megaphone,
  ArrowRight,
  MessageSquare,
  Key,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  phone?: string;
  full_name: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  role: string;
  account_status?: string;
  last_sign_in_at?: string;
  last_active_at?: string;
  journey_count?: number;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  providers?: string[];
}

interface Stats {
  totalUsers: number;
  totalJourneys: number;
  totalWaypoints: number;
  totalMedia: number;
  activeToday: number;
  dsarRequests: number;
  openIncidents: number;
  pageViews: number;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: unknown;
  created_at: string;
}

interface DSARRequest {
  id: string;
  action: string;
  metadata: {
    request_type: string;
    email: string;
    name: string;
    details: string;
    submitted_at: string;
    is_authenticated: boolean;
  };
  created_at: string;
}

interface Incident {
  id: string;
  user_id: string;
  incident_type: string;
  severity: string;
  description: string;
  action_taken: string;
  notification_sent: boolean;
  notification_channels: string[];
  resolved: boolean;
  created_at: string;
}

const API_PROVIDERS = [
  { id: 'tessie', name: 'Tessie', makes: ['Tesla'], status: 'active', logo: '⚡' },
  { id: 'tesla-fleet', name: 'Tesla Fleet API', makes: ['Tesla'], status: 'active', logo: '🚗' },
  { id: 'smartcar', name: 'Smartcar', makes: ['Universal'], status: 'planned', logo: '🔌' },
  { id: 'rivian', name: 'Rivian API', makes: ['Rivian'], status: 'planned', logo: '🏔️' },
  { id: 'ford', name: 'Ford Pass', makes: ['Ford'], status: 'planned', logo: '🔵' },
  { id: 'gm', name: 'GM OnStar', makes: ['Chevrolet', 'GMC', 'Cadillac'], status: 'planned', logo: '🌟' },
];

export default function Admin() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logRoleChange, logAccountAction, logDataExport, logAdminAccess, logSecurityReview } = useAdminAudit();
  const { logPageView, logTabChange } = useActivityLogger();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    totalUsers: 0, totalJourneys: 0, totalWaypoints: 0, totalMedia: 0,
    activeToday: 0, dsarRequests: 0, openIncidents: 0, pageViews: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dsarRequests, setDsarRequests] = useState<DSARRequest[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('launch');
  
  // Incident dialog state
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [incidentAction, setIncidentAction] = useState<'lock' | 'suspend'>('lock');
  const [incidentReason, setIncidentReason] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [sendNotifications, setSendNotifications] = useState(true);
  const [processingIncident, setProcessingIncident] = useState(false);
  
  // User detail drawer state
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<UserData | null>(null);
  
  // Incident detail drawer state
  const [incidentDetailOpen, setIncidentDetailOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkAdminAccess();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (error) throw error;
      if (!data) {
        toast({ title: "Access Denied", description: "You don't have admin privileges", variant: "destructive" });
        navigate('/dashboard');
        return;
      }
      setIsAdmin(true);
      
      // Log admin portal access for audit
      logAdminAccess('admin_portal_login');
      logPageView('/admin');
      
      fetchData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch users with emails via admin edge function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list_users' }
      });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        // Fallback to profiles if edge function fails
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, display_name, created_at, user_id, account_status, last_active_at');
        const { data: roles } = await supabase.from('user_roles').select('user_id, role');
        
        const fallbackUsers = profiles?.map(profile => ({
          id: profile.user_id,
          email: profile.display_name || profile.full_name || 'Unknown User',
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: roles?.find(r => r.user_id === profile.user_id)?.role || 'user',
          account_status: profile.account_status || 'active',
          last_active_at: profile.last_active_at
        })) || [];
        setUsers(fallbackUsers);
      } else {
        setUsers(usersData.users || []);
      }

      // Get user count from the fetched users data
      const userCount = usersData?.users?.length || 0;

      const [journeysRes, waypointsRes, mediaRes, auditRes, incidentsRes, pageViewsRes] = await Promise.all([
        supabase.from('journeys').select('id', { count: 'exact', head: true }),
        supabase.from('drive_data').select('id', { count: 'exact', head: true }),
        supabase.from('journey_media').select('id', { count: 'exact', head: true }),
        supabase.from('security_audit_log').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('incident_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('page_views').select('id', { count: 'exact', head: true })
      ]);

      const dsarCount = auditRes.data?.filter(log => log.action.startsWith('dsar_')).length || 0;
      const openIncidents = incidentsRes.data?.filter(i => !i.resolved).length || 0;

      setStats({
        totalUsers: userCount,
        totalJourneys: journeysRes.count || 0,
        totalWaypoints: waypointsRes.count || 0,
        totalMedia: mediaRes.count || 0,
        activeToday: 0,
        dsarRequests: dsarCount,
        openIncidents,
        pageViews: pageViewsRes.count || 0
      });

      setAuditLogs(auditRes.data || []);
      setIncidents(incidentsRes.data as Incident[] || []);

      const dsars = (auditRes.data || [])
        .filter(log => log.action === 'dsar_submit' || log.action.startsWith('dsar_'))
        .map(log => ({
          id: log.id,
          action: log.action,
          metadata: log.metadata as DSARRequest['metadata'],
          created_at: log.created_at
        }));
      setDsarRequests(dsars);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: "Error", description: "Failed to fetch admin data", variant: "destructive" });
    }
  };

  const handleIncidentAction = async () => {
    if (!selectedUser || !incidentReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason", variant: "destructive" });
      return;
    }

    setProcessingIncident(true);
    try {
      const response = await supabase.functions.invoke('incident-remediation', {
        body: {
          action: incidentAction,
          userId: selectedUser.id,
          reason: incidentReason,
          severity: incidentSeverity,
          sendNotifications
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      // Log the account action for audit
      await logAccountAction(
        incidentAction === 'lock' ? 'account_lock' : 'account_suspend',
        selectedUser.id,
        incidentReason,
        incidentSeverity
      );
      
      toast({
        title: "Incident Processed",
        description: `Account ${incidentAction}ed. ${result.notificationsSent ? `Notifications sent via: ${result.notificationChannels.join(', ')}` : 'No notifications sent.'}`,
      });

      setIncidentDialogOpen(false);
      setIncidentReason('');
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Error processing incident:', error);
      toast({ title: "Error", description: "Failed to process incident", variant: "destructive" });
    } finally {
      setProcessingIncident(false);
    }
  };

  const handleUnlockAccount = async (userId: string) => {
    try {
      const response = await supabase.functions.invoke('incident-remediation', {
        body: {
          action: 'unlock',
          userId,
          reason: 'Account unlocked by admin',
          severity: 'low',
          sendNotifications: false
        }
      });

      if (response.error) throw response.error;
      
      // Log the unlock action for audit
      await logAccountAction('account_unlock', userId, 'Account unlocked by admin');
      
      toast({ title: "Account Unlocked", description: "User can now access their account" });
      fetchData();
    } catch (error) {
      console.error('Error unlocking account:', error);
      toast({ title: "Error", description: "Failed to unlock account", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilter === 'all') return true;
    if (auditFilter === 'security') return log.resource_type === 'security' || log.action.includes('login');
    if (auditFilter === 'dsar') return log.action.startsWith('dsar_');
    if (auditFilter === 'incidents') return log.action.includes('incident') || log.action.includes('account_');
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'outline' | 'destructive' | 'secondary', className: string }> = {
      active: { variant: 'outline', className: 'border-success/50 text-success' },
      locked: { variant: 'destructive', className: '' },
      suspended: { variant: 'destructive', className: 'bg-amber-500' },
      pending_review: { variant: 'secondary', className: 'bg-blue-500/20 text-blue-500' }
    };
    const config = variants[status] || variants.active;
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user' | 'premium') => {
    try {
      const currentUser = users.find(u => u.id === userId);
      const oldRole = currentUser?.role || 'user';
      
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });
      if (error) throw error;
      
      // Log the role change for audit
      await logRoleChange(userId, oldRole, newRole);
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: "Role Updated", description: `User role changed to ${newRole}` });
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    }
  };

  const exportUserData = async (userId: string, email: string) => {
    try {
      // Log the data export for audit
      await logDataExport(userId);
      
      const [profileRes, journeysRes, mediaRes, prefsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('journeys').select('*').eq('user_id', userId),
        supabase.from('journey_media').select('*').eq('user_id', userId),
        supabase.from('notification_preferences').select('*').eq('user_id', userId).single()
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedFor: email,
        profile: profileRes.data,
        journeys: journeysRes.data,
        media: mediaRes.data?.map(m => ({ ...m, file_url: '[REDACTED]' })),
        notificationPreferences: prefsRes.data
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${userId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Data Exported" });
    } catch (error) {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Dashboard</Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />Admin Portal
              </h1>
              <p className="text-sm text-muted-foreground">Manage users, security, incidents & integrations</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-1" />Refresh
              </Button>
              <Badge variant="outline" className="border-primary/50 text-primary">Admin</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Unified Navigation Tabs with Metrics */}
        <Card className="card-nature">
          <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); logTabChange(`admin_${tab}`); }}>
            <CardHeader className="pb-4">
              <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1.5 w-full justify-start">
                <TabsTrigger value="launch" className="gap-1.5">
                  <Rocket className="w-4 h-4" />Launch
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1.5">
                  <BarChart3 className="w-4 h-4" />Analytics
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-success/20 text-success">{stats.pageViews.toLocaleString()}</Badge>
                </TabsTrigger>
                <TabsTrigger value="marketing" className="gap-1.5">
                  <Megaphone className="w-4 h-4" />Marketing
                </TabsTrigger>
                <TabsTrigger value="feedback" className="gap-1.5">
                  <MessageSquare className="w-4 h-4" />Feedback
                </TabsTrigger>
                <TabsTrigger value="beta" className="gap-1.5">
                  <Key className="w-4 h-4" />Beta
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-1.5">
                  <Users className="w-4 h-4" />Users
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.totalUsers}</Badge>
                </TabsTrigger>
                <TabsTrigger value="incidents" className="gap-1.5">
                  <ShieldAlert className="w-4 h-4" />Incidents
                  {stats.openIncidents > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{stats.openIncidents}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="integrations" className="gap-1.5">
                  <Plug className="w-4 h-4" />Integrations
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5">
                  <Lock className="w-4 h-4" />Security
                </TabsTrigger>
                <TabsTrigger value="dsar" className="gap-1.5">
                  <FileText className="w-4 h-4" />DSAR
                  {stats.dsarRequests > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-blue-500/20 text-blue-400">{stats.dsarRequests}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5">
                  <ScrollText className="w-4 h-4" />Audit
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-amber-500/20 text-amber-400">{auditLogs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="gps" className="gap-1.5">
                  <Navigation className="w-4 h-4" />GPS
                </TabsTrigger>
                <TabsTrigger value="system" className="gap-1.5">
                  <Database className="w-4 h-4" />System
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.totalJourneys}J / {stats.totalWaypoints.toLocaleString()}D / {stats.totalMedia}M</Badge>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              {/* Launch Checklist Tab */}
              <TabsContent value="launch" className="mt-0">
                <PreLaunchChecklist />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-0">
                <VisitorAnalytics />
              </TabsContent>

              {/* Marketing Tab */}
              <TabsContent value="marketing" className="mt-0">
                <MarketingDashboard />
              </TabsContent>

              {/* User Feedback Tab */}
              <TabsContent value="feedback" className="mt-0">
                <UserFeedback />
              </TabsContent>

              {/* Beta Access Audit Tab */}
              <TabsContent value="beta" className="mt-0">
                <BetaAccessAudit />
              </TabsContent>

              {/* GPS Waypoint Rebuild Tab */}
              <TabsContent value="gps" className="mt-0">
                <div className="space-y-6">
                  <GPSWaypointRebuild />
                  <WaypointDetailsEditor />
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="mt-0">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setDetailUser(u);
                          setUserDetailOpen(true);
                          logAdminAccess(`view_user_${u.id}`);
                        }}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium hover:text-primary transition-colors">{u.full_name || u.display_name || 'No name'}</p>
                          {getStatusBadge(u.account_status || 'active')}
                          {u.journey_count && u.journey_count > 0 && (
                            <Badge variant="outline" className="text-xs">{u.journey_count} journeys</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-primary">{u.email}</p>
                          {u.phone && <p className="text-sm text-muted-foreground">📱 {u.phone}</p>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Joined {format(new Date(u.created_at), 'MMM d, yyyy')}</span>
                          {u.last_sign_in_at && <span>Last login: {format(new Date(u.last_sign_in_at), 'MMM d, h:mm a')}</span>}
                          {u.email_enabled && <span className="text-success">📧 Email</span>}
                          {u.sms_enabled && <span className="text-success">💬 SMS</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v as 'admin' | 'user' | 'premium')}>
                          <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {u.account_status === 'locked' || u.account_status === 'suspended' ? (
                          <Button variant="outline" size="sm" onClick={() => handleUnlockAccount(u.id)}>
                            <Unlock className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Dialog open={incidentDialogOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                            setIncidentDialogOpen(open);
                            if (open) setSelectedUser(u);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                                <LockKeyhole className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <ShieldAlert className="w-5 h-5 text-destructive" />
                                  Incident Response
                                </DialogTitle>
                                <DialogDescription>
                                  Take action on {u.full_name || u.email}'s account
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Action</Label>
                                  <Select value={incidentAction} onValueChange={(v) => setIncidentAction(v as 'lock' | 'suspend')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="lock">Lock Account (Temporary)</SelectItem>
                                      <SelectItem value="suspend">Suspend Account (Indefinite)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Severity</Label>
                                  <Select value={incidentSeverity} onValueChange={(v) => setIncidentSeverity(v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Reason *</Label>
                                  <Textarea 
                                    value={incidentReason} 
                                    onChange={(e) => setIncidentReason(e.target.value)}
                                    placeholder="Describe the reason for this action..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-muted-foreground" />
                                    <Label htmlFor="notify" className="text-sm">Send notifications (email & SMS)</Label>
                                  </div>
                                  <Switch id="notify" checked={sendNotifications} onCheckedChange={setSendNotifications} />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleIncidentAction} disabled={processingIncident || !incidentReason.trim()}>
                                  {processingIncident ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                                  {incidentAction === 'lock' ? 'Lock Account' : 'Suspend Account'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button variant="outline" size="sm" onClick={() => exportUserData(u.id, u.email)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Incidents Tab */}
              <TabsContent value="incidents" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Incident Log</h3>
                      <p className="text-sm text-muted-foreground">Track and manage security incidents</p>
                    </div>
                    <Badge variant={stats.openIncidents > 0 ? 'destructive' : 'outline'}>
                      {stats.openIncidents} Open
                    </Badge>
                  </div>
                  
                  {incidents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No incidents recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {incidents.map((incident) => (
                        <Card 
                          key={incident.id} 
                          className={`border cursor-pointer transition-all hover:shadow-md ${incident.resolved ? 'border-border hover:border-primary/30' : 'border-destructive/50 hover:border-destructive'}`}
                          onClick={() => {
                            setSelectedIncident(incident);
                            setIncidentDetailOpen(true);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={incident.severity === 'critical' ? 'destructive' : 
                                    incident.severity === 'high' ? 'destructive' : 'outline'}>
                                    {incident.severity.toUpperCase()}
                                  </Badge>
                                  <span className="font-medium">{incident.incident_type.replace(/_/g, ' ')}</span>
                                  {incident.resolved && <Badge variant="outline" className="bg-success/10 text-success">Resolved</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">{incident.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{format(new Date(incident.created_at), 'MMM d, yyyy h:mm a')}</span>
                                  {incident.notification_sent && (
                                    <span className="flex items-center gap-1">
                                      <Bell className="w-3 h-3" />
                                      {incident.notification_channels?.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-1">Vehicle API Integrations</h3>
                    <p className="text-sm text-muted-foreground mb-4">Manage connections to EV manufacturers and telematics providers</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {API_PROVIDERS.map((provider) => (
                      <Card key={provider.id} className={`card-nature ${provider.status === 'active' ? 'border-success/30' : 'opacity-70'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{provider.logo}</span>
                              <div>
                                <h4 className="font-medium">{provider.name}</h4>
                                <p className="text-xs text-muted-foreground">{provider.makes.join(', ')}</p>
                              </div>
                            </div>
                            <Badge variant={provider.status === 'active' ? 'default' : 'outline'}>
                              {provider.status === 'active' ? 'Active' : 'Planned'}
                            </Badge>
                          </div>
                          {provider.status === 'active' ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-success" />
                                <span>API Connected</span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  toast({
                                    title: `Configure ${provider.name}`,
                                    description: `API configuration for ${provider.name} is managed through user credentials in Settings → Security. Users connect their own ${provider.name} accounts when creating journeys.`,
                                  });
                                }}
                              >
                                <Settings className="w-4 h-4 mr-1" />
                                Configure
                              </Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="w-full" disabled>
                              <Clock className="w-4 h-4 mr-1" />
                              Coming Soon
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="card-nature border-primary/30">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Request New Integration
                      </CardTitle>
                      <CardDescription>
                        Users can request support for new vehicle manufacturers or features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Enable community-driven feature development
                        </p>
                        <FeatureRequestWidget variant="inline" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-0">
                <div className="space-y-6">
                  {/* Admin 2FA Settings */}
                  <TwoFactorSettings isAdmin={true} required={true} />

                  {/* Security Scanner Dashboard */}
                  <SecurityDashboard />
                </div>
              </TabsContent>

              {/* DSAR Tab */}
              <TabsContent value="dsar" className="mt-0">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Data Subject Access Requests</h3>
                    <p className="text-sm text-muted-foreground">Manage privacy requests from users</p>
                  </div>
                  <Link to="/data-request" target="_blank">
                    <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" />View Portal</Button>
                  </Link>
                </div>
                {dsarRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No DSAR requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dsarRequests.map((req) => (
                      <Card key={req.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={req.metadata?.request_type === 'deletion' ? 'destructive' : 'default'}>
                                  {req.metadata?.request_type?.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(req.created_at), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              <p className="font-medium">{req.metadata?.name}</p>
                              <p className="text-sm text-muted-foreground">{req.metadata?.email}</p>
                            </div>
                            <Button variant="outline" size="sm"><Clock className="w-4 h-4 mr-1" />Process</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Audit Tab */}
              <TabsContent value="audit" className="mt-0">
                <EnhancedAuditLog />
              </TabsContent>

              {/* System Tab */}
              <TabsContent value="system" className="mt-0">
                <div className="space-y-4">
                  {[
                    { icon: Database, title: 'Database', status: 'Healthy', desc: 'All connections operational' },
                    { icon: Car, title: 'Vehicle APIs', status: 'Connected', desc: 'Tessie API active' },
                    { icon: Gauge, title: 'Edge Functions', status: 'Deployed', desc: '8 functions active' },
                    { icon: Bell, title: 'Notifications', status: 'Ready', desc: 'Email & SMS configured' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{item.title}</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">{item.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      
      {/* User Detail Drawer */}
      <UserDetailDrawer 
        user={detailUser} 
        open={userDetailOpen} 
        onOpenChange={setUserDetailOpen}
        onExportData={exportUserData}
        onRefresh={fetchData}
      />
      
      {/* Incident Detail Drawer */}
      <IncidentDetailDrawer
        incident={selectedIncident}
        open={incidentDetailOpen}
        onOpenChange={setIncidentDetailOpen}
        onRefresh={fetchData}
      />
    </div>
  );
}
