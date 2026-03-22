"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingCart, Phone, MapPin, CheckCircle } from "lucide-react";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
  subtotal: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const customerId = localStorage.getItem("customerId");
    if (!customerId) {
      router.push("/login?redirect=/checkout");
      return;
    }

    fetch(`/api/cart?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        setCartItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const formatPrice = (price: number) => (price / 1000).toFixed(3);
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = subtotal > 50000 ? 0 : 7000; // Free delivery over 50 DT
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!customerInfo.phone.trim()) {
      setError("رقم الهاتف مطلوب للتوصيل!");
      return;
    }
    if (!customerInfo.address.trim()) {
      setError("العنوان مطلوب للتوصيل!");
      return;
    }

    setSubmitting(true);
    try {
      const customerId = localStorage.getItem("customerId");
      const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName: customerName || "عميل",
          phone: customerInfo.phone,
          address: `${customerInfo.address}${customerInfo.city ? `, ${customerInfo.city}` : ""}`,
          notes: customerInfo.notes,
          items: cartItems.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price,
          })),
          total,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrderId(data.orderId);
        setOrderSuccess(true);
        // Clear cart
        await fetch("/api/cart/clear", { method: "POST" });
      } else {
        setError(data.error || "حدث خطأ");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">تم تأكيد طلبك بنجاح!</h1>
          <p className="text-gray-600 mb-4">رقم الطلب: <strong>{orderId}</strong></p>
          <p className="text-gray-600 mb-6">سيتم التواصل معك قريباً لتأكيد التوصيل</p>
          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <p className="text-amber-800 font-medium">الدفع عند الاستلام</p>
            <p className="text-amber-600 text-sm">ادفع نقداً عند وصول الطلب</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-700"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white" dir="rtl">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-amber-600" />
          إتمام الطلب
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">السلة فارغة</p>
            <button onClick={() => router.push("/")} className="bg-amber-600 text-white px-6 py-2 rounded-lg">
              تسوق الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">معلومات التوصيل</h2>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول</label>
                    <input
                      type="text"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأخير</label>
                    <input
                      type="text"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline ml-1" />
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="+216 XX XXX XXX"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline ml-1" />
                    العنوان *
                  </label>
                  <textarea
                    required
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    placeholder="الحي، الشارع، رقم المنزل..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                  <input
                    type="text"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                    placeholder="مثال: تونس، صفاقس..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    placeholder="أي ملاحظات خاصة..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="bg-amber-50 rounded-lg p-4 mt-6">
                  <h3 className="font-bold text-amber-800 mb-2">💵 الدفع عند الاستلام</h3>
                  <p className="text-amber-700 text-sm">ادفع نقداً عند وصول طلبك</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? "..." : "تأكيد الطلب"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">🍯</div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                      <p className="text-amber-600 font-bold">{formatPrice(item.subtotal)} د.ت</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span className="font-bold">{formatPrice(subtotal)} د.ت</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">توصيل</span>
                  <span className="font-bold">{deliveryFee === 0 ? "مجاني" : `${formatPrice(deliveryFee)} د.ت`}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">المجموع</span>
                  <span className="font-bold text-amber-600">{formatPrice(total)} د.ت</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
