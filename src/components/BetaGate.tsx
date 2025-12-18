import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Shield, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BetaGateProps {
  children: ReactNode;
}

export default function BetaGate({ children }: BetaGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyAndSignIn = async () => {
    if (!accessCode.trim()) {
      setError('Please enter your access code');
      return;
    }

    const sanitizedCode = accessCode.trim().toUpperCase();
    if (sanitizedCode.length < 10 || sanitizedCode.length > 64) {
      setError('Invalid access code format');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Call edge function to verify code and provision account
      const { data, error: fnError } = await supabase.functions.invoke('beta-auth', {
        body: { access_code: sanitizedCode }
      });

      if (fnError || !data?.success) {
        setError(data?.error || 'Invalid access code. Please check and try again.');
        setIsVerifying(false);
        return;
      }

      // Sign in with the provisioned credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError('Failed to sign in. Please try again.');
        setIsVerifying(false);
        return;
      }

      toast.success(`Welcome, ${data.name || 'Beta Tester'}!`, {
        description: 'You are now signed into your beta account.'
      });

    } catch (err) {
      console.error('Beta auth error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
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
        
        {/* Subtle background orbs */}
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
                Enter your access code to sign into your provisioned beta account.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
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
                  onKeyDown={(e) => e.key === 'Enter' && verifyAndSignIn()}
                  className="pl-10 font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <Button 
              className="w-full" 
              onClick={verifyAndSignIn}
              disabled={isVerifying || !accessCode.trim()}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Access Beta
                </>
              )}
            </Button>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Your access code is your secure key to your beta account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}