'use client';
// Ce fichier a été déplacé dans src/app/admin/products/page.tsx

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/context/SessionProvider'; // Import useSession
import { DataTable } from '@/components/data-table';
import Link from 'next/link'; // Import Link
import { Button } from '@/components/ui/button'; // Import Button

import { Row } from '@tanstack/react-table'; // Import Row type
import { ConfirmationModal } from '@/components/confirmation-modal'; // Ensure ConfirmationModal is imported at the top

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
  image_url?: string; // Make image_url optional as it might not always be present
}

// AdminLayout and ConfirmationModal are imported further down, which is fine.

export default function ProductsPage() {
  const [products, setProductsInternal] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add refreshKey state

  const { supabase } = useSession(); // Move useSession here

  const fetchProducts = useCallback(async (supabaseClient: any) => { // Accept supabase as argument
    setLoading(true);
    // Use supabase client from session context
    const { data, error: fetchError } = await supabaseClient // Use the argument
      .from('products')
      .select('id, name, description, price, stock, created_at, image_url');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      setError(fetchError.message);
      setProductsInternal([]); // Use renamed setter
    } else {
      setProductsInternal(data || []); // Use renamed setter
      setError(null);
    }
    setLoading(false);
  }, [supabase]); // Add supabase to dependency array

  useEffect(() => {
    fetchProducts(supabase); // Pass supabase to fetchProducts
  }, [fetchProducts, refreshKey, supabase]); // Add supabase to dependency array

  // Define productColumns inside the component to access fetchProducts
  const productColumns = [
    {
      accessorKey: 'image_url', // Access the image_url field
    header: 'الصورة', // Header in Arabic
    cell: ({ row }: { row: Row<Product> }) => { // Custom cell renderer with type annotation
      const imageUrl = row.getValue('image_url') as string;
      // console.log('Original Image URL:', imageUrl); // Log original URL
      // Google Drive transformation removed as it was causing 403 errors.
      // It's recommended to use direct image links or a proper image hosting service.
      const displayImageUrl = imageUrl;

      // console.log('Using Image URL:', displayImageUrl);

      return displayImageUrl ? (
        <img src={displayImageUrl} alt="Product Image" style={{ width: '50px', height: '50px', objectFit: 'cover' }} /> // Display image with fixed size
      ) : (
        <span>No Image</span> // Placeholder if no image
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'الاسم', // Header in Arabic
  },
  {
    accessorKey: 'price',
    header: 'السعر', // Header in Arabic
  },
  {
    accessorKey: 'stock',
    header: 'المخزون', // Header in Arabic
  },
  {
    id: 'actions',
    cell: ({ row }: { row: Row<Product> }) => {
      const product = row.original;
      const [isDeleting, setIsDeleting] = useState(false);

      const handleDelete = async () => {
        setIsDeleting(true);
        // Use supabase client from session context
        const { error } = await supabase // Use supabase from outer scope
          .from('products')
          .delete()
          .eq('id', product.id);

        if (error) {
          console.error('Error deleting product:', error);
          setIsDeleting(false);
          return false;
        }

        // Refresh the product list by incrementing refreshKey
        setRefreshKey(oldKey => oldKey + 1);
        setIsDeleting(false);
        return true;
      };

      return (
        <div className="flex items-center gap-2">
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button variant="outline" size="sm">
              تعديل
            </Button>
          </Link>
          <ConfirmationModal
            title="حذف المنتج"
            description="هل أنت متأكد أنك تريد حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
            onConfirm={handleDelete}
          >
            <span>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? 'جاري الحذف...' : 'حذف'}
              </Button>
            </span>
          </ConfirmationModal>
        </div>
      );
    },
  },
];

// Imports for AdminLayout and ConfirmationModal are already at the top with other imports if not used before this point.
// If they are used by productColumns, they need to be imported before ProductsPage component.
// Let's ensure they are at the top.
// The handleDeleteProduct callback is not used by the columns, so it can be removed or kept for other purposes.
// For now, let's assume it's not needed by the columns.

  // const handleDeleteProduct = useCallback(async (productId: string) => { ... }, [fetchProducts]); // This was correctly commented out / can be removed


  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">المنتجات</h1>
        <Link href="/admin/products/new">
          <Button>إضافة منتج جديد</Button>
        </Link>
      </div>
      {loading && <div className="text-center">جاري تحميل المنتجات...</div>}
      {error && <div className="text-center text-red-500">خطأ في تحميل المنتجات: {error}</div>}
      {!loading && !error && products.length > 0 && (
        <DataTable columns={productColumns} data={products} />
      )}
      {!loading && !error && products.length === 0 && (
        <div className="text-center">لا توجد منتجات حالياً.</div>
      )}
    </div>
  );
}
