'use client';
// Ce fichier a été déplacé dans src/app/admin/products/page.tsx

import { useState, useEffect } from 'react'; // Import useState and useEffect
import { createClientComponent } from '@/lib/supabaseClient'; // Import createClientComponent
import { DataTable } from '@/components/data-table';
import Link from 'next/link'; // Import Link
import { Button } from '@/components/ui/button'; // Import Button

import { Row } from '@tanstack/react-table'; // Import Row type

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
}

// Add state variables for products, loading, and error
const productColumns = [
  {
    accessorKey: 'image_url', // Access the image_url field
    header: 'الصورة', // Header in Arabic
    cell: ({ row }: { row: Row<Product> }) => { // Custom cell renderer with type annotation
      const imageUrl = row.getValue('image_url') as string;
      console.log('Original Image URL:', imageUrl); // Log original URL
      let displayImageUrl = imageUrl;

      // Check if it's a Google Drive sharable link and transform it
      if (imageUrl && imageUrl.includes('drive.google.com/file/d/')) {
        try {
          const url = new URL(imageUrl);
          const filePath = url.pathname.split('/');
          const fileId = filePath[filePath.indexOf('d') + 1];
          if (fileId) {
            displayImageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
          }
        } catch (e) {
          console.error('Error parsing Google Drive URL:', e);
          displayImageUrl = imageUrl; // Fallback to original URL if parsing fails
        }
      }

      console.log('Transformed Image URL:', displayImageUrl); // Log transformed URL

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
];

import AdminLayout from '../layout';

export default function ProductsPage() { // Remove async
  // Data fetching is now handled in useEffect

  // Add state variables for products, loading, and error
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const supabase = createClientComponent(); // Use createClientComponent
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, stock, created_at, image_url'); // Include image_url

      if (error) {
        console.error('Error fetching products:', error);
        setError(error.message);
        setProducts([]);
      } else {
        setProducts(data || []);
        setError(null);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4" style={{ backgroundColor: 'lightblue', padding: '10px' }}> {/* Add a div for flex layout with debugging styles */}
        <h1 className="text-2xl font-semibold">المنتجات</h1> {/* Updated heading to Arabic */}
        <Link href="/admin/products/new"> {/* Link to the new product page */}
          <Button style={{ backgroundColor: 'salmon', padding: '5px' }}>إضافة منتج جديد</Button> {/* Button text in Arabic, keep debugging styles for now */}
        </Link>
      </div>
      {loading && <div className="text-center">جاري تحميل المنتجات...</div>} {/* Updated loading message to Arabic */}
      {error && <div className="text-center text-red-500">خطأ في تحميل المنتجات: {error}</div>} {/* Updated error message to Arabic */}
      {!loading && !error && products.length > 0 && (
        <DataTable columns={productColumns} data={products} />
      )}
      {!loading && !error && products.length === 0 && (
        <div className="text-center">لا توجد منتجات حالياً.</div> /* Updated message to Arabic */
      )}
    </div>
  );
}
