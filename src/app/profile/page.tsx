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
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
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
      router.push('/auth/login');
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
      // If no profile exists, create one
      if (profileError.message.includes('JSON object requested, multiple (or no) rows returned')) {
        const { data: newProfileData, error: newProfileError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, username: 'user-' + user.id }])
          .select('*')
          .single<Profile>();

        if (newProfileError) {
          console.error('Error creating profile:', newProfileError);
          setError(newProfileError.message);
        } else {
          setProfile(newProfileData);
        }
      }
    } else {
      setProfile(profileData);
    }

    // Fetch customer data
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, created_at') // Specify columns to avoid issues with extra columns
      .eq('id', user.id)
      .single<Customer>();

    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      setError(customerError.message);
       // If no customer exists, create one
       if (customerError.message.includes('JSON object requested, multiple (or no) rows returned')) {
         const { data: newCustomerData, error: newCustomerError } = await supabase
           .from('customers')
           .insert([{ id: user.id, email: user.email, first_name: '', last_name: '' }]) // Include email from auth user
           .select('id, first_name, last_name, email, created_at')
           .single<Customer>();

         if (newCustomerError) {
           console.error('Error creating customer:', newCustomerError);
           setError(newCustomerError.message);
         } else {
           setCustomer(newCustomerData);
         }
       }
    } else {
      setCustomer(customerData);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Loading profile...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error}</div>;
  }

  if (!profile || !customer) {
     return <div className="container mx-auto py-10 text-center text-gray-600">Could not load profile data.</div>;
  }

 const updateProfile = async () => {
   setLoading(true);
   setError('');

   const { error: updateError } = await supabase
     .from('profiles')
     .update({ username, website })
     .eq('id', profile?.id);

   if (updateError) {
     console.error('Error updating profile:', updateError);
     setError(updateError.message);
   } else {
     // Refresh profile data
     fetchProfileAndCustomer();
     setEditing(false);
   }

   setLoading(false);
 };

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
           {editing ? (
             <>
               <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                 Username:
               </label>
               <input
                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                 id="username"
                 type="text"
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
               />
               <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="website">
                 Website:
               </label>
               <input
                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                 id="website"
                 type="text"
                 value={website}
                 onChange={(e) => setWebsite(e.target.value)}
               />
             </>
           ) : (
             <>
               <p>
                 <strong>Username:</strong> {profile?.username}
               </p>
               <p>
                 <strong>Website:</strong> {profile?.website}
               </p>
               <p>
                 <strong>First Name:</strong> {customer?.first_name}
               </p>
               <p>
                 <strong>Last Name:</strong> {customer?.last_name}
               </p>
               <p>
                 <strong>Email:</strong> {customer?.email}
               </p>
             </>
           )}
          </div>
        </div>
      </div>
      {editing ? (
       <button
         className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
         onClick={updateProfile}
       >
         Save
       </button>
      ) : (
       <button
         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
         onClick={() => setEditing(true)}
       >
         Edit Profile
       </button>
      )}
      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-4"
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
