'use client';

import { useState, useEffect } from 'react';
import { createClientComponent } from '@/lib/supabaseClient'; // Changed import
import { CustomForm } from '@/components/form';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import * as z from "zod"
import { FieldPath } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid'; // For image upload
import type { FileWithPath } from 'react-dropzone'; // For image upload

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
  image_file: z.custom<FileWithPath>().optional(), // Add image_file
  categoryIds: z.array(z.string()).optional(), // Add categoryIds
})

// Type for the fetched product data including categories
interface ProductData extends z.infer<typeof productSchema> {
  id: string;
  product_categories?: { category_id: string }[]; // Include related categories
}

export default function EditProductPage() {
  const router = useRouter();
  const { productId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<ProductData | null>(null); // Use ProductData type
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]); // State for categories
  const [loadingCategories, setLoadingCategories] = useState(true); // State for category loading
  const [categoryError, setCategoryError] = useState<string | null>(null); // State for category fetching error

  // Combined fetch function
  const fetchProductAndCategories = async () => {
    setLoading(true);
    setLoadingCategories(true);
    setError('');
    setCategoryError(null);
    const supabaseClient = createClientComponent();

    // Fetch Product with its categories
    const { data: productData, error: productError } = await supabaseClient
      .from('products')
      .select('*, product_categories(category_id)') // Fetch product and related category IDs
      .eq('id', productId)
      .single<ProductData>(); // Use ProductData type

    if (productError) {
      console.error('Error fetching product:', productError);
      setError(productError.message);
    } else {
      setProduct(productData);
    }
    setLoading(false);

    // Fetch All Categories
    const { data: categoriesData, error: categoriesFetchError } = await supabaseClient
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (categoriesFetchError) {
      console.error('Error fetching categories:', categoriesFetchError);
      setCategoryError(categoriesFetchError.message);
      setCategories([]);
    } else {
      setCategories(categoriesData || []);
      setCategoryError(null);
    }
    setLoadingCategories(false);
  };

  useEffect(() => {
    if (productId) {
      fetchProductAndCategories();
    }
  }, [productId]);


  const handleSubmit = async (values: z.infer<typeof productSchema>) => {
    setLoading(true);
    setError('');
    const supabaseClient = createClientComponent();

    // 1. Handle image upload (similar to new product page)
    let imageUrl = product?.image_url; // Start with existing image URL
    if (values.image_file) {
      const file = values.image_file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      try {
        const { error: uploadError } = await supabaseClient.storage
          .from('product-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: `image/${fileExt}` });

        if (uploadError) { throw uploadError; }

        // If upload succeeds, get new public URL
        const { data: urlData } = supabaseClient.storage.from('product-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;

        // Optionally: Delete old image from storage if it exists and is different
        // This requires storing the old image path or deriving it, adding complexity.
        // For now, we'll just upload the new one.

      } catch (uploadError: any) {
        setError('Failed to upload image: ' + uploadError.message);
        setLoading(false);
        return;
      }
    }

    // 2. Prepare product data for update
    const { categoryIds, image_file, ...productValues } = values;
    productValues.image_url = imageUrl; // Use potentially updated imageUrl

    // Explicitly convert price and stock to numbers
    const productValuesWithNumbers = {
      ...productValues,
      price: Number(productValues.price),
      stock: Number(productValues.stock),
    };

    // 3. Update product data
    const { error: updateError } = await supabaseClient
      .from('products')
      .update(productValuesWithNumbers) // Use values with correct types
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating product:', updateError);
      setError(updateError.message);
      setLoading(false);
      return; // Stop if product update fails
    }

    // 4. Update product categories (handle differences)
    const originalCategoryIds = product?.product_categories?.map(pc => pc.category_id) || [];
    const submittedCategoryIds = categoryIds || [];

    const idsToAdd = submittedCategoryIds.filter(id => !originalCategoryIds.includes(id));
    const idsToRemove = originalCategoryIds.filter(id => !submittedCategoryIds.includes(id));

    let categoryError = null;

    if (idsToRemove.length > 0) {
      const { error: deleteError } = await supabaseClient
        .from('product_categories')
        .delete()
        .eq('product_id', productId)
        .in('category_id', idsToRemove);
      if (deleteError) categoryError = deleteError;
    }

    if (idsToAdd.length > 0 && !categoryError) {
      const categoriesToAdd = idsToAdd.map(catId => ({ product_id: productId, category_id: catId }));
      const { error: insertError } = await supabaseClient
        .from('product_categories')
        .insert(categoriesToAdd);
      if (insertError) categoryError = insertError;
    }

    if (categoryError) {
      console.error('Error updating product categories:', categoryError);
      // Set error state, but maybe don't block navigation if product update succeeded
      setError('Product updated, but failed to update categories: ' + categoryError.message);
    }

    if (!updateError && !categoryError) {
      router.push('/admin/products'); // Redirect only if all updates succeed
    }

    setLoading(false);
  };

  // Define fields based on the updated schema
  const fields: {
    name: FieldPath<z.infer<typeof productSchema>>;
    label: string;
    description?: string;
    type?: string;
  }[] = [
    { name: 'name', label: 'الاسم', description: 'اسم المنتج' },
    { name: 'description', label: 'الوصف', description: 'وصف المنتج', type: 'textarea' },
    { name: 'price', label: 'السعر', description: 'سعر المنتج', type: 'number' },
    { name: 'stock', label: 'المخزون', description: 'كمية المخزون', type: 'number' },
    // Removed image_url field
    { name: 'image_file', label: 'رفع صورة جديدة (اختياري)', description: 'اختر صورة جديدة لاستبدال الصورة الحالية', type: 'file' },
    { name: 'categoryIds', label: 'الفئات', description: 'اختر الفئات لهذا المنتج', type: 'category-select' },
  ];

  // Prepare default values for the form, including categories
  const defaultValues = product ? {
    ...product,
    categoryIds: product.product_categories?.map(pc => pc.category_id) || [],
    image_file: undefined // Ensure image_file is not pre-filled
  } : undefined;


  if (loading || loadingCategories) { // Check both loading states
    return <div className="container mx-auto py-10 text-center">جاري التحميل...</div>;
  }

  if (error || categoryError) { // Check both error states
    return <div className="container mx-auto py-10 text-center text-red-500">خطأ: {error || categoryError}</div>;
  }

  if (!product || !defaultValues) { // Check product and defaultValues
    return <div className="container mx-auto py-10 text-center">المنتج غير موجود.</div>;
  }

  // Display current image if available
  const currentImageUrl = product?.image_url;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">تعديل المنتج</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {currentImageUrl && (
        <div className="mb-4">
          <p className="font-semibold mb-2">الصورة الحالية:</p>
          <img src={currentImageUrl} alt="الصورة الحالية للمنتج" className="max-h-48 rounded border" />
        </div>
      )}
      <CustomForm
        schema={productSchema}
        onSubmit={handleSubmit}
        fields={fields}
        defaultValues={defaultValues} // Pass default values
        categories={categories} // Pass all categories for selection
        submitButtonText="تحديث المنتج" // Customize button text
        showCancelButton={true} // Add cancel button
        onCancel={() => router.push('/admin/products')} // Cancel action
      />
      {loading && <div className="mt-4 text-center">جاري التحديث...</div>} {/* Translated */}
    </div>
  );
}
