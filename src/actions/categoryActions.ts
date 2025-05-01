'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
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
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

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