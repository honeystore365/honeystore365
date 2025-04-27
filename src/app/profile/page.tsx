'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  website: string | null;
  updated_at: string | null;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProfileAndCustomer();
  }, []);

  const fetchProfileAndCustomer = async () => {
    setLoading(true);
    setError('');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || 'User not authenticated.');
      setLoading(false);
      return;
    }

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      setError(profileError.message);
    } else {
      setProfile(profileData);
    }

    // Fetch customer data
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single<Customer>();

    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      setError(customerError.message);
    } else {
      setCustomer(customerData);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Loading profile...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error}</div>;
  }

  if (!profile || !customer) {
     return <div className="container mx-auto py-10 text-center text-gray-600">Could not load profile data.</div>;
  }


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        حسابي
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order History */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            سجل الطلبات
          </h2>
          <div className="flex flex-col gap-4">
            {/* Order history will be fetched and displayed here */}
            <div className="border rounded-xl p-4 shadow-sm">
               <p className="text-gray-600">Order history coming soon...</p>
            </div>
          </div>
        </div>

        {/* User Profile Management */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            إدارة الملف الشخصي
          </h2>
          <div className="flex flex-col gap-4">
             <p><strong>Username:</strong> {profile.username}</p>
             <p><strong>First Name:</strong> {customer.first_name}</p>
             <p><strong>Last Name:</strong> {customer.last_name}</p>
             <p><strong>Email:</strong> {customer.email}</p>
             {/* Add more profile fields as needed */}
          </div>
        </div>
      </div>
      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        onClick={async () => {
          await supabase.auth.signOut();
          router.push('/auth/login');
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
