"use client";

import { useState, useRef } from "react";
import { db, id } from "@/lib/db";
import { Package, Plus, Edit2, Trash2, X, Save, Upload } from "lucide-react";

export default function ProductsPage() {
  const { isLoading, data } = db.useQuery({ products: {} });
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", stock: "", weight: "", origin: "", isAvailable: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  const products = data?.products || [];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("حجم الصورة كبير جداً"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setImageUrl(reader.result); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    
    try {
      const priceInMillimes = Math.round(parseFloat(formData.price) * 1000);
      const newId = id();
      
      console.log("Creating with ID:", newId);
      
      await db.transact(
        db.tx.products[newId].create({
          name: formData.name,
          description: formData.description || null,
          price: priceInMillimes,
          stock: parseInt(formData.stock) || 0,
          weight: formData.weight || null,
          origin: formData.origin || null,
          isAvailable: formData.isAvailable,
          imageUrl: imageUrl || null,
          createdAt: Date.now(),
        })
      );
      
      alert("✅ تم إضافة المنتج!");
      setShowForm(false);
      setFormData({ name: "", description: "", price: "", stock: "", weight: "", origin: "", isAvailable: true });
      setImageUrl("");
    } catch (err) {
      console.error("Error:", err);
      alert("❌ خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price ? (product.price / 1000).toString() : "",
      stock: product.stock?.toString() || "0",
      weight: product.weight || "",
      origin: product.origin || "",
      isAvailable: product.isAvailable ?? true,
    });
    setImageUrl(product.imageUrl || "");
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (saving || !editingProduct) return;
    setSaving(true);
    
    try {
      const priceInMillimes = Math.round(parseFloat(formData.price) * 1000);
      await db.transact(
        db.tx.products[editingProduct.id].update({
          name: formData.name,
          description: formData.description || null,
          price: priceInMillimes,
          stock: parseInt(formData.stock) || 0,
          weight: formData.weight || null,
          origin: formData.origin || null,
          isAvailable: formData.isAvailable,
          imageUrl: imageUrl || null,
        })
      );
      
      alert("✅ تم تحديث المنتج!");
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: "", description: "", price: "", stock: "", weight: "", origin: "", isAvailable: true });
      setImageUrl("");
    } catch (err) {
      console.error("Error:", err);
      alert("❌ خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await db.transact(db.tx.products[productId].delete());
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openNewForm = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", price: "", stock: "", weight: "", origin: "", isAvailable: true });
    setImageUrl("");
    setShowForm(true);
  };

  return (
    <div className="p-8" dir="rtl" style={{ background: "linear-gradient(135deg, #FFF8E7 0%, #FFECB3 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ color: "#92400E" }} className="text-3xl font-bold">📦 إدارة المنتجات</h1>
          <p style={{ color: "#B45309" }} className="mt-1">متجر العسل التونسي 🐝</p>
        </div>
        <button onClick={openNewForm} style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          className="text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
          <Plus className="w-6 h-6" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow" style={{ border: "2px solid #FEF3C7" }}>
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" /> : 
              <div className="w-full h-48 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" }}><Package className="w-16 h-16 text-amber-600" /></div>}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{product.isAvailable ? "متاح" : "غير متاح"}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(product)} className="p-2 rounded-lg hover:bg-amber-50" style={{ color: "#D97706" }}><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-50" style={{ color: "#DC2626" }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description || "لا يوجد وصف"}</p>
              <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "#FEF3C7" }}>
                <span className="font-bold text-xl" style={{ color: "#D97706" }}>{(product.price / 1000).toFixed(3)} د.ت</span>
                <span className="text-sm text-gray-500">المخزون: {product.stock || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-4" style={{ borderColor: "#FEF3C7" }}>
          <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" }}><Package className="w-12 h-12 text-amber-600" /></div>
          <h2 style={{ color: "#92400E" }} className="text-2xl font-bold mb-2">لا توجد منتجات بعد</h2>
          <p style={{ color: "#B45309" }} className="mb-6">أضف منتجك الأول للبدء في البيع</p>
          <button onClick={openNewForm} style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="text-white px-8 py-3 rounded-xl font-bold">إضافة منتج جديد</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(146, 64, 14, 0.5)" }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 rounded-t-3xl" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
              <div className="flex justify-between items-center">
                <h2 className="text-white text-xl font-bold">{editingProduct ? "✏️ تعديل المنتج" : "➕ إضافة منتج جديد"}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30"><X className="w-5 h-5 text-white" /></button>
              </div>
            </div>
            <form onSubmit={editingProduct ? handleUpdate : handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block font-bold mb-2" style={{ color: "#92400E" }}>📷 صورة المنتج</label>
                <div className="border-3 border-dashed rounded-xl p-6 text-center cursor-pointer" style={{ borderColor: "#F59E0B", background: imageUrl ? "transparent" : "#FFFBEB" }} onClick={() => fileInputRef.current?.click()}>
                  {imageUrl ? <div className="relative"><img src={imageUrl} alt="Product" className="max-w-[200px] max-h-[200px] mx-auto rounded-lg" /><button type="button" onClick={(e) => { e.stopPropagation(); setImageUrl(""); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button></div> : uploading ? <div className="text-amber-600 font-bold">جاري التحميل...</div> : <div><Upload className="w-10 h-10 mx-auto mb-2" style={{ color: "#D97706" }} /><p style={{ color: "#B45309" }}>اضغط لرفع صورة</p></div>}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
              <div><label className="block font-bold mb-2" style={{ color: "#92400E" }}>⭐ اسم المنتج *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="مثال: عسل الزهر الطبيعي" className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: "#FEF3C7" }} /></div>
              <div><label className="block font-bold mb-2" style={{ color: "#92400E" }}>📝 الوصف</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="وصف المنتج..." className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: "#FEF3C7" }} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block font-bold mb-2" style={{ color: "#92400E" }}>💰 السعر (د.ت) *</label><input type="number" step="0.001" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.000" className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: "#FEF3C7" }} /></div>
                <div><label className="block font-bold mb-2" style={{ color: "#92400E" }}>📦 المخزون</label><input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: "#FEF3C7" }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block font-bold mb-2" style={{ color: "#92400E" }}>⚖️ الوزن</label><input type="text" placeholder="500g" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: "#FEF3C7" }} /></div>
                <div><label className="block font-bold mb-2" style={{ color: "#92400E" }}>🌍 الأصل</label><input type="text" placeholder="تونس" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: "#FEF3C7" }} /></div>
              </div>
              <div className="flex items-center gap-3"><input type="checkbox" id="isAvailable" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} className="w-5 h-5" /><label htmlFor="isAvailable" className="font-bold" style={{ color: "#92400E" }}>متاح للبيع</label></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 rounded-xl font-bold border-2 hover:bg-gray-50" style={{ borderColor: "#D97706", color: "#92400E" }}>إلغاء</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}><Save className="w-5 h-5" />{saving ? "جاري..." : "حفظ"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
