"use client";

import { useState } from "react";
import { Save, Store, Phone, Mail, MapPin, Truck, DollarSign } from "lucide-react";

interface Settings {
  id: string;
  store_name: string;
  store_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  tax_rate: number;
  currency: string;
  delivery_fee: number;
}

interface SettingsClientProps {
  initialSettings: Settings | null;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [formData, setFormData] = useState({
    store_name: initialSettings?.store_name || "متجر العسل",
    store_description: initialSettings?.store_description || "",
    contact_email: initialSettings?.contact_email || "",
    contact_phone: initialSettings?.contact_phone || "",
    address: initialSettings?.address || "",
    tax_rate: initialSettings?.tax_rate?.toString() || "0",
    currency: initialSettings?.currency || "TND",
    delivery_fee: initialSettings?.delivery_fee?.toString() || "0",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("خطأ في الحفظ");

      setMessage({ type: "success", text: "تم حفظ الإعدادات بنجاح!" });
    } catch (error) {
      setMessage({ type: "error", text: "خطأ في حفظ الإعدادات" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">إعدادات المتجر</h1>
        <p className="text-gray-500 mt-1">تحكم في إعدادات متجرك</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Info */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">معلومات المتجر</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
            <input
              type="text"
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="input-field"
              placeholder="متجر العسل التونسي"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف المتجر</label>
            <textarea
              value={formData.store_description}
              onChange={(e) => setFormData({ ...formData, store_description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="أفضل العسل الطبيعي التونسي..."
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">معلومات الاتصال</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline ml-1" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="input-field"
                placeholder="contact@store.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline ml-1" />
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="input-field"
                placeholder="+216 55 123 456"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline ml-1" />
              العنوان
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="العنوان الكامل للمتجر..."
            />
          </div>
        </div>

        {/* Business Settings */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">إعدادات الأعمال</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="input-field"
              >
                <option value="TND">د.ت (تونسي)</option>
                <option value="EUR">€ (يورو)</option>
                <option value="USD">$ (دولار)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline" />
                نسبة الضريبة (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="input-field"
                placeholder="19"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Truck className="w-4 h-4 inline" />
                تكلفة التوصيل (د.ت)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.delivery_fee}
                onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                className="input-field"
                placeholder="7"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
        >
          {saving ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <Save className="w-5 h-5" />
              حفظ الإعدادات
            </>
          )}
        </button>
      </form>
    </div>
  );
}
