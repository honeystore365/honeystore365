"use client";

import { useState, useRef } from "react";
import { Package, Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Upload, Eye, EyeOff } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  weight: string | null;
  origin: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}

export interface ProductsClientProps {
  initialProducts: Product[];
  categories: any[];
}

export default function ProductsClient({ initialProducts, categories }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    weight: "",
    origin: "",
    category_id: "",
    isAvailable: true,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً. الحد الأقصى 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: Math.round(parseFloat(formData.price) * 1000),
      stock: parseInt(formData.stock) || 0,
      weight: formData.weight || null,
      origin: formData.origin || null,
      image_url: imagePreview || null,
      is_available: formData.isAvailable,
    };

    try {
      const url = editingProduct 
        ? `/api/products?id=${editingProduct.id}`
        : "/api/products";
      
      const method = editingProduct ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "خطأ في الحفظ");
      }

      const savedProduct = await res.json();
      
      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? savedProduct : p));
      } else {
        setProducts([savedProduct, ...products]);
      }
      
      resetForm();
      alert(editingProduct ? "تم التحديث بنجاح!" : "تم الإضافة بنجاح!");
    } catch (error: any) {
      alert(`خطأ: ${error.message}`);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: (product.price / 1000).toString(),
      stock: product.stock?.toString() || "0",
      weight: product.weight || "",
      origin: product.origin || "",
      category_id: "",
      isAvailable: product.is_available ?? true,
    });
    setImagePreview(product.image_url || "");
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    try {
      const res = await fetch(`/api/products?id=${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("خطأ في الحذف");

      setProducts(products.filter(p => p.id !== productId));
      alert("تم الحذف بنجاح!");
    } catch (error) {
      alert("خطأ في الحذف");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      weight: "",
      origin: "",
      category_id: "",
      isAvailable: true,
    });
    setImagePreview("");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المنتجات</h1>
          <p className="text-gray-500 mt-1">أضف وتعديل وحذف المنتجات</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="card group hover:shadow-lg transition-all duration-300">
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300" />
                </div>
              )}
              
              {/* Availability Badge */}
              <div className="absolute top-3 left-3">
                {product.is_available ? (
                  <span className="badge-success flex items-center gap-1">
                    <Eye className="w-3 h-3" /> متاح
                  </span>
                ) : (
                  <span className="badge-danger flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> غير متاح
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 bg-white rounded-lg shadow-md hover:bg-amber-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-amber-600" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-xl font-bold text-amber-600">
                    {((product.price || 0) / 1000).toFixed(3)}
                  </span>
                  <span className="text-sm text-gray-500 mr-1">د.ت</span>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">المخزون</p>
                  <p className="font-semibold text-gray-700">{product.stock || 0}</p>
                </div>
              </div>
              
              {(product.weight || product.origin) && (
                <div className="mt-3 flex gap-2">
                  {product.weight && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {product.weight}
                    </span>
                  )}
                  {product.origin && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      {product.origin}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد منتجات</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة منتجاتك الأولى</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
            <Plus className="w-5 h-5 ml-2" />
            إضافة منتج جديد
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صورة المنتج</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 mx-auto object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview("");
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">انقر لرفع صورة</p>
                      <p className="text-xs text-gray-400">PNG, JPG حتى 2MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="مثال: عسل الزهور الطبيعي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="وصف المنتج..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر (د.ت) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-field"
                    placeholder="25.000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المخزون</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input-field"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوزن</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="input-field"
                    placeholder="500g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الأصل</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="input-field"
                    placeholder="تونس"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="isAvailable" className="text-sm text-gray-700">متاح للبيع</label>
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
                  disabled={uploading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
