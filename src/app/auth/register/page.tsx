
'use client';

import { useState } from 'react';
import { useSession } from '@/context/SessionProvider'; // Import useSession
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
 
    // Use supabase client from session context
    const { supabase } = useSession();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    if (!data?.user) return;
    
    const userId = data.user.id
    // Insert into profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { id: userId, username: email, updated_at: new Date() }
      ]);
    if (profileError) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('Profile inserted successfully.');
    }
    // Insert into customers table
    const { error: customerError } = await supabase
      .from('customers')
      .insert([
        { id: userId, first_name: firstName, last_name: lastName, email: email, created_at: new Date() }
      ]);
    if (customerError) {
      console.error('Error creating customer:', customerError);
    } else {
      console.log('Customer inserted successfully.');
    }

    router.push('/auth/login'); // Redirect to login after successful registration
  };

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        إنشاء حساب جديد
      </h1>

      <div className="max-w-md mx-auto px-4 py-8 bg-white rounded-xl shadow-lg">
        <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <label className="flex flex-col">
            الاسم الأول:
            <input
              type="text"
              className="border rounded-md p-2"
              placeholder="الاسم الأول"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col">
            الاسم الأخير:
            <input
              type="text"
              className="border rounded-md p-2"
              placeholder="الاسم الأخير"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>
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
          <label className="flex flex-col">
            تأكيد كلمة المرور:
            <input
              type="password"
              className="border rounded-md p-2"
              placeholder="تأكيد كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-3 rounded-full transition-colors duration-300">
            إنشاء حساب
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            لديك حساب بالفعل؟
            <a href="/auth/login" className="text-primary hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
