'use client';

import { createBrowserClient } from '@supabase/ssr';

export const createClientComponent = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are not set for client component.');
    // In a production environment, you might want to throw an error or handle this more gracefully.
    // For now, we'll proceed with the assumption they will be set, but log the error.
    // This might lead to runtime errors if not properly handled upstream.
  }

  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
};
