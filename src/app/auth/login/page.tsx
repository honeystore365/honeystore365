'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      // Fetch user data
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Error getting user:', authError);
        return;
      }
      const userId = authData?.user?.id;

      // Fetch user from auth.users table
      const { data: users, error: userError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
      } else {
        // Check if user exists in customers table
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', userId)
          .single();

        if (customerError) {
          console.error('Error fetching customer:', customerError);
        }

        if (!customer || customerError) {
          // Insert user into customers table
          const { error: insertCustomerError } = await supabase
            .from('customers')
            .insert([
              { id: userId, first_name: '', last_name: '', email: email, created_at: new Date() }
            ]);

          if (insertCustomerError) {
            console.error('Error inserting customer:', insertCustomerError);
          } else {
            console.log('Customer inserted successfully on sign-in.');
          }
        }

        // Check if user exists in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (!profile || profileError) {
          // Insert user into profiles table
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert([
              { id: userId, username: email, updated_at: new Date() }
            ]);

          if (insertProfileError) {
            console.error('Error inserting profile:', insertProfileError);
          } else {
            console.log('Profile inserted successfully on sign-in.');
          }
        }
      }
      router.push('/'); // Redirect to home page after successful login
    }
  };

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        تسجيل الدخول
      </h1>

      <div className="max-w-md mx-auto px-4 py-8 bg-white rounded-xl shadow-lg">
        <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <label className="flex flex-col">
            البريد الإلكتروني:
            <input
              type="email"
              className="border rounded-md p-2"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col">
            كلمة المرور:
            <input
              type="password"
              className="border rounded-md p-2"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-3 rounded-full transition-colors duration-300">
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-primary hover:underline">
            هل نسيت كلمة المرور؟
          </a>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            أو سجل الدخول باستخدام
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            {/* Social Auth Buttons */}
            <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
              جوجل
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
              فيسبوك
            </button>
            {/* Add more social auth buttons here */}
          </div>
        </div>
      </div>
    </div>
  );
}
