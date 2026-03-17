"use client";

import { db } from "@/lib/db";
import { id, InstaQLEntity } from "@instantdb/react";
import { type AppSchema } from "@/instant.schema";
import { useState, useCallback } from "react";
import {
  ShoppingCart,
  Package,
  Users,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Eye,
  Phone,
  MapPin,
  Calendar,
  Check,
  X,
  Send,
  Printer,
  Search,
  Filter,
  ChevronDown,
  Download,
} from "lucide-react";
import { InvoiceButton, InvoicePreview } from "@/components/admin/InvoicePDF";

// Types
type Order = InstaQLEntity<AppSchema, "orders">;
type OrderItem = InstaQLEntity<AppSchema, "orderItems">;
type Product = InstaQLEntity<AppSchema, "products">;
type User = InstaQLEntity<AppSchema, "$users">;

interface OrderWithDetails extends Order {
  items: (OrderItem & { product?: Product })[];
  customer?: User;
}

// Status configuration
const orderStatuses = {
  pending_confirmation: {
    label: "في انتظار التأكيد",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    actions: ["confirm", "cancel"],
  },
  confirmed: {
    label: "مؤكد",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Check,
    actions: ["process", "cancel"],
  },
  processing: {
    label: "قيد التحضير",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Package,
    actions: ["ship", "cancel"],
  },
  shipped: {
    label: "تم الشحن",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Truck,
    actions: ["deliver", "cancel"],
  },
  delivered: {
    label: "تم التسليم",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    actions: [],
  },
  cancelled: {
    label: "ملغي",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    actions: [],
  },
};

const paymentMethods: Record<string, string> = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
  mobile_payment: "الدفع الإلكتروني",
};

// Generate invoice number
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `HS${year}${month}${day}-${random}`;
};

export default function OrdersPage() {
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Selected order for details
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Build query
  const query: any = { orders: {} };
  if (statusFilter !== "ALL") {
    query.orders.$ = { where: { status: statusFilter } };
  }
  if (searchQuery) {
    query.orders.$ = {
      where: {
        or: [
          { invoiceNumber: { $ilike: `%${searchQuery}%` } },
          { customerName: { $ilike: `%${searchQuery}%` } },
          { customerPhone: { $ilike: `%${searchQuery}%` } },
        ],
      },
    };
  }
  query.orders.items = { product: {} };
  query.orders.customer = {};

  const { data, isLoading, error } = db.useQuery(query);
  const orders: OrderWithDetails[] = data?.orders || [];

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending_confirmation").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    revenue: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  // Status update handler
  const updateStatus = useCallback(
    async (orderId: string, newStatus: string, notes?: string) => {
      const updateData: any = { status: newStatus };

      // Set timestamps based on status
      const now = Date.now();
      if (newStatus === "confirmed") updateData.confirmedAt = now;
      if (newStatus === "shipped") updateData.shippedAt = now;
      if (newStatus === "delivered") updateData.deliveredAt = now;

      // Generate invoice number on confirmation
      if (newStatus === "confirmed") {
        updateData.invoiceNumber = generateInvoiceNumber();
      }

      if (notes) {
        updateData.adminNotes = notes;
      }

      await db.transact([db.tx.orders[orderId].update(updateData)]);
    },
    []
  );

  const selectedOrderData = orders.find((o) => o.id === selectedOrder);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">حدث خطأ في تحميل الطلبات</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الطلبات</h1>
        <p className="text-gray-600">متابعة وإدارة طلبات العملاء - الدفع عند الاستلام</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <StatCard
          title="الكل"
          value={stats.total}
          icon={ShoppingCart}
          color="bg-gray-100"
          active={statusFilter === "ALL"}
          onClick={() => setStatusFilter("ALL")}
        />
        <StatCard
          title="بانتظار التأكيد"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-100"
          active={statusFilter === "pending_confirmation"}
          onClick={() => setStatusFilter("pending_confirmation")}
        />
        <StatCard
          title="مؤكد"
          value={stats.confirmed}
          icon={Check}
          color="bg-blue-100"
          active={statusFilter === "confirmed"}
          onClick={() => setStatusFilter("confirmed")}
        />
        <StatCard
          title="قيد التحضير"
          value={stats.processing}
          icon={Package}
          color="bg-purple-100"
          active={statusFilter === "processing"}
          onClick={() => setStatusFilter("processing")}
        />
        <StatCard
          title="تم الشحن"
          value={stats.shipped}
          icon={Truck}
          color="bg-indigo-100"
          active={statusFilter === "shipped"}
          onClick={() => setStatusFilter("shipped")}
        />
        <StatCard
          title="تم التسليم"
          value={stats.delivered}
          icon={CheckCircle}
          color="bg-green-100"
          active={statusFilter === "delivered"}
          onClick={() => setStatusFilter("delivered")}
        />
        <StatCard
          title="ملغي"
          value={stats.cancelled}
          icon={XCircle}
          color="bg-red-100"
          active={statusFilter === "cancelled"}
          onClick={() => setStatusFilter("cancelled")}
        />
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm">إجمالي الإيرادات (غير الملغية)</p>
            <p className="text-3xl font-bold">{(stats.revenue / 1000).toFixed(3)} د.ت</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث (رقم الفاتورة، اسم، هاتف)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="ALL">كل طرق الدفع</option>
            <option value="cash_on_delivery">الدفع عند الاستلام</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="mobile_payment">الدفع الإلكتروني</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="من تاريخ"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="إلى تاريخ"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">العميل</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المدينة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المبلغ</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الدفع</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = orderStatuses[order.status as keyof typeof orderStatuses];
                  const StatusIcon = status?.icon || Clock;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {order.invoiceNumber || order.id.slice(-8)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.city}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">
                          {(order.totalAmount / 1000).toFixed(3)} د.ت
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {paymentMethods[order.paymentMethod] || order.paymentMethod}
                        {order.paymentMethod === "cash_on_delivery" && (
                          <span className="block text-xs text-amber-600">
                            {order.paymentStatus === "paid" ? "✓ تم الدفع" : "⏳ بانتظار الدفع"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(order.orderedAt).toLocaleDateString("ar-TN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedOrder(order.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {order.invoiceNumber && (
                            <InvoiceButton orderId={order.id} variant="icon" />
                          )}

                          {/* Status Actions */}
                          {order.status === "pending_confirmation" && (
                            <>
                              <button
                                onClick={() => updateStatus(order.id, "confirmed")}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="تأكيد الطلب"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(order.id, "cancelled")}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="إلغاء الطلب"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {order.status === "confirmed" && (
                            <button
                              onClick={() => updateStatus(order.id, "processing")}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="بدء التحضير"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                          )}

                          {order.status === "processing" && (
                            <button
                              onClick={() => updateStatus(order.id, "shipped")}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="تم الشحن"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}

                          {order.status === "shipped" && (
                            <button
                              onClick={() => updateStatus(order.id, "delivered")}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="تم التسليم"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && selectedOrderData && (
        <OrderDetailsModal
          order={selectedOrderData}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={updateStatus}
        />
      )}

      {/* Invoice Preview Modal */}
      {showInvoicePreview && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <InvoicePreview orderId={selectedOrder} onClose={() => setShowInvoicePreview(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl text-right transition-all ${color} ${
        active ? "ring-2 ring-amber-500 scale-105" : "hover:scale-105"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold">{value}</span>
        <Icon className="w-5 h-5 opacity-60" />
      </div>
      <span className="text-sm font-medium opacity-80">{title}</span>
    </button>
  );
}

// Order Details Modal
function OrderDetailsModal({
  order,
  onClose,
  onStatusUpdate,
}: {
  order: OrderWithDetails;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: string, notes?: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(order.adminNotes || "");
  const status = orderStatuses[order.status as keyof typeof orderStatuses];

  const handleStatusUpdate = async (newStatus: string) => {
    await onStatusUpdate(order.id, newStatus, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              طلب #{order.invoiceNumber || order.id.slice(-8)}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(order.orderedAt).toLocaleString("ar-TN")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <InvoiceButton orderId={order.id} />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex gap-2">
              {order.status === "pending_confirmation" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate("confirmed")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    تأكيد الطلب
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("cancelled")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    إلغاء
                  </button>
                </>
              )}
              {order.status === "confirmed" && (
                <button
                  onClick={() => handleStatusUpdate("processing")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  بدء التحضير
                </button>
              )}
              {order.status === "processing" && (
                <button
                  onClick={() => handleStatusUpdate("shipped")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  تم الشحن
                </button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={() => handleStatusUpdate("delivered")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  تم التسليم
                </button>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                معلومات العميل
              </h3>
              <p className="font-medium">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Phone className="w-4 h-4" />
                  {order.customerPhone}
                </p>
              )}
              {order.customerEmail && (
                <p className="text-sm text-gray-600">{order.customerEmail}</p>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                عنوان التوصيل
              </h3>
              <p>{order.addressLine1}</p>
              <p className="text-gray-600">
                {order.city}
                {order.postalCode && ` - ${order.postalCode}`}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">منتجات الطلب</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right">المنتج</th>
                    <th className="px-4 py-2 text-center">الكمية</th>
                    <th className="px-4 py-2 text-left">السعر</th>
                    <th className="px-4 py-2 text-left">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">{item.product?.name || "—"}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-left">
                        {(item.unitPrice / 1000).toFixed(3)} د.ت
                      </td>
                      <td className="px-4 py-2 text-left">
                        {(item.totalPrice / 1000).toFixed(3)} د.ت
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span>{((order.totalAmount - order.deliveryFee) / 1000).toFixed(3)} د.ت</span>
            </div>
            <div className="flex justify-between">
              <span>رسوم التوصيل:</span>
              <span>{(order.deliveryFee / 1000).toFixed(3)} د.ت</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-amber-600 pt-2 border-t">
              <span>الإجمالي:</span>
              <span>{(order.totalAmount / 1000).toFixed(3)} د.ت</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">طريقة الدفع</h3>
            <p>{paymentMethods[order.paymentMethod] || order.paymentMethod}</p>
            {order.paymentMethod === "cash_on_delivery" && (
              <p className="text-sm text-gray-500 mt-1">
                {order.paymentStatus === "paid"
                  ? "✅ تم استلام المبلغ من العميل"
                  : "⏳ سيتم الدفع عند الاستلام"}
              </p>
            )}
          </div>

          {/* Admin Notes */}
          <div>
            <h3 className="font-semibold mb-2">ملاحظات الإدارة</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات حول هذا الطلب..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              rows={3}
            />
            <button
              onClick={() => handleStatusUpdate(order.status)}
              className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              حفظ الملاحظات
            </button>
          </div>

          {/* Timeline */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">سجل الطلب</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">تم الطلب:</span>
                <span>{new Date(order.orderedAt).toLocaleString("ar-TN")}</span>
              </div>
              {order.confirmedAt && (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">تم التأكيد:</span>
                  <span>{new Date(order.confirmedAt).toLocaleString("ar-TN")}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-500" />
                  <span className="text-gray-600">تم الشحن:</span>
                  <span>{new Date(order.shippedAt).toLocaleString("ar-TN")}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">تم التسليم:</span>
                  <span>{new Date(order.deliveredAt).toLocaleString("ar-TN")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
