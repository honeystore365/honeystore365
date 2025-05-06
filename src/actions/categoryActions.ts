'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Database } from '@/types/supabase'; // Assuming you have a types/supabase.ts file

export async function addCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;

  if (!name) {
    return { error: 'Category name is required.' };
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
        async setAll(cookiesToSet) {
          try {
            const awaitedCookieStore = await cookieStore;
            await Promise.all(cookiesToSet.map(async ({ name, value, options }) => {
              await awaitedCookieStore.set(name, value, options);
            }));
          } catch (e) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.error('Error setting cookies in Server Action:', e); // Added error logging
          }
        },
      },
    }
  );

  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error fetching user in Server Action:', userError);
    return { error: userError.message };
  }
  console.log('Authenticated user in Server Action:', user);
  console.log('Authenticated user role in Server Action:', user?.user?.role);

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, description }])
    .select();

  if (error) {
    console.error('Error inserting category:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/categories');

  return { success: true, category: data[0] };
}