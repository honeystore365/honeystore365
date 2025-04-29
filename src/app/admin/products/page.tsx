// Ce fichier a été déplacé dans src/app/admin/products/page.tsx

import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/components/data-table';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
}

const productColumns = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'price',
    header: 'Price',
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
  },
];

import AdminLayout from '../layout';

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, price, stock, created_at');

  if (error) {
    console.error('Error fetching products:', error);
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-4">Products</h1>
        <DataTable columns={productColumns} data={products as Product[]} />
      </div>
    </AdminLayout>
  );
}
