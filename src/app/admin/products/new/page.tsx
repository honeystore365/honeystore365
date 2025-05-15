'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionProvider'; // Import useSession
import { CustomForm } from '@/components/form';
import { useRouter } from 'next/navigation';
import * as z from "zod"
import { FieldPath } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import type { FileWithPath } from 'react-dropzone';

const productSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit comporter au moins 2 caractères.",
  }),
  description: z.string().optional(),
  price: z.number().min(0, {
    message: "Le prix doit être supérieur à 0.",
  }),
  stock: z.number().min(0, {
    message: "Le stock doit être supérieur à 0.",
  }),
  image_url: z.string().optional(),
  image_file: z.custom<FileWithPath>().optional(),
  categoryIds: z.array(z.string()).optional(),
})

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]); // State for categories
  const [loadingCategories, setLoadingCategories] = useState(true); // State for category loading
  const [categoryError, setCategoryError] = useState<string | null>(null); // State for category fetching error

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      // Use supabase client from session context
      const { supabase: supabaseClient } = useSession();
      const { data, error } = await supabaseClient
        .from('categories')
        .select('id, name') // Select only id and name
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        setCategoryError(error.message);
        setCategories([]);
      } else {
        setCategories(data || []);
        setCategoryError(null);
      }
      setLoadingCategories(false);
    };

    fetchCategories();
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = async (values: z.infer<typeof productSchema>) => {
    setLoading(true);
    setError('');

    // Use supabase client from session context
    const { supabase } = useSession();
    
    // Handle image upload if file exists
    let imageUrl = values.image_url;
    if (values.image_file) {
      const file = values.image_file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      try {
        // Direct upload to Supabase Storage using S3 endpoint
        const { error: uploadError } = await supabase
          .storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: `image/${fileExt}`
            // Removed endpoint and region as they are not valid FileOptions
          });

        if (uploadError) {
          setError('Failed to upload image: ' + uploadError.message);
          setLoading(false);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      } catch (error) {
        setError('An unexpected error occurred: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setLoading(false);
        return;
      }
    }

    const { categoryIds, image_file, ...productValues } = values;
    productValues.image_url = imageUrl;

    // Explicitly convert price and stock to numbers
    const productValuesWithNumbers = {
      ...productValues,
      price: Number(productValues.price),
      stock: Number(productValues.stock),
    };

    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([productValues]) // Insert product without categoryIds
      .select(); // Select the inserted product to get its ID

    if (productError) {
      console.error('Error creating product:', productError);
      setError(productError.message);
      setLoading(false);
      return; // Stop if product creation fails
    }

    const newProductId = productData?.[0]?.id;

    if (categoryIds && categoryIds.length > 0 && newProductId) {
      const productCategoriesToInsert = categoryIds.map(categoryId => ({
        product_id: newProductId,
        category_id: categoryId,
      }));

      const { error: productCategoryError } = await supabase
        .from('product_categories')
        .insert(productCategoriesToInsert);

      if (productCategoryError) {
        console.error('Error linking product to categories:', productCategoryError);
        // Decide how to handle this error - maybe delete the product?
        // For now, we'll just log it and proceed.
        setError('Product created, but failed to link to categories: ' + productCategoryError.message);
      }
    }

    if (!productError && !error) { // Only redirect if both product and category linking were successful or categoryIds was empty
      router.push('/admin/products'); // Redirect to products list
    }

    setLoading(false);
  };

  const fields: { // Explicitly type the fields array
    name: FieldPath<z.infer<typeof productSchema>>;
    label: string;
    description?: string;
    type?: string;
  }[] = [
    { name: 'name', label: 'الاسم', description: 'اسم المنتج' }, // Updated to Arabic
    { name: 'description', label: 'الوصف', description: 'وصف المنتج', type: 'textarea' }, // Updated to Arabic
    { name: 'price', label: 'السعر', description: 'سعر المنتج', type: 'number' }, // Updated to Arabic
    { name: 'stock', label: 'المخزون', description: 'كمية المخزون', type: 'number' }, // Updated to Arabic
    { name: 'image_file', label: 'رفع صورة', description: 'اختر صورة للمنتج', type: 'file' },
    { // Add category selection field
      name: 'categoryIds',
      label: 'الفئات', // Updated to Arabic
      description: 'اختر الفئات لهذا المنتج', // Updated to Arabic
      type: 'category-select',
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">إضافة منتج جديد</h1> {/* Updated heading to Arabic */}
      {error && <p className="text-red-500">{error}</p>}
      {loadingCategories ? (
        <div>جاري تحميل الفئات...</div> /* Updated loading message to Arabic */
      ) : categoryError ? (
        <div className="text-red-500">خطأ في تحميل الفئات: {categoryError}</div> /* Updated error message to Arabic */
      ) : (
        <CustomForm
          schema={productSchema}
          onSubmit={handleSubmit}
          fields={fields}
          categories={categories} // Pass categories to CustomForm
        />
      )}
      {loading && <div>جاري الإضافة...</div>} {/* Updated loading message to Arabic */}
    </div>
  );
}
