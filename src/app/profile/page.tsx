import { createClientServer } from '@/lib/supabaseClientServer';
import { redirect } from 'next/navigation';
// Image, Button, ShoppingCart will be used in ProductCardClient
import ProductCardClient from '@/components/ProductCardClient'; // Import the new client component

// Define types (can be moved to a types file or shared)
interface Product { // This type should be consistent with ProductCardClient
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
}

interface Profile {
  id: string;
  username: string | null; // Allow null
  avatar_url: string | null;
  website: string | null;
  updated_at: string | null;
}

interface Customer {
  id: string;
  first_name: string | null; // Allow null
  last_name: string | null; // Allow null
  email: string | null; // Allow null
  created_at: string;
}

// Placeholder for a client component to handle profile editing if needed later
// For now, we'll keep profile display simple within the server component.
import ProfileForm from '@/components/ProfileForm'; // Import the new form component

export default async function ProfilePage() {
  const supabase = await createClientServer();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('ProfilePage: User not authenticated.', userError);
    redirect('/auth/login?message=Please log in to view your profile.');
  }

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  // Fetch customer data
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, created_at')
    .eq('id', user.id) // customer.id is the same as user.id
    .single<Customer>();

  // Fetch address data for the customer
  // Assuming customer.id is the foreign key in the addresses table
  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', user.id) // user.id is the customer_id for their address
    .limit(1) // Get the first address, assuming one primary or most recent
    .single(); // Use single if you expect one or zero, or remove if multiple are possible

  // Fetch products (remains the same)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, description, price, image_url');

  if (profileError) {
    console.error('Error fetching profile (profiles table) data:', profileError.message);
  }
  if (customerError) {
    console.error('Error fetching customer (customers table) data:', customerError.message);
  }
  if (addressError && addressError.code !== 'PGRST116') { // PGRST116 means no rows found, which is okay
    console.error('Error fetching address data:', addressError.message);
  }
  if (productsError) {
    console.error('Error fetching products:', productsError);
  }

  if (!user) { // Should have been caught by redirect earlier, but good check
    return <div className="container mx-auto py-10 text-center">Authenticating...</div>;
  }

  // If customer record doesn't exist, it means it's a new user who hasn't filled out customer details.
  // The ProfileForm will handle creating the customer record via the server action.
  const customerDataForForm = customer || { id: user.id, email: user.email, first_name: null, last_name: null };
  const addressDataForForm = address || null;


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        ملفي الشخصي وإدارة العنوان
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          {/* Render the ProfileForm for editing/creating profile info */}
          <ProfileForm customer={customerDataForForm} address={addressDataForForm} />
          
          {/* Display existing profile info (optional, could be part of ProfileForm or separate) */}
          {/* This section can be removed or adapted if ProfileForm handles all display */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">
              المعلومات الحالية (للعرض)
            </h2>
            <div className="bg-gray-100 shadow-md rounded-xl p-6 space-y-3">
              <p><strong>اسم المستخدم (من profiles):</strong> {profile?.username || 'غير متوفر'}</p>
              <p><strong>الاسم الأول (من customers):</strong> {customer?.first_name || 'غير متوفر'}</p>
              <p><strong>اسم العائلة (من customers):</strong> {customer?.last_name || 'غير متوفر'}</p>
              <p><strong>البريد الإلكتروني:</strong> {customer?.email || user.email}</p>
              <p><strong>العنوان:</strong> {address?.address_line_1 || 'غير متوفر'}</p>
              <p><strong>الهاتف:</strong> {address?.phone_number || 'غير متوفر'}</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 mt-8">
              سجل الطلبات
            </h2>
            <div className="bg-white shadow-md rounded-xl p-6">
              <p className="text-gray-600">سجل الطلبات سيظهر هنا قريباً...</p>
              {/* Order history will be fetched and displayed here */}
            </div>
          </div>
        </div>

        {/* Products Section (Right/Bottom on mobile) */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">
            المنتجات المتوفرة
          </h2>
          {!products || products.length === 0 ? (
            <p className="text-gray-600">لا توجد منتجات لعرضها حالياً.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(products as Product[]).map((product) => (
                // Use the client component for each product card
                <ProductCardClient key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 
        Sign Out Button: 
        This is better handled in a global component like the SiteHeader,
        which is already a client component and can call supabase.auth.signOut().
        A form action to a server action for sign out is also an option.
        Example server action for sign out (add to src/actions/authActions.ts):
        
        'use server';
        import { createClientServer } from '@/lib/supabaseClientServer';
        import { redirect } from 'next/navigation';

        export async function signOutAction() { // Renamed to avoid conflict if signOut exists
          const supabase = await createClientServer();
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('Sign out error:', error);
            // Optionally redirect with error or handle differently
          }
          redirect('/auth/login'); // Redirect to login page after sign out
        }

        Then the form would be:
        <form action={signOutAction} className="mt-12 text-center">
          <Button type="submit" variant="destructive">Sign Out</Button>
        </form>
      */}
    </div>
  );
}
