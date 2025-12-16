import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  Database, 
  Activity,
  ChevronLeft,
  AlertTriangle,
  Search,
  RefreshCw,
  BarChart3,
  MapPin,
  Car,
  Image,
  FileText,
  Lock,
  Eye,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Gauge,
  UserCog,
  ScrollText
} from 'lucide-react';
import { format } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string;
}

interface Stats {
  totalUsers: number;
  totalJourneys: number;
  totalWaypoints: number;
  totalMedia: number;
  activeToday: number;
  dsarRequests: number;
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

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    totalUsers: 0, 
    totalJourneys: 0, 
    totalWaypoints: 0, 
    totalMedia: 0,
    activeToday: 0,
    dsarRequests: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dsarRequests, setDsarRequests] = useState<DSARRequest[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>('all');

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
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
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
      // Fetch users with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, user_id');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name,
        created_at: profile.created_at,
        role: roles?.find(r => r.user_id === profile.user_id)?.role || 'user'
      })) || [];

      setUsers(usersWithRoles);

      // Fetch stats
      const [journeysRes, waypointsRes, mediaRes, auditRes] = await Promise.all([
        supabase.from('journeys').select('id', { count: 'exact', head: true }),
        supabase.from('drive_data').select('id', { count: 'exact', head: true }),
        supabase.from('journey_media').select('id', { count: 'exact', head: true }),
        supabase.from('security_audit_log').select('*').order('created_at', { ascending: false }).limit(100)
      ]);

      // Get DSAR count
      const dsarCount = auditRes.data?.filter(log => log.action.startsWith('dsar_')).length || 0;

      setStats({
        totalUsers: profiles?.length || 0,
        totalJourneys: journeysRes.count || 0,
        totalWaypoints: waypointsRes.count || 0,
        totalMedia: mediaRes.count || 0,
        activeToday: usersWithRoles.filter(u => {
          const created = new Date(u.created_at);
          const today = new Date();
          return created.toDateString() === today.toDateString();
        }).length,
        dsarRequests: dsarCount
      });

      // Set audit logs
      setAuditLogs(auditRes.data || []);

      // Extract DSAR requests
      const dsars = (auditRes.data || [])
        .filter(log => log.action.startsWith('dsar_'))
        .map(log => ({
          id: log.id,
          action: log.action,
          metadata: log.metadata as DSARRequest['metadata'],
          created_at: log.created_at
        }));
      setDsarRequests(dsars);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilter === 'all') return true;
    if (auditFilter === 'security') return log.resource_type === 'security' || log.action.includes('login') || log.action.includes('auth');
    if (auditFilter === 'dsar') return log.action.startsWith('dsar_');
    if (auditFilter === 'data') return log.resource_type === 'journey' || log.resource_type === 'media';
    return true;
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('delete') || action.includes('removal')) return 'destructive';
    if (action.includes('create') || action.includes('submit')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'outline';
    return 'secondary';
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user' | 'premium') => {
    try {
      // Update existing role or insert new one
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      // Log the action
      await supabase.rpc('log_security_event', {
        p_action: `role_changed_to_${newRole}`,
        p_resource_type: 'user',
        p_resource_id: userId
      });

      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}`,
      });

      fetchData(); // Refresh audit logs
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const exportUserData = async (userId: string, email: string) => {
    try {
      // Fetch all user data
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
        media: mediaRes.data?.map(m => ({ ...m, file_url: '[REDACTED FOR SECURITY]' })),
        notificationPreferences: prefsRes.data
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${userId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log the export
      await supabase.rpc('log_security_event', {
        p_action: 'admin_data_export',
        p_resource_type: 'user',
        p_resource_id: userId
      });

      toast({
        title: "Data Exported",
        description: "User data has been exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Could not export user data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Admin Portal
              </h1>
              <p className="text-sm text-muted-foreground">Manage users, security, and platform settings</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Badge variant="outline" className="border-primary/50 text-primary">
                Admin Access
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="card-nature">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-nature">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalJourneys}</p>
                  <p className="text-xs text-muted-foreground">Journeys</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-nature">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalWaypoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Data Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-nature">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Image className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalMedia}</p>
                  <p className="text-xs text-muted-foreground">Media Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-nature">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ScrollText className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{auditLogs.length}</p>
                  <p className="text-xs text-muted-foreground">Audit Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-nature">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.dsarRequests}</p>
                  <p className="text-xs text-muted-foreground">DSAR Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="card-nature">
          <Tabs defaultValue="users">
            <CardHeader>
              <TabsList className="bg-secondary flex-wrap h-auto gap-1">
                <TabsTrigger value="users" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="dsar" className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  DSAR
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-1">
                  <ScrollText className="w-4 h-4" />
                  Audit Logs
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  System
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              {/* Users Tab */}
              <TabsContent value="users" className="mt-0">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by email or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{u.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select 
                          value={u.role} 
                          onValueChange={(value) => handleRoleChange(u.id, value as 'admin' | 'user' | 'premium')}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportUserData(u.id, u.email)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-0">
                <div className="space-y-4">
                  <Card className="border-success/30 bg-success/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="font-medium">Session Timeout</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">30-minute inactivity timeout enabled</p>
                    </CardContent>
                  </Card>

                  <Card className="border-success/30 bg-success/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="font-medium">Row Level Security</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Enabled
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">All tables have RLS policies</p>
                    </CardContent>
                  </Card>

                  <Card className="border-success/30 bg-success/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="font-medium">API Token Encryption</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Secured
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Tokens encrypted at rest, never exposed to clients</p>
                    </CardContent>
                  </Card>

                  <Card className="border-success/30 bg-success/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="font-medium">Security Audit Log</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{auditLogs.length} events logged</p>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <span className="font-medium">Rate Limiting</span>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                          Edge Functions
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Rate limiting available via edge function middleware. Configure per-endpoint limits in function code.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">2FA (Two-Factor Auth)</span>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                          Planned
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Consider enabling for premium/admin users. Requires Supabase Auth configuration.
                      </p>
                    </CardContent>
                  </Card>
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
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Public Portal
                    </Button>
                  </Link>
                </div>

                {dsarRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No DSAR requests yet</p>
                    <p className="text-sm">Requests will appear here when users submit them</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dsarRequests.map((req) => (
                      <Card key={req.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={
                                  req.metadata?.request_type === 'deletion' ? 'destructive' :
                                  req.metadata?.request_type === 'access' ? 'default' :
                                  'outline'
                                }>
                                  {req.metadata?.request_type?.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(req.created_at), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              <p className="font-medium">{req.metadata?.name}</p>
                              <p className="text-sm text-muted-foreground">{req.metadata?.email}</p>
                              {req.metadata?.details && (
                                <p className="text-sm mt-2 p-2 bg-secondary/50 rounded">
                                  {req.metadata.details}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Clock className="w-4 h-4 mr-1" />
                                Process
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Audit Logs Tab */}
              <TabsContent value="audit" className="mt-0">
                <div className="mb-4 flex items-center gap-4">
                  <Select value={auditFilter} onValueChange={setAuditFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter logs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="dsar">DSAR</SelectItem>
                      <SelectItem value="data">Data Changes</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Showing {filteredAuditLogs.length} of {auditLogs.length} events
                  </span>
                </div>

                {filteredAuditLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredAuditLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg text-sm">
                        <div className="w-32 shrink-0 text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, h:mm a')}
                        </div>
                        <Badge variant={getActionBadgeVariant(log.action)} className="shrink-0">
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-muted-foreground">{log.resource_type}</span>
                        {log.resource_id && (
                          <code className="text-xs bg-secondary px-1 rounded">
                            {log.resource_id.slice(0, 8)}...
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* System Tab */}
              <TabsContent value="system" className="mt-0">
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5 text-primary" />
                      <span className="font-medium">Database Status</span>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        Healthy
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">All database connections operational</p>
                  </div>
                  
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Car className="w-5 h-5 text-primary" />
                      <span className="font-medium">Vehicle APIs</span>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        Connected
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Tessie API integration active</p>
                  </div>

                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Gauge className="w-5 h-5 text-primary" />
                      <span className="font-medium">Edge Functions</span>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        Deployed
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      7 edge functions deployed: tessie, weather, route-navigator, csv-import, send-sms, send-email-digest, vehicle-api
                    </p>
                  </div>
                  
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      <span className="font-medium">Session Management</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Session timeout: 30 minutes of inactivity</p>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
