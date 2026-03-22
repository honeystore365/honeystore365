// Orders Page with Turso
import { getOrders, updateOrderStatus } from "../actions";
import { Package, Check, Truck, X, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await getOrders();

  async function changeStatus(id: string, status: string) {
    "use server";
    await updateOrderStatus(id, status);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-700", label: "قيد الانتظار" };
      case "confirmed":
        return { bg: "bg-purple-100", text: "text-purple-700", label: "مؤكد" };
      case "shipped":
        return { bg: "bg-blue-100", text: "text-blue-700", label: "تم الشحن" };
      case "delivered":
        return { bg: "bg-green-100", text: "text-green-700", label: "تم التسليم" };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-700", label: "ملغي" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", label: status };
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">رقم الطلب</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">العميل</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">الهاتف</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">المدينة</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">المبلغ</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">الحالة</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">التاريخ</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order: any) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm">#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4">{order.customer_name}</td>
                      <td className="px-6 py-4">{order.customer_phone}</td>
                      <td className="px-6 py-4">{order.city}</td>
                      <td className="px-6 py-4 font-bold text-amber-600">{(order.total_amount / 1000).toFixed(3)} د.ت</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.ordered_at).toLocaleDateString("ar-TN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {order.status === "pending" && (
                            <form action={changeStatus.bind(null, order.id, "confirmed")}>
                              <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                                <Check className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                          {order.status === "confirmed" && (
                            <form action={changeStatus.bind(null, order.id, "shipped")}>
                              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                <Truck className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                          {order.status === "shipped" && (
                            <form action={changeStatus.bind(null, order.id, "delivered")}>
                              <button className="p-2 text-purple-600 hover:bg-purple-50 rounded">
                                <Package className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                          {order.status !== "cancelled" && order.status !== "delivered" && (
                            <form action={changeStatus.bind(null, order.id, "cancelled")}>
                              <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد طلبات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
