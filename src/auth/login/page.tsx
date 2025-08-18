import { useEffect } from 'react';
import { createClientComponent } from '@/lib/supabase/client';

const handleLogin = async (email: string, password: string) => {
  const supabase = createClientComponent();
  const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error.message);
    return;
  }
  if (session) {
    localStorage.setItem('access_token', session.access_token);
    console.log('Access token stored in localStorage');
    console.log('LocalStorage after login:', localStorage.getItem('access_token'));
  }
};

export default function LoginPage() {
  useEffect(() => {
    // Example usage of handleLogin
    handleLogin('admin@example.com', 'password123');
  }, []);

  return (
    <div>
      <h1>Login Page</h1>
      {/* Add your login form here */}
    </div>
  );
}
