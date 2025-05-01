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
      // Attendre un court instant pour s'assurer que la session est propagée
      await new Promise(resolve => setTimeout(resolve, 100)); // Attente de 100ms

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Login Page: Error getting user after sign in:', authError);
        setError('Failed to retrieve user data after login.'); // Informer l'utilisateur
        return;
      }
      // Vérification du rôle admin
      const user = authData?.user;
      console.log('Login Page: User object after sign in:', user); // Log de l'objet utilisateur complet

      const userRole =
        user?.user_metadata?.role ||
        user?.user_metadata?.["role"] ||
        // user?.role || // Le rôle direct sur l'objet user est moins courant pour les métadonnées personnalisées
        user?.app_metadata?.role ||
        user?.app_metadata?.["role"];

      console.log('Login Page: Extracted user role:', userRole); // Log du rôle extrait

      if (userRole === 'admin') {
        console.log('Login Page: Admin detected, redirecting to /admin');
        router.push('/admin');
      } else {
        console.log('Login Page: Non-admin user detected, redirecting to /');
        router.push('/');
      }
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
            <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
              جوجل
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
              فيسبوك
            </button>            
          </div>
        </div>
      </div>
    </div>
  );
}
