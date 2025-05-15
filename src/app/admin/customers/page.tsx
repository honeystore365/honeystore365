'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/context/SessionProvider'; // Import useSession
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/confirmation-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Interface for Customer data
interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<boolean>(false);

  const { supabase } = useSession(); // Move useSession here

  // Fetch non-admin customers using RPC function
  const fetchCustomers = useCallback(async (supabaseClient: any) => { // Accept supabase as argument
    console.log("CustomersPage: Fetching non-admin customers...");
    setLoading(true);
    setError(null);
    // Use supabase client from session context
    const { data, error: rpcError } = await supabaseClient.rpc('get_non_admin_customers'); // Use the argument

    if (rpcError) {
      console.error('CustomersPage: Error fetching non-admin customers:', rpcError);
      setError(rpcError.message);
      setCustomers([]);
    } else {
      console.log("CustomersPage: Successfully fetched non-admin customers", data);
      setCustomers((data as Customer[]) || []);
    }
    setLoading(false);
  }, [supabase]); // Add supabase to dependency array

  useEffect(() => {
    fetchCustomers(supabase); // Pass supabase to fetchCustomers
  }, [fetchCustomers, supabase]); // Add supabase to dependency array

  // Handler for updating customer - Using FormData
  const handleUpdateCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCustomer) return;

    setIsSubmitting(true);
    setEditError(null);
    setEditSuccess(false);

    // Extract data from form event
    const formData = new FormData(event.currentTarget);
    const updatedData = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        // Only update first/last name for now
    };

    // Basic validation
    if (!updatedData.first_name?.trim() || !updatedData.last_name?.trim()) {
        setEditError('الاسم الأول واسم العائلة مطلوبان.');
        setIsSubmitting(false);
        return;
    }

    console.log(`Attempting to update customer ${editingCustomer.id} with:`, updatedData); // Log actual data

    // Use supabase client from session context
    const { data: updatedCustomerData, error: updateError } = await supabase // Use supabase from outer scope
        .from('customers')
        .update(updatedData) // Use actual form data
        .eq('id', editingCustomer.id)
        .select(); // Add select()

    if (updateError) {
        console.error('Error updating customer:', updateError);
        setEditError(updateError.message);
    } else {
        // Check if data array is empty, indicating no row was matched/updated/returned
        if (!updatedCustomerData || updatedCustomerData.length === 0) {
             console.warn(`Customer update API call succeeded but returned no data. ID '${editingCustomer?.id}' might not have been found or RLS prevented SELECT.`);
             setEditError("Update API call succeeded but no data was returned. Row might not exist or RLS blocks select."); // Inform user
             // Keep dialog open to show the error.
        } else {
             console.log('Customer update successful (API level). Returned data:', updatedCustomerData);
             setEditSuccess(true);
             // Remove setTimeout for faster UI update
             setIsEditDialogOpen(false);
             setEditingCustomer(null);
             setEditSuccess(false); // Reset success state immediately (or keep it for a moment if needed)
             fetchCustomers(); // Refresh list immediately
        }
    }
    setIsSubmitting(false);
  };

  // Define columns inside component
  const customerColumns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'first_name',
      header: 'الاسم الأول',
    },
    {
      accessorKey: 'last_name',
      header: 'اسم العائلة',
    },
    {
      accessorKey: 'email',
      header: 'البريد الإلكتروني',
    },
    {
      accessorKey: 'created_at',
      header: 'تاريخ الإنشاء',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return date.toLocaleDateString();
      },
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }) => {
        const customer = row.original;
        const [isDeleting, setIsDeleting] = useState(false);

        const handleDelete = async () => {
          setIsDeleting(true);
          // Use supabase client from session context
          const { error: deleteError } = await supabase // Use supabase from outer scope
            .from('customers')
            .delete()
            .eq('id', customer.id);

          if (deleteError) {
            console.error('Error deleting customer:', deleteError);
            alert(`Error deleting customer: ${deleteError.message}`);
            setIsDeleting(false);
            return false;
          }

          // Also delete the user from auth.users
          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(customer.id);

          if (authDeleteError) {
            console.error('Error deleting auth user:', authDeleteError);
            alert(`Error deleting auth user: ${authDeleteError.message}`);
            setIsDeleting(false);
            return false; // Indicate failure
          }

          await fetchCustomers(supabase); // Refresh list
          setIsDeleting(false);
          console.log('Customer and auth user deleted successfully.'); // Log success
          return true;
        };

        const handleEditClick = () => {
          setEditingCustomer(customer);
          setIsEditDialogOpen(true);
          setEditError(null);
          setEditSuccess(false);
        };

        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              تعديل
            </Button>
            <ConfirmationModal
              title="حذف العميل"
              description="هل أنت متأكد أنك تريد حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
              onConfirm={handleDelete}
              confirmText="حذف"
              cancelText="إلغاء"
            >
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? 'جاري الحذف...' : 'حذف'}
              </Button>
            </ConfirmationModal>
          </div>
        );
      },
    },
  ];

  console.log("CustomersPage: Rendering component", { loading, error, customers });

  return (
    <>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-4">العملاء</h1>
        {loading && <div className="text-center">جاري تحميل العملاء...</div>}
        {error && <div className="text-center text-red-500">خطأ في تحميل العملاء: {error}</div>}
        {!loading && !error && customers.length > 0 && (
          <DataTable columns={customerColumns} data={customers} />
        )}
        {!loading && !error && customers.length === 0 && (
          <div className="text-center">لا يوجد عملاء حالياً (باستثناء المسؤولين).</div>
        )}
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل العميل</DialogTitle>
            <DialogDescription>
              قم بتحديث تفاصيل العميل. (البريد الإلكتروني غير قابل للتعديل هنا).
            </DialogDescription>
          </DialogHeader>
          {/* Updated form to use onSubmit */}
          <form onSubmit={handleUpdateCustomer}>
            <div className="grid gap-4 py-4">
              {editError && <p className="text-red-500 text-sm">{editError}</p>}
              {editSuccess && <p className="text-green-600 text-sm">تم تحديث العميل بنجاح!</p>}

              {/* Display Email (Readonly) */}
               <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-email" className="text-right">
                   البريد الإلكتروني
                 </Label>
                 <Input
                   id="edit-email"
                   name="email"
                   defaultValue={editingCustomer?.email || ''}
                   className="col-span-3 text-right"
                   readOnly
                 />
               </div>

              {/* Edit First Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-first_name" className="text-right">
                  الاسم الأول
                </Label>
                <Input
                  id="edit-first_name"
                  name="first_name"
                  defaultValue={editingCustomer?.first_name || ''}
                  className="col-span-3 text-right"
                  required
                />
              </div>
              {/* Edit Last Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-last_name" className="text-right">
                  اسم العائلة
                </Label>
                <Input
                  id="edit-last_name"
                  name="last_name"
                  defaultValue={editingCustomer?.last_name || ''}
                  className="col-span-3 text-right"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري التحديث...' : 'تحديث العميل'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
