import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/components/data-table';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

const customerColumns = [
  {
    accessorKey: 'first_name',
    header: 'First Name',
  },
  {
    accessorKey: 'last_name',
    header: 'Last Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
];

import AdminLayout from '../layout';

export default async function CustomersPage() {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*');

  if (error) {
    console.error('Error fetching customers:', error);
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-4">Customers</h1>
        <DataTable columns={customerColumns} data={customers as Customer[]} />
      </div>
    </AdminLayout>
  );
}
