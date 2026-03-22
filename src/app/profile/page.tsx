"use client";

import { useEffect, useState } from "react";
import { User, Package, MapPin, Phone, Mail, LogOut, Edit2, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  order_date: string;
}

interface Address {
  id: string;
  address_line_1: string;
  city: string;
  phone_number: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);
      setEditForm({
        first_name: userData.user.first_name || "",
        last_name: userData.user.last_name || "",
        phone: userData.user.phone || "",
      });

      // Fetch orders
      const ordersRes = await fetch("/api/orders");
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      // Fetch address
      const addrRes = await fetch(`/api/addresses?customer_id=${userData.user.id}`);
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        if (addrData.addresses && addrData.addresses.length > 0) {
          setAddress(addrData.addresses[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch("/api/customers/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user.id,
          ...editForm,
        }),
      });

      if (res.ok) {
        setUser({ ...user, ...editForm });
        setEditing(false);
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "في الانتظار":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "مؤكد":
        return "bg-green-100 text-green-800";
      case "delivered":
      case "تم التوصيل":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "في الانتظار";
      case "confirmed":
        return "مؤكد";
      case "delivered":
        return "تم التوصيل";
      case "cancelled":
        return "ملغي";
      default:
        return status || "غير معروف";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-amber-600 to-orange-500 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">ملفي الشخصي</h1>
          <p className="text-amber-100">مرحباً {user.first_name} {user.last_name}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-l from-amber-100 to-orange-100 p-6 flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              {user.phone && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
            >
              {editing ? <X className="w-5 h-5 text-red-500" /> : <Edit2 className="w-5 h-5 text-amber-600" />}
            </button>
          </div>

          {editing && (
            <div className="p-6 border-t border-gray-100 bg-amber-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللقب</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Address Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            عنوان التوصيل
          </h3>
          {address ? (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-gray-800">{address.address_line_1}</p>
              <p className="text-gray-600">{address.city}</p>
              {address.phone_number && (
                <p className="text-gray-600 flex items-center gap-2 mt-2">
                  <Phone className="w-4 h-4" />
                  {address.phone_number}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">لم يتم إضافة عنوان بعد</p>
          )}
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            طلباتي
          </h3>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">لم تقم بأي طلب بعد</p>
              <Link
                href="/products"
                className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                تصفح المنتجات
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">
                      {new Date(order.order_date).toLocaleDateString("ar-TN")}
                    </span>
                    <span className="font-bold text-amber-600">
                      {order.total_amount.toFixed(3)} د.ت
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </main>
    </div>
  );
}
