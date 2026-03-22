'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, X } from 'lucide-react';
import type { Category, ProductFormData } from '../types';

interface ProductFormProps {
  mode: 'add' | 'edit';
  formData: ProductFormData;
  onChange: (data: ProductFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  categories: Category[];
}

export function ProductForm({ mode, formData, onChange, onSubmit, onCancel, saving, categories }: ProductFormProps) {
  const isEditing = mode === 'edit';
  const title = isEditing ? 'تحرير المنتج' : 'إضافة منتج جديد';
  const bgClass = isEditing ? '' : 'bg-green-50 border-green-200';

  return (
    <Card className={bgClass}>
      <CardHeader>
        <CardTitle className={isEditing ? 'text-blue-800' : 'text-green-800'}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="name">اسم المنتج *</Label>
            <Input id="name" value={formData.name} onChange={e => onChange({ ...formData, name: e.target.value })} placeholder="مثال: عسل الزهور" />
          </div>
          <div>
            <Label htmlFor="price">السعر (د.ت) *</Label>
            <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => onChange({ ...formData, price: e.target.value })} placeholder="25.00" />
          </div>
          <div>
            <Label htmlFor="category">الفئة</Label>
            <Select value={formData.category_id} onValueChange={value => onChange({ ...formData, category_id: value })}>
              <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no-category">بدون فئة</SelectItem>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image">رابط الصورة</Label>
            <Input id="image" value={formData.image_url} onChange={e => onChange({ ...formData, image_url: e.target.value })} placeholder="https://example.com/image.jpg" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea id="description" value={formData.description} onChange={e => onChange({ ...formData, description: e.target.value })} placeholder="وصف المنتج" rows={3} />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="available" checked={formData.is_available} onChange={e => onChange({ ...formData, is_available: e.target.checked })} className="rounded" />
            <Label htmlFor="available">متاح للبيع</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSubmit} disabled={saving} className={isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />جاري الحفظ...</> : <><Save className="h-4 w-4 mr-2" />حفظ</>}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}><X className="h-4 w-4 mr-2" />إلغاء</Button>
        </div>
      </CardContent>
    </Card>
  );
}
