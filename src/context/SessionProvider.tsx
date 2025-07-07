'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClientComponent } from '@/lib/supabaseClient'; // Use client component client

import { SupabaseClient } from '@supabase/supabase-js';

type SessionContextType = {
  session: Session | null; // Keep Session for client-side auth state changes
  user: User | null; // Add user for server-side fetched user
  loading: boolean;
  supabase: SupabaseClient; // Add supabase client to context type
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  serverSession: Session | null; // Session fetched on the server (from getSession)
  serverUser: User | null; // User fetched on the server (from getUser)
}

export function SessionProvider({ children, serverSession, serverUser }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(serverSession);
  const [user, setUser] = useState<User | null>(serverUser);
  // If serverSession is null, we might be waiting for client-side hydration to confirm session status
  const [loading, setLoading] = useState(serverSession === null && serverUser === null);
  const supabase = createClientComponent();

  useEffect(() => {
    console.log('Initializing auth state listener - serverSession:', serverSession);
    let initialStateProcessed = serverSession !== null;

    const verifyAndSetUser = async (session: Session | null) => {
      try {
        if (!session) {
          console.log('No session provided for verification');
          setUser(null);
          return false;
        }

        console.log('Verifying session with getUser()');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error verifying user:', error.message);
          if (error.message.includes('Auth session missing')) {
            console.log('Attempting to refresh session...');
            const { data: { session: refreshedSession }, error: refreshError } = 
              await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Refresh session error:', refreshError);
              return false;
            }
            
            if (refreshedSession) {
              console.log('Session refreshed, retrying getUser()');
              const retry = await supabase.auth.getUser();
              if (retry.error) {
                console.error('Retry failed:', retry.error);
                return false;
              }
              setUser(retry.data.user);
              return true;
            }
          }
          return false;
        }
        
        if (user) {
          console.log('Successfully verified user:', user.email);
          setUser(user);
          return true;
        }
        
        return false;
      } catch (err) {
        console.error('Exception in verifyAndSetUser:', err);
        return false;
      } finally {
        if (!session) {
          setUser(null);
        }
      }
    };

    // Immediately verify server session if provided
    if (serverSession) {
      console.log('Verifying server-provided session');
      verifyAndSetUser(serverSession).then((verified) => {
        if (verified) {
          setSession(serverSession);
        }
        setLoading(false);
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log("Auth state changed on client:", _event, currentSession);
        
        // Always verify the user with getUser() regardless of event type
        const verified = await verifyAndSetUser(currentSession);
        if (verified) {
          setSession(currentSession);
        } else {
          setSession(null);
        }

        if (!initialStateProcessed) {
          console.log('Initial auth state resolved');
          setLoading(false);
          initialStateProcessed = true;
        }
      }
    );

    // Fallback timeout if no auth state change is detected
    const timer = setTimeout(() => {
      if (!initialStateProcessed) {
        console.log('Auth state timeout - no session detected');
        setLoading(false);
        initialStateProcessed = true;
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      authListener?.subscription.unsubscribe();
      console.log('Cleaned up auth listener');
    };
  }, [supabase.auth, serverSession, serverUser]);

  const value = { session, user, loading, supabase }; // Include session, user, loading, and supabase in the context value

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
