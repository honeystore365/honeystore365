'use server';

import { createClientServer } from '@/lib/supabaseClientServer';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClientServer();

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('Server Action: signInWithPassword result:', {
    session: signInData?.session,
    user: signInData?.user,
    error
  });

  if (error) {
    console.error('Server Action Sign In Error:', error);
    redirect('/auth/login?message=Could not authenticate user');
  }

  // Verify session cookie was set
  const { data: cookieCheck } = await supabase.auth.getSession();
  console.log('Server Action: Post-login session check:', cookieCheck);

  console.log('Server Action: Sign in successful. Checking session immediately...');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log('Server Action: getUser error:', userError); // Keep error log

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
    console.log('Server Action: Non-admin user detected, redirecting to /profile');
    redirect('/profile');
  }
}
