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
// import ProfileEditor from './ProfileEditorClient'; 

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
    .eq('id', user.id)
    .single<Customer>();
  
  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, description, price, image_url');

  if (profileError) {
    console.error('Error fetching profile data:', profileError.message);
    // Potentially redirect or show a specific error message for profile
  }
  if (customerError) {
    console.error('Error fetching customer data:', customerError.message);
    // Potentially redirect or show a specific error message for customer
  }
  if (productsError) {
    console.error('Error fetching products:', productsError);
    // Optionally, render an error message to the user for products
  }

  // Basic loading/error state for critical data
  if (!user) {
    return <div className="container mx-auto py-10 text-center">Authenticating...</div>;
  }
  // If profile or customer doesn't exist, it might be an issue or first-time setup.
  // For now, we'll proceed, but in a real app, you might want to guide the user.

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        حسابي وصفحة المنتجات
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile and Orders Section (Left/Top on mobile) */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              معلومات الملف الشخصي
            </h2>
            <div className="bg-white shadow-md rounded-xl p-6 space-y-3">
              <p><strong>اسم المستخدم:</strong> {profile?.username || 'غير متوفر'}</p>
              <p><strong>الموقع الإلكتروني:</strong> {profile?.website || 'غير متوفر'}</p>
              <p><strong>الاسم الأول:</strong> {customer?.first_name || 'غير متوفر'}</p>
              <p><strong>الاسم الأخير:</strong> {customer?.last_name || 'غير متوفر'}</p>
              <p><strong>البريد الإلكتروني:</strong> {customer?.email || user.email}</p>
              {/* Add Edit Profile Button here if needed, linking to a separate edit page or modal */}
              {/* 
                <Button asChild className="mt-4 w-full">
                  <Link href="/profile/edit">تعديل الملف الشخصي</Link>
                </Button> 
              */}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">
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
