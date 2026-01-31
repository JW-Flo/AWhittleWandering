import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, User, Shield, LogOut, Clock } from 'lucide-react';
import { useAdminAuth } from '@/lib/auth';

interface AdminLoginProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onAuthChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    isAuthenticated, 
    sessionInfo, 
    login, 
    logout, 
    extendSession 
  } = useAdminAuth();

  React.useEffect(() => {
    onAuthChange?.(isAuthenticated);
  }, [isAuthenticated, onAuthChange]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        setEmail('');
        setPassword('');
        setError('');
      } else {
        setError(result.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setEmail('');
    setPassword('');
    setError('');
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isAuthenticated) {
    return (
      <Card className="admin-panel border-tesla-cyan/20 bg-gradient-to-br from-card/50 to-tesla-cyan/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-tesla-cyan">
            <Shield className="w-5 h-5" />
            Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Administrator</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {sessionInfo.expiresIn ? formatTimeRemaining(sessionInfo.expiresIn) : 'Session active'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={extendSession}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Extend Session
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          <Alert className="border-tesla-cyan/20 bg-tesla-cyan/10">
            <Shield className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Admin mode active. You can upload media and modify journey data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="admin-login border-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Admin Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !email.trim() || !password.trim()}
          >
            {isLoading ? 'Authenticating...' : 'Login as Admin'}
          </Button>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-sm text-yellow-800">
              Admin access is required to upload media files and modify journey data. 
              Public users have read-only access to the journey.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminLogin;
