'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CustomForm } from '@/components/form';
import { useRouter } from 'next/navigation';
import * as z from "zod"

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
})

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values: z.infer<typeof productSchema>) => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('products')
      .insert([values]);

    if (error) {
      console.error('Error creating product:', error);
      setError(error.message);
    } else {
      router.push('/(admin)/admin/products');
    }

    setLoading(false);
  };

  const fields = [
    { name: 'name', label: 'Nom', description: 'Nom du produit' },
    { name: 'description', label: 'Description', description: 'Description du produit', type: 'textarea' },
    { name: 'price', label: 'Prix', description: 'Prix du produit', type: 'number' },
    { name: 'stock', label: 'Stock', description: 'Stock du produit', type: 'number' },
    { name: 'image_url', label: 'Image URL', description: 'URL de l\'image du produit' },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Ajouter un produit</h1>
      {error && <p className="text-red-500">{error}</p>}
      <CustomForm schema={productSchema} onSubmit={handleSubmit} fields={fields} />
      {loading && <div>Chargement...</div>}
    </div>
  );
}