import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Shield, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface BetaGateProps {
  children: ReactNode;
}

const BETA_ACCESS_KEY = 'aww_beta_access';
const BETA_ACCESS_EXPIRY_KEY = 'aww_beta_expiry';

export default function BetaGate({ children }: BetaGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing access on mount
  useEffect(() => {
    const storedAccess = localStorage.getItem(BETA_ACCESS_KEY);
    const storedExpiry = localStorage.getItem(BETA_ACCESS_EXPIRY_KEY);
    
    if (storedAccess && storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      if (expiryDate > new Date()) {
        setHasAccess(true);
        return;
      } else {
        // Clear expired access
        localStorage.removeItem(BETA_ACCESS_KEY);
        localStorage.removeItem(BETA_ACCESS_EXPIRY_KEY);
      }
    }
    
    setHasAccess(false);
  }, []);

  const verifyAccessCode = async () => {
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('beta_testers')
        .select('id, name, expires_at, is_active, access_count')
        .eq('access_code', accessCode.trim())
        .single();

      if (queryError || !data) {
        setError('Invalid access code. Please check and try again.');
        setIsVerifying(false);
        return;
      }

      if (!data.is_active) {
        setError('This access code has been deactivated.');
        setIsVerifying(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This access code has expired.');
        setIsVerifying(false);
        return;
      }

      // Update access count and last accessed
      await supabase
        .from('beta_testers')
        .update({ 
          last_accessed_at: new Date().toISOString(),
          access_count: (data.access_count || 0) + 1
        })
        .eq('id', data.id);

      // Store access in localStorage
      localStorage.setItem(BETA_ACCESS_KEY, data.id);
      localStorage.setItem(BETA_ACCESS_EXPIRY_KEY, data.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      
      toast.success(`Welcome, ${data.name || 'Beta Tester'}!`, {
        description: 'You now have access to the beta.'
      });
      
      setHasAccess(true);
    } catch (err) {
      console.error('Beta verification error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Show loading while checking
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show gate if no access
  if (!hasAccess) {
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
                Beta Access Required
              </CardTitle>
              <CardDescription className="mt-2">
                A Whittle Wandering is currently in private beta. Enter your access code to continue.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter access code (e.g., AWW-BETA-xxxxx)"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && verifyAccessCode()}
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
              onClick={verifyAccessCode}
              disabled={isVerifying || !accessCode.trim()}
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify Access
                </>
              )}
            </Button>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Don't have an access code?{' '}
                <a 
                  href="mailto:beta@awhittlewandering.com" 
                  className="text-primary hover:underline"
                >
                  Request access
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}