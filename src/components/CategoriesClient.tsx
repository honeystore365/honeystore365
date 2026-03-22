"use client";

import { useState } from "react";
import { Tag, Plus, Edit2, Trash2, X, Save, Folder } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

interface CategoriesClientProps {
  initialCategories: Category[];
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sortOrder: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryData = {
      name: formData.name,
      description: formData.description || null,
      sort_order: formData.sortOrder,
    };

    try {
      const url = editingCategory 
        ? `/api/categories?id=${editingCategory.id}`
        : "/api/categories";
      
      const method = editingCategory ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "خطأ في الحفظ");
      }

      const savedCategory = await res.json();
      
      if (editingCategory) {
        setCategories(categories.map(c => c.id === editingCategory.id ? savedCategory : c));
      } else {
        setCategories([savedCategory, ...categories]);
      }
      
      resetForm();
      alert(editingCategory ? "تم التحديث بنجاح!" : "تم الإضافة بنجاح!");
    } catch (error: any) {
      alert(`خطأ: ${error.message}`);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      sortOrder: category.sort_order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;

    try {
      const res = await fetch(`/api/categories?id=${categoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "خطأ في الحذف");
      }

      setCategories(categories.filter(c => c.id !== categoryId));
      alert("تم الحذف بنجاح!");
    } catch (error: any) {
      alert(error.message || "خطأ في الحذف");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      sortOrder: 0,
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة الفئات</h1>
          <p className="text-gray-500 mt-1">أضف وتعديل وحذف فئات المنتجات</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة فئة
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="card p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                  <Folder className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{category.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-amber-600" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                الترتيب: {category.sort_order || 0}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(category.created_at).toLocaleDateString('ar-TN')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="card p-12 text-center">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد فئات</h3>
          <p className="text-gray-500 mb-4">ابدأ بإنشاء فئات لمنتجاتك</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
            <Plus className="w-5 h-5 ml-2" />
            إضافة فئة
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCategory ? "تعديل فئة" : "إضافة فئة جديدة"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفئة *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="مثال: عسل طبيعي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="وصف الفئة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ترتيب العرض</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary flex-1"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
