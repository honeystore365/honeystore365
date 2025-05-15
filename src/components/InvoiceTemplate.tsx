import React from 'react';

// Define types for props - these should align with your data structures
interface CartProduct {
  id: string;
  name: string | null;
  price: number | null;
}

interface CartItem {
  id: string;
  quantity: number;
  product: CartProduct | null;
}

interface CustomerAddress {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone_number?: string | null;
}

interface CustomerInfo {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface OrderDetails {
  id: string;
  order_date: string; // ISO string or formatted date string
  total_amount: number;
  delivery_fee: number;
  payment_method?: string;
}

export interface InvoiceTemplateProps {
  orderDetails: OrderDetails;
  customerInfo: CustomerInfo;
  customerAddress: CustomerAddress;
  items: CartItem[];
  logoUrl?: string; // e.g., '/icon.png'
}

// Helper for date formatting
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  orderDetails,
  customerInfo,
  customerAddress,
  items,
  logoUrl,
}) => {
  const subtotal = orderDetails.total_amount - orderDetails.delivery_fee;

  return (
    <div className="invoice-container">
      <style>{`
        body {
          margin: 0;
          font-family: 'Noto Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          direction: rtl;
          text-align: right;
        }
        .invoice-container { padding: 2rem; background-color: white; max-width: 800px; margin: auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
        .header h1 { font-size: 2.25rem; font-weight: bold; color: #333; margin:0; }
        .header p { color: #555; margin:0; }
        .header img { height: 4rem; width: auto; }
        .section { margin-bottom: 2rem; }
        .section h2 { font-size: 1.25rem; font-weight: 600; color: #444; margin-bottom: 0.5rem; }
        .section p { margin-bottom: 0.25rem; line-height: 1.6; }
        .grid-cols-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; }
        table { width: 100%; border-collapse: collapse; text-align: right; }
        th, td { padding: 0.5rem; border: 1px solid #ddd; }
        th { background-color: #f9f9f9; }
        .text-center { text-align: center; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 2rem; }
        .totals > div { width: 100%; max-width: 33.333333%; /* md:w-1/3 */ } /* Simplified for direct HTML */
        .totals span { display: block; } /* Ensure spans behave for flex */
        .totals .total-item { display: flex; justify-content: space-between; margin-bottom: 0.5rem;}
        .totals .grand-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.25rem; border-top: 1px solid #ccc; padding-top: 0.5rem; margin-top: 0.5rem; }
        .footer { text-align: center; color: #777; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.875rem; }
        strong { font-weight: 600; }
      `}</style>
          <header className="header">
            <div>
              <h1>فاتورة طلب</h1>
              <p>Invoice</p>
            </div>
            {/* {logoUrl && (
              <img src={logoUrl} alt="App Logo" />
            )} */}
          </header>

          <section className="grid-cols-2 section">
            <div>
              <h2>تفاصيل الطلب:</h2>
              <p><strong>رقم الطلب:</strong> {orderDetails.id}</p>
              <p><strong>تاريخ الطلب:</strong> {formatDate(orderDetails.order_date)}</p>
              <p><strong>طريقة الدفع:</strong> {orderDetails.payment_method || 'الدفع عند الاستلام'}</p>
            </div>
            <div>
              <h2>بيانات العميل:</h2>
              <p><strong>الاسم:</strong> {customerInfo.first_name || ''} {customerInfo.last_name || ''}</p>
              {customerInfo.email && <p><strong>البريد الإلكتروني:</strong> {customerInfo.email}</p>}
              {customerAddress.phone_number && <p><strong>رقم الهاتف:</strong> {customerAddress.phone_number}</p>}
              <p>
                <strong>العنوان:</strong> {customerAddress.address_line_1 || ''}
                {customerAddress.address_line_2 && `, ${customerAddress.address_line_2}`}
                {customerAddress.city && `, ${customerAddress.city}`}
                {customerAddress.state && `, ${customerAddress.state}`}
                {customerAddress.postal_code && ` - ${customerAddress.postal_code}`}
                {customerAddress.country && `, ${customerAddress.country}`}
              </p>
            </div>
          </section>

          <section className="section">
            <h2>المنتجات المطلوبة:</h2>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th className="text-center">الكمية</th>
                  <th className="text-center">سعر الوحدة</th>
                  <th className="text-center">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  item.product && (
                    <tr key={item.id}>
                      {/* Temporarily commented out product image */}
                      {/* <td>
                        {item.product.image_url && (
                          <img src={item.product.image_url} alt={item.product.name || 'Product Image'} style={{ width: '50px', height: 'auto' }} />
                        )}
                      </td> */}
                      <td>{item.product.name || 'N/A'}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center">{(item.product.price || 0).toFixed(2)} د.ت</td>
                      <td className="text-center">{((item.product.price || 0) * item.quantity).toFixed(2)} د.ت</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </section>

          <section className="totals">
            <div>
              <div className="total-item">
                <span>المجموع الفرعي:</span>
                <span>{subtotal.toFixed(2)} د.ت</span>
              </div>
              <div className="total-item">
                <span>رسوم التوصيل:</span>
                <span>{orderDetails.delivery_fee.toFixed(2)} د.ت</span>
              </div>
              <div className="grand-total">
                <span>المجموع الإجمالي:</span>
                <span>{orderDetails.total_amount.toFixed(2)} د.ت</span>
              </div>
            </div>
          </section>

          <footer className="footer">
            <p>شكراً لتسوقكم معنا! سيقوم مندوبنا بالاتصال بكم قريباً لتأكيد الطلب.</p>
            <p>Thank you for your order! Our representative will call you soon for confirmation.</p>
          </footer>
        </div>
  );
};

export default InvoiceTemplate;
