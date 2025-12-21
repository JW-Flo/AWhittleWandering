import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

interface MFAChallenge {
  factorId: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mfaChallenge: MFAChallenge | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; mfaRequired?: boolean }>;
  signOut: () => Promise<void>;
  resetSessionTimeout: () => void;
  completeMFA: (code: string) => Promise<{ error: Error | null }>;
  cancelMFA: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState<MFAChallenge | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearSessionTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleSessionTimeout = useCallback(async () => {
    console.log('Session timeout - signing out due to inactivity');
    await supabase.auth.signOut();
  }, []);

  const resetSessionTimeout = useCallback(() => {
    if (!session) return;
    
    lastActivityRef.current = Date.now();
    clearSessionTimeout();
    
    timeoutRef.current = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT_MS);
  }, [session, clearSessionTimeout, handleSessionTimeout]);

  // Set up activity listeners
  useEffect(() => {
    if (!session) {
      clearSessionTimeout();
      return;
    }

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      const now = Date.now();
      // Only reset if more than 1 second since last activity (throttle)
      if (now - lastActivityRef.current > 1000) {
        resetSessionTimeout();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timeout
    resetSessionTimeout();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearSessionTimeout();
    };
  }, [session, resetSessionTimeout, clearSessionTimeout]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          clearSessionTimeout();
          setMfaChallenge(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [clearSessionTimeout]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null; mfaRequired?: boolean }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Check if MFA is required
    if (error?.message?.includes('mfa')) {
      // User has MFA enabled, need to verify
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.find(f => f.status === 'verified');
      
      if (totpFactor) {
        setMfaChallenge({ factorId: totpFactor.id });
        return { error: null, mfaRequired: true };
      }
    }
    
    return { error };
  };

  const completeMFA = async (code: string): Promise<{ error: Error | null }> => {
    if (!mfaChallenge) {
      return { error: new Error('No MFA challenge in progress') };
    }

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaChallenge.factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaChallenge.factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      setMfaChallenge(null);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const cancelMFA = () => {
    setMfaChallenge(null);
    supabase.auth.signOut();
  };

  const signOut = async () => {
    clearSessionTimeout();
    setMfaChallenge(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      mfaChallenge,
      signUp, 
      signIn, 
      signOut, 
      resetSessionTimeout,
      completeMFA,
      cancelMFA,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
