'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/context/SessionProvider';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Edit, Eye, EyeOff, Loader2, Package, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  categories?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsClientPage() {
  const { session } = useSession();
  const { toast } = useToast();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  // Formulaire nouveau produit
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: 'no-category',
    image_url: '',
    is_available: true,
  });

  // Formulaire édition produit
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: 'no-category',
    image_url: '',
    is_available: true,
  });

  // Charger les données
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Charger les catégories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Charger les produits
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(
            `
            *,
            categories (
              id,
              name
            )
          `
          )
          .order('name');

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error: any) {
        console.error('Erreur chargement données:', error);
        toast({
          title: 'خطأ في التحميل',
          description: 'فشل في تحميل البيانات',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (supabase) {
      fetchData();
    }
  }, [supabase, toast]);

  // Ajouter un produit
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال اسم المنتج والسعر',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingProduct('new');
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name: newProduct.name.trim(),
            description: newProduct.description.trim() || null,
            price: parseFloat(newProduct.price),
            category_id: newProduct.category_id === 'no-category' ? null : newProduct.category_id || null,
            image_url: newProduct.image_url.trim() || null,
            is_available: newProduct.is_available,
          },
        ])
        .select(
          `
          *,
          categories (
            id,
            name
          )
        `
        )
        .single();

      if (error) throw error;

      setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category_id: 'no-category',
        image_url: '',
        is_available: true,
      });
      setIsAddingProduct(false);

      toast({
        title: 'تم الإضافة',
        description: 'تم إضافة المنتج بنجاح',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Erreur ajout produit:', error);
      const errorMessage = error?.message || error?.details || 'خطأ غير معروف';
      toast({
        title: 'خطأ في الإضافة',
        description: `فشل في إضافة المنتج: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setSavingProduct(null);
    }
  };

  // Modifier un produit
  const handleEditProduct = async (productId: string) => {
    if (!editForm.name.trim() || !editForm.price) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال اسم المنتج والسعر',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingProduct(productId);
      const { data, error } = await supabase
        .from('products')
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          price: parseFloat(editForm.price),
          category_id: editForm.category_id === 'no-category' ? null : editForm.category_id || null,
          image_url: editForm.image_url.trim() || null,
          is_available: editForm.is_available,
        })
        .eq('id', productId)
        .select(
          `
          *,
          categories (
            id,
            name
          )
        `
        )
        .single();

      if (error) throw error;

      setProducts(prev =>
        prev.map(product => (product.id === productId ? data : product)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingProduct(null);

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المنتج بنجاح',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Erreur modification produit:', error);
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تحديث المنتج',
        variant: 'destructive',
      });
    } finally {
      setSavingProduct(null);
    }
  };

  // Supprimer un produit
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`هل أنت متأكد من حذف منتج "${productName}"؟`)) {
      return;
    }

    try {
      setSavingProduct(productId);
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== productId));

      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنتج بنجاح',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Erreur suppression produit:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'فشل في حذف المنتج',
        variant: 'destructive',
      });
    } finally {
      setSavingProduct(null);
    }
  };

  // Commencer l'édition
  const startEdit = (product: Product) => {
    setEditingProduct(product.id);
    setEditForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id || 'no-category',
      image_url: product.image_url || '',
      is_available: product.is_available,
    });
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingProduct(null);
    setEditForm({
      name: '',
      description: '',
      price: '',
      category_id: 'no-category',
      image_url: '',
      is_available: true,
    });
  };

  if (loading) {
    return (
      <div className='container mx-auto py-10 px-4'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-blue-600' />
            <p className='text-gray-600'>جاري تحميل المنتجات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10 px-4 max-w-6xl'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-blue-600 mb-2 flex items-center gap-3'>
          <Package className='h-8 w-8' />
          إدارة المنتجات
        </h1>
        <p className='text-gray-600'>إدارة منتجات المتجر والفئات</p>
      </div>

      {/* زر إضافة منتج جديد */}
      <div className='mb-6'>
        {!isAddingProduct ? (
          <Button onClick={() => setIsAddingProduct(true)} className='bg-green-600 hover:bg-green-700'>
            <Plus className='h-4 w-4 mr-2' />
            إضافة منتج جديد
          </Button>
        ) : (
          <Card className='bg-green-50 border-green-200'>
            <CardHeader>
              <CardTitle className='text-green-800'>إضافة منتج جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <Label htmlFor='new-name'>اسم المنتج *</Label>
                  <Input
                    id='new-name'
                    value={newProduct.name}
                    onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder='مثال: عسل الزهور'
                  />
                </div>
                <div>
                  <Label htmlFor='new-price'>السعر (د.ت) *</Label>
                  <Input
                    id='new-price'
                    type='number'
                    step='0.01'
                    value={newProduct.price}
                    onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    placeholder='25.00'
                  />
                </div>
                <div>
                  <Label htmlFor='new-category'>الفئة</Label>
                  <Select
                    value={newProduct.category_id}
                    onValueChange={value => setNewProduct(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='اختر الفئة' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='no-category'>بدون فئة</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='new-image'>رابط الصورة</Label>
                  <Input
                    id='new-image'
                    value={newProduct.image_url}
                    onChange={e => setNewProduct(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder='https://example.com/image.jpg'
                  />
                </div>
                <div className='md:col-span-2'>
                  <Label htmlFor='new-description'>الوصف</Label>
                  <Textarea
                    id='new-description'
                    value={newProduct.description}
                    onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder='وصف المنتج'
                    rows={3}
                  />
                </div>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='new-available'
                    checked={newProduct.is_available}
                    onChange={e => setNewProduct(prev => ({ ...prev, is_available: e.target.checked }))}
                    className='rounded'
                  />
                  <Label htmlFor='new-available'>متاح للبيع</Label>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={handleAddProduct}
                  disabled={savingProduct === 'new'}
                  className='bg-green-600 hover:bg-green-700'
                >
                  {savingProduct === 'new' ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      حفظ
                    </>
                  )}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setIsAddingProduct(false);
                    setNewProduct({
                      name: '',
                      description: '',
                      price: '',
                      category_id: 'no-category',
                      image_url: '',
                      is_available: true,
                    });
                  }}
                  disabled={savingProduct === 'new'}
                >
                  <X className='h-4 w-4 mr-2' />
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* قائمة المنتجات */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {products.length === 0 ? (
          <div className='col-span-full text-center py-12'>
            <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>لا توجد منتجات</h3>
            <p className='text-gray-600'>ابدأ بإضافة منتج جديد</p>
          </div>
        ) : (
          products.map(product => (
            <Card key={product.id} className={`${!product.is_available ? 'opacity-60' : ''}`}>
              {editingProduct === product.id ? (
                // وضع التحرير
                <div className='p-4'>
                  <h3 className='font-semibold mb-4 text-blue-800'>تحرير المنتج</h3>
                  <div className='space-y-4'>
                    <div>
                      <Label>اسم المنتج *</Label>
                      <Input
                        value={editForm.name}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>السعر (د.ت) *</Label>
                      <Input
                        type='number'
                        step='0.01'
                        value={editForm.price}
                        onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>الفئة</Label>
                      <Select
                        value={editForm.category_id}
                        onValueChange={value => setEditForm(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='اختر الفئة' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='no-category'>بدون فئة</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>الوصف</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        checked={editForm.is_available}
                        onChange={e => setEditForm(prev => ({ ...prev, is_available: e.target.checked }))}
                        className='rounded'
                      />
                      <Label>متاح للبيع</Label>
                    </div>
                  </div>
                  <div className='flex gap-2 mt-4'>
                    <Button
                      onClick={() => handleEditProduct(product.id)}
                      disabled={savingProduct === product.id}
                      size='sm'
                      className='bg-blue-600 hover:bg-blue-700'
                    >
                      {savingProduct === product.id ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Save className='h-4 w-4' />
                      )}
                    </Button>
                    <Button variant='outline' size='sm' onClick={cancelEdit} disabled={savingProduct === product.id}>
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ) : (
                // وضع العرض
                <>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <CardTitle className='text-lg'>{product.name}</CardTitle>
                        {product.categories?.name ? (
                          <p className='text-sm text-blue-600 mt-1'>{product.categories.name}</p>
                        ) : (
                          <p className='text-sm text-gray-500 mt-1'>بدون فئة</p>
                        )}
                      </div>
                      <div className='flex items-center gap-1'>
                        {product.is_available ? (
                          <Eye className='h-4 w-4 text-green-600' />
                        ) : (
                          <EyeOff className='h-4 w-4 text-red-600' />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <p className='text-2xl font-bold text-green-600'>{product.price.toFixed(2)} د.ت</p>
                      {product.description && <p className='text-gray-600 text-sm'>{product.description}</p>}
                      <p className='text-xs text-gray-500'>
                        تم الإنشاء: {new Date(product.created_at).toLocaleDateString('ar-TN')}
                      </p>
                    </div>
                    <div className='flex gap-2 mt-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => startEdit(product)}
                        disabled={savingProduct === product.id}
                      >
                        <Edit className='h-4 w-4 mr-1' />
                        تحرير
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        disabled={savingProduct === product.id}
                        className='text-red-600 hover:text-red-700 hover:bg-red-50'
                      >
                        {savingProduct === product.id ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <Trash2 className='h-4 w-4 mr-1' />
                        )}
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
