"use client";

import { useState, useRef, useEffect } from "react";
import { Package, Plus, Edit2, Trash2, X, Save, Upload } from "lucide-react";

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
  category_id?: string;
  category_name?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    weight: "",
    origin: "",
    category_id: "",
    is_available: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories")
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً. الحد الأقصى 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    const priceInMillimes = Math.round(parseFloat(formData.price) * 1000);
    
    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: priceInMillimes,
      stock: parseInt(formData.stock) || 0,
      weight: formData.weight || null,
      origin: formData.origin || null,
      image_url: imageUrl || null,
      is_available: formData.is_available,
      category_id: formData.category_id || null
    };

    try {
      const url = editingProduct ? "/api/products" : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const bodyData = editingProduct ? { id: editingProduct.id, ...productData } : productData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطأ في الحفظ");
        setSubmitting(false);
        return;
      }

      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...data.product, category_id: formData.category_id, category_name: categories.find(c => c.id === formData.category_id)?.name } : p));
      } else {
        setProducts([{ ...data.product, category_id: formData.category_id, category_name: categories.find(c => c.id === formData.category_id)?.name }, ...products]);
      }
      
      resetForm();
    } catch (err: any) {
      setError(err.message || "خطأ في الحفظ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setImageUrl(product.image_url || "");
    setFormData({
      name: product.name,
      description: product.description || "",
      price: (product.price / 1000).toString(),
      stock: product.stock?.toString() || "0",
      weight: product.weight || "",
      origin: product.origin || "",
      category_id: product.category_id || "",
      is_available: product.is_available ?? true
    });
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setImageUrl("");
    setFormData({ name: "", description: "", price: "", stock: "", weight: "", origin: "", category_id: "", is_available: true });
    setError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المنتجات</h1>
          <p className="text-gray-500 mt-1">{products.length} منتج في المتجر</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="btn-primary flex items-center gap-2 px-6 py-3 text-lg font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                    <Package className="w-16 h-16 text-amber-300" />
                  </div>
                )}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${product.is_available ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                  {product.is_available ? "متاح" : "غير متاح"}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-lg text-gray-800 truncate flex-1">{product.name}</h3>
                  {product.category_name && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full mr-2 whitespace-nowrap">
                      {product.category_name}
                    </span>
                  )}
                </div>
                {product.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-amber-600">{((product.price || 0) / 1000).toFixed(3)} د.ت</span>
                  <span className="text-sm text-gray-500">المخزون: {product.stock || 0}</span>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => handleEdit(product)} className="flex-1 btn-secondary flex items-center justify-center gap-1 py-2 text-sm">
                    <Edit2 className="w-4 h-4" />تعديل
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Package className="w-20 h-20 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد منتجات</h3>
          <p className="text-gray-500 mb-6">ابدأ بإضافة أول منتج إلى متجرك</p>
          <button onClick={() => { setShowForm(true); setError(""); }} className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            <Plus className="w-5 h-5" />إضافة منتج جديد
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">❌ {error}</div>}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صورة المنتج</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all">
                  {imageUrl ? (
                    <div className="relative inline-block">
                      <img src={imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImageUrl(""); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <><Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">انقر لتحميل صورة</p><p className="text-xs text-gray-400 mt-1">PNG, JPG حتى 5MB</p></>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500" placeholder="مثال: عسل الزهور" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفئة *</label>
                <select required value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500">
                  <option value="">اختر الفئة</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500" placeholder="وصف المنتج..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر (د.ت) *</label>
                  <input type="number" step="0.001" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500" placeholder="0.000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المخزون</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوزن</label>
                  <input type="text" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500" placeholder="500g" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الأصل</label>
                  <input type="text" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500" placeholder="تونس" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input type="checkbox" id="is_available" checked={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })} className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500" />
                <label htmlFor="is_available" className="text-sm font-medium text-gray-700">متاح للبيع مباشرة</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">إلغاء</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-lg font-medium">
                  {submitting ? <span className="animate-spin">⏳</span> : <><Save className="w-5 h-5" />{editingProduct ? "تحديث" : "حفظ"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
