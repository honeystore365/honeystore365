'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminSession {
  user: any;
  isAdmin: boolean;
  loading: boolean;
}

interface AdminSessionContextType {
  adminSession: AdminSession | null;
  loading: boolean;
  signInAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextType | undefined>(undefined);

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    // Check for existing admin session
    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/auth/session');
        if (response.ok) {
          const data = await response.json();
          setSession({
            user: data.user,
            isAdmin: data.isAdmin,
            loading: false,
          });
        } else {
          setSession({
            user: null,
            isAdmin: false,
            loading: false,
          });
        }
      } catch (error) {
        setSession({
          user: null,
          isAdmin: false,
          loading: false,
        });
      }
    };

    checkSession();
  }, []);

  const signInAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setSession({
          user: data.user,
          isAdmin: true,
          loading: false,
        });
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSession({
        user: null,
        isAdmin: false,
        loading: false,
      });
    }
  };

  return (
    <AdminSessionContext.Provider value={{ 
      adminSession: session.isAdmin ? session : null, 
      loading: session.loading, 
      signInAdmin, 
      signOut,
      signOutAdmin: signOut
    }}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (context === undefined) {
    throw new Error('useAdminSession must be used within an AdminSessionProvider');
  }
  return context;
}