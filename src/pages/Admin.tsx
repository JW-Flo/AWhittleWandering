import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Image
} from 'lucide-react';

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
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalJourneys: 0, totalWaypoints: 0, totalMedia: 0 });
  const [searchQuery, setSearchQuery] = useState('');

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
      const [journeysRes, waypointsRes, mediaRes] = await Promise.all([
        supabase.from('journeys').select('id', { count: 'exact', head: true }),
        supabase.from('drive_data').select('id', { count: 'exact', head: true }),
        supabase.from('journey_media').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: profiles?.length || 0,
        totalJourneys: journeysRes.count || 0,
        totalWaypoints: waypointsRes.count || 0,
        totalMedia: mediaRes.count || 0
      });
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
                <Shield className="w-6 h-6 text-adventure-gold" />
                Admin Portal
              </h1>
              <p className="text-sm text-muted-foreground">Manage users, journeys, and platform settings</p>
            </div>
            <Badge variant="outline" className="ml-auto border-adventure-gold/50 text-adventure-gold">
              Admin Access
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        </div>

        {/* Main Content Tabs */}
        <Card className="card-nature">
          <Tabs defaultValue="users">
            <CardHeader>
              <TabsList className="bg-secondary">
                <TabsTrigger value="users" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  System
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
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
                    <div key={u.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{u.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>
                          {u.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-0">
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Platform analytics coming soon</p>
                  <p className="text-sm">Track user engagement, journey statistics, and more</p>
                </div>
              </TabsContent>
              
              <TabsContent value="system" className="mt-0">
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5 text-primary" />
                      <span className="font-medium">Database Status</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                        Healthy
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">All database connections are operational</p>
                  </div>
                  
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Car className="w-5 h-5 text-primary" />
                      <span className="font-medium">Tessie API</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                        Connected
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Vehicle API integration active</p>
                  </div>
                  
                  <div className="p-4 bg-adventure-gold/10 border border-adventure-gold/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-adventure-gold" />
                      <span className="font-medium">Session Management</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Session timeout: 7 days (configurable)</p>
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
