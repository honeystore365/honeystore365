'use client';

import { useSession } from '@/context/SessionProvider';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import type { Category, Product, ProductFormData } from './types';

export function useProducts() {
  const { session } = useSession();
  const { toast } = useToast();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesResult, productsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('products')
          .select('*, categories (id, name)')
          .order('name'),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (productsResult.error) throw productsResult.error;

      setCategories(categoriesResult.data || []);
      setProducts(productsResult.data || []);
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      toast({ title: 'خطأ في التحميل', description: 'فشل في تحميل البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    if (supabase) fetchData();
  }, [supabase, fetchData]);

  const addProduct = async (formData: ProductFormData): Promise<boolean> => {
    if (!formData.name.trim() || !formData.price) {
      toast({ title: 'خطأ في البيانات', description: 'يرجى إدخال اسم المنتج والسعر', variant: 'destructive' });
      return false;
    }
    try {
      setSavingProduct('new');
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          category_id: formData.category_id === 'no-category' ? null : formData.category_id || null,
          image_url: formData.image_url.trim() || null,
          is_available: formData.is_available,
        }])
        .select('*, categories (id, name)')
        .single();

      if (error) throw error;
      setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'تم الإضافة', description: 'تم إضافة المنتج بنجاح' });
      return true;
    } catch (error: any) {
      console.error('Erreur ajout produit:', error);
      toast({ title: 'خطأ في الإضافة', description: `فشل في إضافة المنتج: ${error?.message}`, variant: 'destructive' });
      return false;
    } finally {
      setSavingProduct(null);
    }
  };

  const updateProduct = async (productId: string, formData: ProductFormData): Promise<boolean> => {
    if (!formData.name.trim() || !formData.price) {
      toast({ title: 'خطأ في البيانات', description: 'يرجى إدخال اسم المنتج والسعر', variant: 'destructive' });
      return false;
    }
    try {
      setSavingProduct(productId);
      const { data, error } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          category_id: formData.category_id === 'no-category' ? null : formData.category_id || null,
          image_url: formData.image_url.trim() || null,
          is_available: formData.is_available,
        })
        .eq('id', productId)
        .select('*, categories (id, name)')
        .single();

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === productId ? data : p).sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'تم التحديث', description: 'تم تحديث المنتج بنجاح' });
      return true;
    } catch (error: any) {
      console.error('Erreur modification produit:', error);
      toast({ title: 'خطأ في التحديث', description: 'فشل في تحديث المنتج', variant: 'destructive' });
      return false;
    } finally {
      setSavingProduct(null);
    }
  };

  const deleteProduct = async (productId: string, productName: string): Promise<boolean> => {
    if (!confirm(`هل أنت متأكد من حذف منتج "${productName}"؟`)) return false;
    try {
      setSavingProduct(productId);
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({ title: 'تم الحذف', description: 'تم حذف المنتج بنجاح' });
      return true;
    } catch (error: any) {
      console.error('Erreur suppression produit:', error);
      toast({ title: 'خطأ في الحذف', description: 'فشل في حذف المنتج', variant: 'destructive' });
      return false;
    } finally {
      setSavingProduct(null);
    }
  };

  return {
    products,
    categories,
    loading,
    savingProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh: fetchData,
  };
}
