'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Eye, EyeOff, Loader2, Save, Trash2, X } from 'lucide-react';
import type { Category, Product, ProductFormData } from '../types';

interface ProductCardProps {
  product: Product;
  isEditing: boolean;
  editForm: ProductFormData;
  onEditChange: (data: ProductFormData) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  categories: Category[];
}

export function ProductCard({
  product,
  isEditing,
  editForm,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  saving,
  categories,
}: ProductCardProps) {
  if (isEditing) {
    return (
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-4 text-blue-800">تحرير المنتج</h3>
          <div className="space-y-4">
            <div>
              <Label>اسم المنتج *</Label>
              <Input value={editForm.name} onChange={e => onEditChange({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>السعر (د.ت) *</Label>
              <Input type="number" step="0.01" value={editForm.price} onChange={e => onEditChange({ ...editForm, price: e.target.value })} />
            </div>
            <div>
              <Label>الفئة</Label>
              <Select value={editForm.category_id} onValueChange={value => onEditChange({ ...editForm, category_id: value })}>
                <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-category">بدون فئة</SelectItem>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={editForm.description} onChange={e => onEditChange({ ...editForm, description: e.target.value })} rows={2} />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={editForm.is_available} onChange={e => onEditChange({ ...editForm, is_available: e.target.checked })} className="rounded" />
              <Label>متاح للبيع</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={onSave} disabled={saving} size="sm" className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={saving}><X className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={!product.is_available ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <p className="text-sm text-blue-600 mt-1">{product.categories?.name || <span className="text-gray-500">بدون فئة</span>}</p>
          </div>
          {product.is_available ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-red-600" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-green-600">{product.price.toFixed(2)} د.ت</p>
          {product.description && <p className="text-gray-600 text-sm">{product.description}</p>}
          <p className="text-xs text-gray-500">تم الإنشاء: {new Date(product.created_at).toLocaleDateString('ar-TN')}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onStartEdit} disabled={saving}>
            <Edit className="h-4 w-4 mr-1" />تحرير
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} disabled={saving} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
