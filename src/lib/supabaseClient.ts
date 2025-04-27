import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://llsifflkfjogjagmbmpi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsc2lmZmxrZmpvZ2phZ21ibXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MzY5OTMsImV4cCI6MjA2MTExMjk5M30.4uOd3OY7lhe1kYjROF5Y_2ob1v8Nm-QIMFx6MOzq1Vs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);