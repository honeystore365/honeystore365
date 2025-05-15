"use client";

import { useEffect } from 'react';
import { useSession } from '@/context/SessionProvider'; // Import useSession
 
 export function DebugSession() {
  const { supabase } = useSession(); // Call useSession at the top level

  useEffect(() => {
    const fetchSession = async () => {
      // Use the supabase client obtained outside
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Client Session:', session);
      if (error) {
        console.error('Error fetching session:', error);
      }
    };
    fetchSession();
  }, [supabase]); // Add supabase to dependencies

  return null;
}