"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  pdf,
} from "@react-pdf/renderer";
import { FileText, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

// Types

[truncated]
color: "#666", marginTop: 5 },
  arabicText: { fontFamily: "Helvetica", fontSize: 10 },
});

// Invoice Document Component
interface InvoiceDocumentProps {
  order: OrderWithItems;
  storeSettings: StoreSettings | null;
}

function InvoiceDocument({ order, storeSettings }: InvoiceDocumentProps) {
  const formatDate = (epoch: number) =>
    new Date(epoch).toLocaleDateString("ar-TN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatPrice = (millimes: number) =>
    `${(millimes / 1000).toFixed(3)} د.ت`;

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash_on_delivery: "الدفع عند الاستلام",
      bank_transfer: "تحويل بنكي",
      mobile_payment: "الدفع الإلكتروني",
    };
    return methods[method] || method;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>فاتورة ضريبية</Text>
            <Text style={styles.subtitle}>Tax Invoice</Text>
            <Text style={styles.invoiceNumber}>
              رقم الفاتورة: {order.invoiceNumber || order.id.slice(-8)}
            </Text>
            <Text style={styles.date}>التاريخ: {formatDate(order.orderedAt)}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.storeName}>
              {storeSettings?.storeName || "HoneyStore365"}
            </Text>
            {storeSettings?.address && (
              <Text style={styles.storeInfo}>{storeSettings.address}</Text>
            )}
            {storeSettings?.contactPhone && (
              <Text style={styles.storeInfo}>هاتف: {storeSettings.contactPhone}</Text>
            )}
            {storeSettings?.contactEmail && (
              <Text style={styles.storeInfo}>{storeSettings.contactEmail}</Text>
            )}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات العميل / Customer Information</Text>
          <View style={styles.row}>
            <View style={styles.col6}>
              <Text style={styles.label}>الاسم:</Text>
              <Text style={styles.value}>{order.customerName}</Text>
            </View>
            <View style={styles.col6}>
              <Text style={styles.label}>الهاتف:</Text>
              <Text style={styles.value}>{order.customerPhone || "—"}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col6}>
              <Text style={styles.label}>البريد الإلكتروني:</Text>
              <Text style={styles.value}>{order.customerEmail || "—"}</Text>
            </View>
            <View style={styles.col6}>
              <Text style={styles.label}>طريقة الدفع:</Text>
              <Text style={styles.value}>{getPaymentMethodLabel(order.paymentMethod)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col12}>
              <Text style={styles.label}>عنوان التوصيل:</Text>
              <Text style={styles.value}>
                {order.addressLine1}, {order.city}
                {order.postalCode && ` - ${order.postalCode}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الطلب / Order Details</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.col1]}>#</Text>
              <Text style={[styles.tableCell, styles.col4]}>المنتج</Text>
              <Text style={[styles.tableCell, styles.col2]}>الكمية</Text>
              <Text style={[styles.tableCell, styles.col3]}>السعر الوحدة</Text>
              <Text style={[styles.tableCell, styles.col2]}>المجموع</Text>
            </View>

            {/* Table Rows */}
            {order.items.map((item, idx) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{idx + 1}</Text>
                <Text style={[styles.tableCell, styles.col4]}>
                  {item.product?.name || "منتج غير متوفر"}
                </Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.col3]}>
                  {formatPrice(item.unitPrice)}
                </Text>
                <Text style={[styles.tableCell, styles.col2]}>
                  {formatPrice(item.totalPrice)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>المجموع الفرعي:</Text>
            <Text style={styles.totalValue}>
              {formatPrice(order.totalAmount - order.deliveryFee)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>رسوم التوصيل:</Text>
            <Text style={styles.totalValue}>{formatPrice(order.deliveryFee)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>الإجمالي شامل الضريبة:</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>شكراً لتعاملكم معنا</Text>
          <Text style={styles.footerText}>Thank you for your business</Text>
          <Text style={styles.footerText}>
            {storeSettings?.storeName || "HoneyStore365"} © {new Date().getFullYear()}
          </Text>
        </View>

        {/* Status Badge */}
        <View
          style={{
            position: "absolute",
            top: 150,
            right: 50,
            padding: "10 20",
            borderRadius: 5,
            borderWidth: 2,
            borderColor:
              order.status === "delivered"
                ? "#22c55e"
                : order.status === "cancelled"
                ? "#ef4444"
                : "#f59e0b",
            backgroundColor:
              order.status === "delivered"
                ? "#dcfce7"
                : order.status === "cancelled"
                ? "#fee2e2"
                : "#fef3c7",
          }}
        >
          <Text
            style={{
              color:
                order.status === "delivered"
                  ? "#166534"
                  : order.status === "cancelled"
                  ? "#991b1b"
                  : "#92400e",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {order.status === "pending_confirmation" && "في انتظار التأكيد"}
            {order.status === "confirmed" && "مؤكد"}
            {order.status === "processing" && "قيد التحضير"}
            {order.status === "shipped" && "تم الشحن"}
            {order.status === "delivered" && "تم التسليم"}
            {order.status === "cancelled" && "ملغي"}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Button Component
interface InvoiceButtonProps {
  orderId: string;
  variant?: "button" | "icon";
}

export function InvoiceButton({ orderId, variant = "button" }: InvoiceButtonProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { orders, storeSettings } = await db.query({
        orders: {
          $: { where: { id: orderId } },
          items: {
            product: {},
          },
          customer: {},
        },
        storeSettings: {},
      });

      if (orders.length > 0) {
        setOrder(orders[0]);
      }
      if (storeSettings.length > 0) {
        setStoreSettings(storeSettings[0]);
      }
      setLoading(false);
    }

    fetchData();
  }, [orderId]);

  if (loading || !order) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        جاري التحميل...
      </button>
    );
  }

  const fileName = `facture-${order.invoiceNumber || order.id.slice(-8)}.pdf`;

  if (variant === "icon") {
    return (
      <PDFDownloadLink
        document={<InvoiceDocument order={order} storeSettings={storeSettings} />}
        fileName={fileName}
      >
        {({ loading }) => (
          <button
            disabled={loading}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="تحميل الفاتورة"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        )}
      </PDFDownloadLink>
    );
  }

  return (
    <PDFDownloadLink
      document={<InvoiceDocument order={order} storeSettings={storeSettings} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري إنشاء الفاتورة...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              تحميل الفاتورة PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}

// Preview component for modal
export function InvoicePreview({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { orders, storeSettings } = await db.query({
        orders: {
          $: { where: { id: orderId } },
          items: {
            product: {},
          },
          customer: {},
        },
        storeSettings: {},
      });

      if (orders.length > 0) {
        setOrder(orders[0]);
      }
      if (storeSettings.length > 0) {
        setStoreSettings(storeSettings[0]);
      }
      setLoading(false);
    }

    fetchData();
  }, [orderId]);

  const handleDownload = async () => {
    if (!order) return;

    const blob = await pdf(
      <InvoiceDocument order={order} storeSettings={storeSettings} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `facture-${order.invoiceNumber || order.id.slice(-8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">جاري تحميل الفاتورة...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">لم يتم العثور على الطلب</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">معاينة الفاتورة</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            تحميل PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="border rounded-lg p-8 bg-gray-50 max-h-[60vh] overflow-auto">
        <div className="bg-white p-8 shadow-sm">
          {/* Header Preview */}
          <div className="flex justify-between mb-8 border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">فاتورة ضريبية</h1>
              <p className="text-gray-500 text-sm">Tax Invoice</p>
              <p className="text-lg font-semibold mt-2">
                رقم: {order.invoiceNumber || order.id.slice(-8)}
              </p>
              <p className="text-gray-600">
                التاريخ: {new Date(order.orderedAt).toLocaleDateString("ar-TN")}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-amber-600">
                {storeSettings?.storeName || "HoneyStore365"}
              </h2>
              {storeSettings?.contactPhone && (
                <p className="text-gray-600">هاتف: {storeSettings.contactPhone}</p>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2 border-b pb-1">معلومات العميل</h3>
            <p>
              <span className="text-gray-600">الاسم:</span> {order.customerName}
            </p>
            <p>
              <span className="text-gray-600">الهاتف:</span>{" "}
              {order.customerPhone || "—"}
            </p>
            <p>
              <span className="text-gray-600">العنوان:</span> {order.addressLine1},{" "}
              {order.city}
            </p>
          </div>

          {/* Items */}
          <table className="w-full mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-right">#</th>
                <th className="p-2 text-right">المنتج</th>
                <th className="p-2 text-center">الكمية</th>
                <th className="p-2 text-left">السعر</th>
                <th className="p-2 text-left">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{item.product?.name || "—"}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-left">
                    {(item.unitPrice / 1000).toFixed(3)} د.ت
                  </td>
                  <td className="p-2 text-left">
                    {(item.totalPrice / 1000).toFixed(3)} د.ت
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>المجموع الفرعي:</span>
              <span>{((order.totalAmount - order.deliveryFee) / 1000).toFixed(3)} د.ت</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>رسوم التوصيل:</span>
              <span>{(order.deliveryFee / 1000).toFixed(3)} د.ت</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-amber-600">
              <span>الإجمالي:</span>
              <span>{(order.totalAmount / 1000).toFixed(3)} د.ت</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
