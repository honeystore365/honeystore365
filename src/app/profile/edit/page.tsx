import ProfileForm from '@/components/ProfileForm';
import { createClientServerReadOnly } from '@/lib/supabase/server-readonly';
import { redirect } from 'next/navigation';

export default async function ProfileEditPage() {
  const supabase = await createClientServerReadOnly();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login?redirect=/profile/edit');
  }

  // Fetch customer data
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .single();

  if (customerError) {
    console.error('Error fetching customer:', customerError);
  }

  // Fetch address data
  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', user.id)
    .single();

  if (addressError && addressError.code !== 'PGRST116') {
    console.error('Error fetching address:', addressError);
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <ProfileForm 
        initialData={{
          firstName: customer?.first_name || '',
          lastName: customer?.last_name || '',
          email: customer?.email || '',
          phone: address?.phone_number || '',
        }}
        onSubmit={(data) => {
          // Handle form submission
          console.log('Profile form submitted:', data);
        }}
      />
    </div>
  );
}
