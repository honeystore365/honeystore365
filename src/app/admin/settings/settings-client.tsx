'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface StoreSettings {
  id: string;
  store_name: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  tax_rate?: number;
  delivery_fee?: number; // New field for delivery fee
  currency: string;
  updated_at: string;
}

export default function SettingsClient() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [editingDeliveryFee, setEditingDeliveryFee] = useState(false); // New state for delivery fee editing
  const [deliveryFeeInput, setDeliveryFeeInput] = useState(storeSettings?.delivery_fee || 0);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Categories (tolerant)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.warn('Categories fetch error:', categoriesError);
        setCategories([]);
      } else {
        setCategories(categoriesData || []);
      }

      // Delivery fee via API (avoids RLS issues)
      let deliveryFee = 0;
      try {
        const resp = await fetch('/api/store-settings/delivery-fee', { cache: 'no-store' });
        const json = await resp.json().catch(() => ({}));
        if (typeof json?.delivery_fee === 'number') {
          deliveryFee = json.delivery_fee;
        }
      } catch (e) {
        console.warn('Delivery fee fetch error:', e);
      }
      setStoreSettings(prev => ({ ...(prev || {} as any), delivery_fee: deliveryFee } as any));
    } catch (error) {
      console.warn('Erreur lors du chargement:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('اسم الفئة مطلوب');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategory({ name: '', description: '' });
      setShowAddCategory(false);
      toast.success('تم إضافة الفئة بنجاح');
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast.error('فشل في إضافة الفئة');
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setCategories(categories.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      ));
      setEditingCategory(null);
      toast.success('تم تحديث الفئة بنجاح');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('فشل في تحديث الفئة');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(categories.filter(cat => cat.id !== id));
      toast.success('تم حذف الفئة بنجاح');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('فشل في حذف الفئة');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gestion des catégories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>فئات المنتجات</CardTitle>
            <CardDescription>
              إدارة الفئات لتنظيم منتجاتك
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة فئة
          </Button>
        </CardHeader>
        <CardContent>
          {showAddCategory && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">فئة جديدة</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-category-name">الاسم *</Label>
                  <Input
                    id="new-category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="اسم الفئة"
                  />
                </div>
                <div>
                  <Label htmlFor="new-category-description">الوصف</Label>
                  <Textarea
                    id="new-category-description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="وصف الفئة"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCategory}>
                    <Save className="h-4 w-4 mr-2" />
                    إضافة
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddCategory(false);
                    setNewCategory({ name: '', description: '' });
                  }}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                لا توجد فئات. أضف فئتك الأولى.
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{category.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(category.created_at).toLocaleDateString('ar-TN')}
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingCategory(category.id)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paramètres du magasin */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات المتجر</CardTitle>
          <CardDescription>
            قم بتكوين المعلومات الأساسية لمتجرك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="delivery-fee">Delivery Fee (TND)</Label>
                <p className="text-sm text-muted-foreground">
                  سيتم إضافة رسوم التوصيل على كل طلب
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">{storeSettings?.delivery_fee || 0} د.ت</span>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditingDeliveryFee(true);
                  setDeliveryFeeInput(storeSettings?.delivery_fee || 0);
                }}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {editingDeliveryFee && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Label htmlFor="new-delivery-fee" className="text-right min-w-[100px]">
                    تعديل الرسوم
                  </Label>
                  <div className="flex-1 relative">
                    <Input
                      id="new-delivery-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryFeeInput}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setDeliveryFeeInput(Number.isNaN(v) ? 0 : v);
                      }}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-2 text-muted-foreground">د.ت</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        const resp = await fetch('/api/store-settings/delivery-fee', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ delivery_fee: deliveryFeeInput })
                        });
                        const result = await resp.json();
                        if (!resp.ok) {
                          const msg = result?.error || result?.detail || 'Request failed';
                          toast.error(msg);
                          return;
                        }
                        setStoreSettings(prev => ({
                          ...(prev || {} as any),
                          id: result.id ?? (prev as any)?.id ?? null,
                          delivery_fee: typeof result.delivery_fee === 'number' ? result.delivery_fee : (prev as any)?.delivery_fee ?? 0,
                        } as any));
                        setEditingDeliveryFee(false);
                        if (result.warning) {
                          toast.warning('تم حفظ الإعدادات بدون حقل الرسوم. يرجى تطبيق ترحيل قاعدة البيانات لإضافة delivery_fee.');
                        } else {
                          toast.success('تم تحديث رسوم التوصيل');
                        }
                      } catch (error) {
                        console.error('Erreur lors de la mise à jour:', error);
                        toast.error('فشل في تحديث الرسوم');
                      }
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    حفظ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingDeliveryFee(false);
                      setDeliveryFeeInput(storeSettings?.delivery_fee || 0);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}