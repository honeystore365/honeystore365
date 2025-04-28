import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/components/data-table';

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const categoryColumns = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
];

import AdminLayout from '../layout';

export default async function CategoriesPage() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error fetching categories:', error);
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-4">Categories</h1>
        <DataTable columns={categoryColumns} data={categories as Category[]} />
      </div>
    </AdminLayout>
  );
}
