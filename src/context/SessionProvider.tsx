'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClientComponent } from '@/lib/supabaseClient'; // Use client component client

type SessionContextType = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  serverSession: Session | null; // Session fetched on the server
}

export function SessionProvider({ children, serverSession }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(serverSession);
  // If serverSession is null, we might be waiting for client-side hydration to confirm session status
  const [loading, setLoading] = useState(serverSession === null); 
  const supabase = createClientComponent();

  useEffect(() => {
    // This effect runs on the client after initial render.
    // If serverSession was provided, we used that.
    // The listener handles subsequent changes.

    // If serverSession was null, the client needs to determine the auth state.
    // onAuthStateChange will fire shortly after supabase client initializes.
    // We set loading to true initially if serverSession was null,
    // and onAuthStateChange will set it to false once state is known.
    
    let initialStateProcessed = serverSession !== null;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        console.log("Auth state changed on client:", _event, currentSession);
        setSession(currentSession);
        if (!initialStateProcessed) {
          setLoading(false);
          initialStateProcessed = true;
        } else {
          // For subsequent changes after initial load, ensure loading is false.
          setLoading(false);
        }
      }
    );
    
    // If serverSession was null and onAuthStateChange hasn't fired yet
    // (e.g. no active session client-side either), ensure loading becomes false.
    // This timeout is a fallback in case onAuthStateChange doesn't fire immediately
    // if there's truly no session.
    if (serverSession === null) {
        const timer = setTimeout(() => {
            if (!initialStateProcessed) { // Check if onAuthStateChange has already run
                setLoading(false);
                initialStateProcessed = true; 
            }
        }, 500); // Adjust timeout as needed
        return () => {
            clearTimeout(timer);
            authListener?.subscription.unsubscribe();
        };
    }


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth, serverSession]); // Add serverSession to dependencies

  const value = { session, loading };

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
