import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Clock,
  Mail,
  Shield,
  Plus,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BetaTester {
  id: string;
  email: string;
  name: string | null;
  access_code: string;
  is_active: boolean;
  access_count: number;
  last_accessed_at: string | null;
  expires_at: string | null;
  created_at: string;
  claimed_by_user_id: string | null;
  claimed_at: string | null;
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  failure_reason: string | null;
  access_code_attempted: string | null;
  auth_method: string | null;
  created_at: string;
  ip_address: string | null;
}

export function BetaAccessAudit() {
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('codes');
  
  // New code form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testersRes, attemptsRes] = await Promise.all([
        supabase.from('beta_testers').select('*').order('created_at', { ascending: false }),
        supabase.from('login_attempts')
          .select('*')
          .or('auth_method.eq.beta_access,failure_reason.ilike.%beta%')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (testersRes.data) setTesters(testersRes.data as BetaTester[]);
      if (attemptsRes.data) setLoginAttempts(attemptsRes.data as LoginAttempt[]);
    } catch (error) {
      console.error('Error fetching beta audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTesterStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('beta_testers')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setTesters(prev => prev.map(t => 
        t.id === id ? { ...t, is_active: !currentStatus } : t
      ));
      
      toast.success(currentStatus ? 'Access code deactivated' : 'Access code activated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetAccessCount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('beta_testers')
        .update({ access_count: 0 })
        .eq('id', id);

      if (error) throw error;
      
      setTesters(prev => prev.map(t => 
        t.id === id ? { ...t, access_count: 0 } : t
      ));
      
      toast.success('Access count reset');
    } catch (error) {
      toast.error('Failed to reset count');
    }
  };

  const generateAccessCode = () => {
    const prefix = 'AWW-BETA-';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = prefix;
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createNewTester = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsCreating(true);
    try {
      const accessCode = generateAccessCode();
      
      const { error } = await supabase.from('beta_testers').insert({
        email: newEmail.trim().toLowerCase(),
        name: newName.trim() || null,
        access_code: accessCode,
        is_active: true
      });

      if (error) throw error;
      
      toast.success('Beta tester added!', {
        description: `Access code: ${accessCode}`
      });
      
      setNewEmail('');
      setNewName('');
      fetchData();
    } catch (error) {
      console.error('Error creating tester:', error);
      toast.error('Failed to create beta tester');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (tester: BetaTester) => {
    if (!tester.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (tester.expires_at && new Date(tester.expires_at) < new Date()) {
      return <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">Expired</Badge>;
    }
    if (tester.claimed_by_user_id) {
      return <Badge variant="outline" className="border-success/50 text-success">Claimed</Badge>;
    }
    return <Badge variant="outline" className="border-primary/50 text-primary">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeTesters = testers.filter(t => t.is_active);
  const claimedTesters = testers.filter(t => t.claimed_by_user_id);
  const failedAttempts = loginAttempts.filter(a => !a.success);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-nature">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{testers.length}</p>
                <p className="text-xs text-muted-foreground">Total Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-nature">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeTesters.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-nature">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{claimedTesters.length}</p>
                <p className="text-xs text-muted-foreground">Claimed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-nature">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{failedAttempts.length}</p>
                <p className="text-xs text-muted-foreground">Failed Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="codes" className="gap-1.5">
            <Key className="w-4 h-4" />Access Codes
          </TabsTrigger>
          <TabsTrigger value="attempts" className="gap-1.5">
            <Shield className="w-4 h-4" />Login Attempts
            {failedAttempts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{failedAttempts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-1.5">
            <Plus className="w-4 h-4" />Add Tester
          </TabsTrigger>
        </TabsList>

        {/* Access Codes Tab */}
        <TabsContent value="codes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beta Access Codes</CardTitle>
              <CardDescription>Manage access codes and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testers.map((tester) => (
                  <div 
                    key={tester.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{tester.email}</span>
                          {getStatusBadge(tester)}
                        </div>
                        {tester.name && (
                          <p className="text-sm text-muted-foreground mt-1">{tester.name}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="font-mono bg-secondary/50 px-2 py-0.5 rounded">
                            {tester.access_code}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => copyToClipboard(tester.access_code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          Accessed: <span className="text-foreground font-medium">{tester.access_count}×</span>
                        </p>
                        {tester.last_accessed_at && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {format(new Date(tester.last_accessed_at), 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetAccessCount(tester.id)}
                          disabled={tester.access_count === 0}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={tester.is_active}
                            onCheckedChange={() => toggleTesterStatus(tester.id, tester.is_active)}
                          />
                          <Label className="text-xs">{tester.is_active ? 'Active' : 'Off'}</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Attempts Tab */}
        <TabsContent value="attempts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beta Login Attempts</CardTitle>
              <CardDescription>Recent authentication attempts using beta access</CardDescription>
            </CardHeader>
            <CardContent>
              {loginAttempts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No login attempts recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {loginAttempts.map((attempt) => (
                    <div 
                      key={attempt.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        attempt.success 
                          ? 'border-success/20 bg-success/5' 
                          : 'border-destructive/20 bg-destructive/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {attempt.success ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{attempt.email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {attempt.access_code_attempted && (
                              <span className="font-mono">{attempt.access_code_attempted}</span>
                            )}
                            {attempt.failure_reason && (
                              <Badge variant="outline" className="text-xs h-5">
                                {attempt.failure_reason.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(attempt.created_at), 'MMM d, h:mm a')}
                        </p>
                        {attempt.ip_address && (
                          <p className="text-xs text-muted-foreground font-mono">{attempt.ip_address}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Tester Tab */}
        <TabsContent value="add" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Beta Tester</CardTitle>
              <CardDescription>Generate a new access code for a beta tester</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (required)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="beta@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The tester must use this exact email when signing in
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={createNewTester}
                  disabled={isCreating || !newEmail.trim()}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Access Code
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}