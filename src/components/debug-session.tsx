"use client";

import { useEffect } from 'react';
import { createClientComponent } from '@/lib/supabaseClient';

export function DebugSession() {
  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createClientComponent();
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Client Session:', session);
      if (error) {
        console.error('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

  return null;
}