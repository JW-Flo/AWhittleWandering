// Admin authentication for A Whittle Wandering
// Provides secure admin access for media uploads and site management

const ADMIN_KEY = 'awhittlewandering_admin_2025';
const ADMIN_TOKEN_KEY = 'awhittlewandering_admin_token';

// Simple admin password - in production, this would be more secure
const ADMIN_PASSWORD = 'RoadTrip48States!2025';

interface AdminSession {
  isAuthenticated: boolean;
  expiresAt: number;
  sessionId: string;
}

export class AdminAuth {
  private static instance: AdminAuth;
  private session: AdminSession | null = null;

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

  async authenticate(password: string): Promise<boolean> {
    if (password === ADMIN_PASSWORD) {
      this.session = {
        isAuthenticated: true,
        expiresAt: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
        sessionId: this.generateSessionId()
      };
      this.saveSession();
      return true;
    }
    return false;
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

  const login = async (password: string): Promise<boolean> => {
    const success = await adminAuth.authenticate(password);
    if (success) {
      setIsAuthenticated(true);
      setSessionInfo(adminAuth.getSessionInfo());
    }
    return success;
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
    logout,
    extendSession,
    canUploadMedia: adminAuth.canUploadMedia(),
    canModifyJourney: adminAuth.canModifyJourney(),
    canAccessAnalytics: adminAuth.canAccessAnalytics()
  };
};

// Import React for the hook
import React from 'react';
