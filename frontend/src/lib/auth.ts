// Admin authentication for A Whittle Wandering
// Provides secure admin access for media uploads and site management

import { API_CONFIG } from './api-config';

const ADMIN_TOKEN_KEY = 'awhittlewandering_admin_token';

interface AdminSession {
  isAuthenticated: boolean;
  expiresAt: number;
  sessionId: string;
}

interface MfaChallengeState {
  challengeId: string;
  email: string;
  password: string;
}

export class AdminAuth {
  private static instance: AdminAuth;
  private session: AdminSession | null = null;
  private mfaChallenge: MfaChallengeState | null = null;

  static getInstance(): AdminAuth {
    if (!AdminAuth.instance) {
      AdminAuth.instance = new AdminAuth();
    }
    return AdminAuth.instance;
  }

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (stored) {
        const session = JSON.parse(stored) as AdminSession;
        if (session.expiresAt > Date.now()) {
          this.session = session;
        } else {
          this.logout();
        }
      }
    } catch (error) {
      console.warn('Failed to load admin session:', error);
      this.logout();
    }
  }

  private saveSession() {
    if (this.session) {
      localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify(this.session));
    }
  }

  async authenticate(email: string, password: string): Promise<{ success: boolean; error?: string; mfaRequired?: boolean }> {
    try {
      // Authenticate against backend API using shared config
      const apiBaseUrl = API_CONFIG.BASE_URL;
      
      const response = await fetch(`${apiBaseUrl}/api/v1/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Invalid email or password' };
        }
        return { success: false, error: 'Authentication failed' };
      }

      const data = await response.json();
      
      // Handle MFA requirement for admin users
      if (data.ok && data.mfaRequired && data.challengeId) {
        // Store challenge state for MFA verification
        this.mfaChallenge = {
          challengeId: data.challengeId,
          email,
          password,
        };
        return { success: false, mfaRequired: true };
      }
      
      if (data.ok && data.token && data.user?.admin) {
        // Only allow admin users
        this.session = {
          isAuthenticated: true,
          expiresAt: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
          sessionId: data.token
        };
        this.saveSession();
        this.mfaChallenge = null;
        return { success: true };
      }
      
      // User authenticated but is not an admin
      if (data.ok && data.token) {
        return { success: false, error: 'Admin access required. Your account does not have admin privileges.' };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Authentication failed:', error);
      return { success: false, error: 'Network error: Unable to connect to authentication service' };
    }
  }

  async verifyMfaCode(code: string): Promise<{ success: boolean; error?: string }> {
    if (!this.mfaChallenge) {
      return { success: false, error: 'No MFA challenge in progress' };
    }

    try {
      const apiBaseUrl = API_CONFIG.BASE_URL;
      
      const response = await fetch(`${apiBaseUrl}/api/v1/mfa/challenge/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: this.mfaChallenge.challengeId,
          code,
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          return { success: false, error: 'Invalid or expired code' };
        }
        return { success: false, error: 'MFA verification failed' };
      }

      const data = await response.json();
      
      if (data.ok && data.token && data.user?.admin) {
        this.session = {
          isAuthenticated: true,
          expiresAt: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
          sessionId: data.token
        };
        this.saveSession();
        this.mfaChallenge = null;
        return { success: true };
      }
      
      return { success: false, error: 'MFA verification failed' };
    } catch (error) {
      console.error('MFA verification failed:', error);
      return { success: false, error: 'Network error: Unable to connect to authentication service' };
    }
  }

  hasPendingMfaChallenge(): boolean {
    return this.mfaChallenge !== null;
  }

  cancelMfaChallenge(): void {
    this.mfaChallenge = null;
  }

  isAuthenticated(): boolean {
    if (!this.session) return false;
    if (this.session.expiresAt <= Date.now()) {
      this.logout();
      return false;
    }
    return this.session.isAuthenticated;
  }

  logout() {
    this.session = null;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  getAuthToken(): string | null {
    return this.isAuthenticated() ? this.session?.sessionId || null : null;
  }

  private generateSessionId(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Admin capabilities check
  canUploadMedia(): boolean {
    return this.isAuthenticated();
  }

  canModifyJourney(): boolean {
    return this.isAuthenticated();
  }

  canAccessAnalytics(): boolean {
    return this.isAuthenticated();
  }

  // Get session info
  getSessionInfo(): { isAuth: boolean; expiresIn?: number } {
    if (!this.session) {
      return { isAuth: false };
    }

    const expiresIn = Math.max(0, this.session.expiresAt - Date.now());
    return {
      isAuth: this.isAuthenticated(),
      expiresIn: expiresIn
    };
  }

  // Check if session expires soon (within 30 minutes)
  shouldRenewSession(): boolean {
    if (!this.session) return false;
    const thirtyMinutes = 30 * 60 * 1000;
    return (this.session.expiresAt - Date.now()) < thirtyMinutes;
  }

  // Extend session
  extendSession() {
    if (this.session && this.isAuthenticated()) {
      this.session.expiresAt = Date.now() + (8 * 60 * 60 * 1000);
      this.saveSession();
    }
  }
}

// Global admin auth instance
export const adminAuth = AdminAuth.getInstance();

// React hook for admin authentication
export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(adminAuth.isAuthenticated());
  const [sessionInfo, setSessionInfo] = React.useState(adminAuth.getSessionInfo());

  React.useEffect(() => {
    const checkAuth = () => {
      const authStatus = adminAuth.isAuthenticated();
      const info = adminAuth.getSessionInfo();
      
      setIsAuthenticated(authStatus);
      setSessionInfo(info);
    };

    // Check every minute
    const interval = setInterval(checkAuth, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; mfaRequired?: boolean }> => {
    const result = await adminAuth.authenticate(email, password);
    if (result.success) {
      setIsAuthenticated(true);
      setSessionInfo(adminAuth.getSessionInfo());
    }
    return result;
  };

  const verifyMfa = async (code: string): Promise<{ success: boolean; error?: string }> => {
    const result = await adminAuth.verifyMfaCode(code);
    if (result.success) {
      setIsAuthenticated(true);
      setSessionInfo(adminAuth.getSessionInfo());
    }
    return result;
  };

  const logout = () => {
    adminAuth.logout();
    setIsAuthenticated(false);
    setSessionInfo({ isAuth: false });
  };

  const extendSession = () => {
    adminAuth.extendSession();
    setSessionInfo(adminAuth.getSessionInfo());
  };

  return {
    isAuthenticated,
    sessionInfo,
    login,
    verifyMfa,
    logout,
    extendSession,
    hasPendingMfa: adminAuth.hasPendingMfaChallenge(),
    cancelMfa: adminAuth.cancelMfaChallenge.bind(adminAuth),
    canUploadMedia: adminAuth.canUploadMedia(),
    canModifyJourney: adminAuth.canModifyJourney(),
    canAccessAnalytics: adminAuth.canAccessAnalytics()
  };
};

// Import React for the hook
import React from 'react';
