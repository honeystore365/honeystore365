"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";

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

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const customerId = localStorage.getItem("customerId");
    if (!customerId) {
      setLoading(false);
      return;
    }

    fetch(`/api/cart?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        setCartItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const updateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty < 1 || newQty > item.stock) return;
    setUpdating(item.id);

    try {
      await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, quantity: newQty }),
      });
      loadCart();
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      loadCart();
    } finally {
      setUpdating(null);
    }
  };

  const formatPrice = (price: number) => (price / 1000).toFixed(3);
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = subtotal > 50000 ? 0 : 7000;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white" dir="rtl">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-amber-600" />
          سلة التسوق
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">السلة فارغة</h2>
            <p className="text-gray-500 mb-6">لم تضف أي منتجات بعد</p>
            <button
              onClick={() => router.push("/")}
              className="bg-amber-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-amber-700"
            >
              تصفح المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-md p-4 flex gap-4">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                  ) : (
                    <div className="w-24 h-24 bg-amber-100 rounded-lg flex items-center justify-center text-4xl">🍯</div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-amber-600 font-bold mb-2">{formatPrice(item.price)} د.ت</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item, item.quantity - 1)}
                        disabled={updating === item.id || item.quantity <= 1}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                        disabled={updating === item.id || item.quantity >= item.stock}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updating === item.id}
                        className="mr-auto p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">{formatPrice(item.subtotal)} د.ت</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 h-fit sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">ملخص السلة</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع ({cartItems.length} منتج)</span>
                  <span className="font-bold">{formatPrice(subtotal)} د.ت</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">التوصيل</span>
                  <span className="font-bold">{deliveryFee === 0 ? "مجاني" : `${formatPrice(deliveryFee)} د.ت`}</span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-green-600">اطلب بـ {formatPrice(50000 - subtotal)} د.ت إضافية للحصول على توصيل مجاني!</p>
                )}
                <div className="flex justify-between text-lg border-t pt-3">
                  <span className="font-bold">المجموع</span>
                  <span className="font-bold text-amber-600">{formatPrice(total)} د.ت</span>
                </div>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2"
              >
                إتمام الطلب
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full mt-3 text-amber-600 py-2 font-medium hover:underline"
              >
                مواصلة التسوق
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
