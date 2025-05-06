'use server';

import { createClientServer } from '@/lib/supabaseClientServer';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClientServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('Server Action: signInWithPassword error:', error);

  if (error) {
    console.error('Server Action Sign In Error:', error);
    // TODO: Handle error redirection or message
    redirect('/auth/login?message=Could not authenticate user');
  }

  console.log('Server Action: Sign in successful. Checking session immediately...');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('Server Action: getSession data:', sessionData);
  console.log('Server Action: getSession error:', sessionError);

  // Fetch user data to check role after successful sign-in
  console.log('Server Action: Attempting to get user...');
  const { data: authData, error: authError } = await supabase.auth.getUser();
  console.log('Server Action: getUser data:', authData);
  console.log('Server Action: getUser error:', authError);

  if (authError) {
    console.error('Server Action Get User Error:', authError);
    // TODO: Handle error redirection or message
    redirect('/auth/login?message=Could not retrieve user data');
  }

  const user = authData?.user;
  const userRole =
    user?.user_metadata?.role ||
    user?.user_metadata?.["role"] ||
    user?.app_metadata?.role ||
    user?.app_metadata?.["role"];

  console.log('Server Action: User role after sign in:', userRole);

  if (userRole === 'admin') {
    console.log('Server Action: Admin detected, redirecting to /admin');
    redirect('/admin');
  } else {
    console.log('Server Action: Non-admin user detected, redirecting to /');
    redirect('/');
  }
}