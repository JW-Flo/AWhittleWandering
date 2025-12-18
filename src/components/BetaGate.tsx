import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Shield, Lock, AlertCircle, CheckCircle2, Loader2, LogOut, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface BetaGateProps {
  children: ReactNode;
}

export default function BetaGate({ children }: BetaGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Check for existing auth session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if email exists when user finishes typing
  const checkEmailExists = async () => {
    if (!email.trim() || !email.includes('@')) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('beta-auth', {
        body: { email: email.trim(), check_only: true }
      });

      if (fnError) {
        console.error('Check error:', fnError);
        return;
      }

      setIsExistingUser(data?.existingUser ?? false);
    } catch (err) {
      console.error('Check email error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const secondField = isExistingUser ? password : accessCode;
    if (!secondField.trim()) {
      setError(isExistingUser ? 'Please enter your password' : 'Please enter your access code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      if (isExistingUser) {
        // Existing user: verify access code first, then sign in with password
        const { data, error: fnError } = await supabase.functions.invoke('beta-auth', {
          body: { email: email.trim(), access_code: accessCode }
        });

        // If they haven't entered access code yet, prompt for it
        if (!accessCode.trim()) {
          setError('Please enter your access code to verify beta access, then your password');
          setIsVerifying(false);
          return;
        }

        if (fnError || !data?.success) {
          setError(data?.error || 'Invalid access code');
          setIsVerifying(false);
          return;
        }

        // Now sign in with their password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (signInError) {
          setError('Invalid password. Please try again.');
          setIsVerifying(false);
          return;
        }

        toast.success(`Welcome back, ${data.name || 'Beta Tester'}!`);
      } else {
        // New user: verify and provision
        const { data, error: fnError } = await supabase.functions.invoke('beta-auth', {
          body: { email: email.trim(), access_code: accessCode }
        });

        if (fnError || !data?.success) {
          setError(data?.error || 'Invalid email or access code');
          setIsVerifying(false);
          return;
        }

        // Sign in with provisioned credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });

        if (signInError) {
          setError('Failed to sign in. Please try again.');
          setIsVerifying(false);
          return;
        }

        toast.success(`Welcome, ${data.name || 'Beta Tester'}!`, {
          description: 'Your beta account has been created.'
        });
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setAccessCode('');
    setPassword('');
    setIsExistingUser(null);
    setError(null);
    setUserName(null);
  };

  // Show loading while checking session
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-twilight-green/30 via-background to-background" />
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
              top: '20%',
              left: '10%',
            }}
          />
          <div 
            className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-3xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--forest)) 0%, transparent 70%)',
              bottom: '20%',
              right: '10%',
            }}
          />
        </div>

        <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-xl shadow-elevated">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="lg" showText={false} />
            </div>
            <div>
              <CardTitle className="text-2xl font-display flex items-center justify-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Beta Access
              </CardTitle>
              <CardDescription className="mt-2">
                {isExistingUser === null 
                  ? 'Enter your email to get started'
                  : isExistingUser 
                    ? 'Welcome back! Enter your access code and password'
                    : 'Enter your access code to create your account'
                }
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setIsExistingUser(null);
                  }}
                  onBlur={checkEmailExists}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
              {isChecking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking...
                </div>
              )}
            </div>

            {/* Access code field (always shown after email check) */}
            {isExistingUser !== null && (
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your access code"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && !isExistingUser && handleSubmit()}
                    className="pl-10 font-mono"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* Password field (only for existing users) */}
            {isExistingUser && (
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="pl-10"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isVerifying || !email.trim() || isExistingUser === null || (isExistingUser ? (!accessCode.trim() || !password.trim()) : !accessCode.trim())}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isExistingUser ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isExistingUser ? 'Sign In' : 'Access Beta'}
                </>
              )}
            </Button>

            {isExistingUser !== null && (
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground text-sm"
                onClick={resetForm}
              >
                Use a different email
              </Button>
            )}

            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {isExistingUser 
                  ? 'Enter your access code to verify beta access, then your password to sign in.'
                  : 'Your access code provisions your beta account automatically.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSignOut}
          className="shadow-lg bg-card/90 backdrop-blur-sm border-border/50 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Exit Beta
        </Button>
      </div>
      {children}
    </>
  );
}
