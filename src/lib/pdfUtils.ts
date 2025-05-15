import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// @ts-ignore - Suppress TypeScript error if @pdf-lib/fontkit has no bundled/separate types
import fontkit from '@pdf-lib/fontkit';

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
  order_date: string;
  total_amount: number;
  delivery_fee: number;
}

export async function generateInvoicePdf(
  orderDetails: OrderDetails,
  customerInfo: CustomerInfo,
  customerAddress: CustomerAddress,
  items: CartItem[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit); // Register fontkit instance

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  // Load App Logo (assuming PNG)
  // IMPORTANT: Ensure your logo (e.g., icon.png) is in the public directory or public/images/
  const logoUrl = '/icon.png'; // Adjust path if your logo is elsewhere, e.g., /images/logo.png
  let embeddedLogo;
  try {
    const logoBytes = await fetch(logoUrl).then(res => {
      if (!res.ok) throw new Error(`Failed to fetch logo: ${res.statusText}`);
      return res.arrayBuffer();
    });
    embeddedLogo = await pdfDoc.embedPng(logoBytes);
  } catch (e) {
    console.error("Failed to load or embed logo:", e);
    // Continue without logo if it fails
  }

  // Load custom Arabic font
  // IMPORTANT: Ensure NotoSansArabic-Regular.ttf (or your chosen font) is in public/fonts/
  const fontUrl = '/fonts/NotoSansArabic-Regular.ttf'; 
  const fontBytes = await fetch(fontUrl).then(res => {
    if (!res.ok) throw new Error(`Failed to fetch font: ${res.statusText}`);
    return res.arrayBuffer();
  });
  const customArabicFont = await pdfDoc.embedFont(fontBytes);

  // Use a standard font for any non-Arabic text or fallbacks if needed
  const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const standardBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // For simplicity, we'll use the customArabicFont for most text now.
  // You might want to switch between fonts for mixed language content.
  const font = customArabicFont;
  const boldFont = customArabicFont; // If you have a bold version, embed that separately. Otherwise, standard bold.
                                   // Using customArabicFont for bold as well, or use standardBoldFont if Arabic bold is not critical.

  let y = height - 50;
  const margin = 50;
  const lineHeight = 20;
  const smallLineHeight = 15;

  // Helper to add text
  const addText = (text: string, x: number, currentY: number, customFont = font, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y: currentY, font: customFont, size, color });
    return currentY - lineHeight;
  };

  const addSmallText = (text: string, x: number, currentY: number, customFont = font, size = 10, color = rgb(0.3, 0.3, 0.3)) => {
    page.drawText(text, { x, y: currentY, font: customFont, size, color });
    return currentY - smallLineHeight;
  };

  // Draw Logo if embedded
  if (embeddedLogo) {
    const logoDims = embeddedLogo.scale(0.25); // Scale logo to 25% of its original size, adjust as needed
    page.drawImage(embeddedLogo, {
      x: width - margin - logoDims.width, // Position top-right
      y: height - margin - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });
  }
  
  // Invoice Title
  // Adjust y if logo is present to avoid overlap, or position logo and title thoughtfully
  y = addText('فاتورة طلب (Invoice)', margin, y, boldFont, 24, rgb(0.1, 0.4, 0.2));
  y -= lineHeight; // Extra space

  // Order Details
  y = addText(`رقم الطلب (Order ID): ${orderDetails.id}`, margin, y, font, 12);
  y = addText(`تاريخ الطلب (Order Date): ${new Date(orderDetails.order_date).toLocaleDateString('ar-EG')}`, margin, y, font, 12);
  y -= smallLineHeight;

  // Customer Details
  y = addText('بيانات العميل (Customer Details):', margin, y, boldFont, 14);
  if (customerInfo.first_name || customerInfo.last_name) {
    y = addSmallText(`الاسم (Name): ${customerInfo.first_name || ''} ${customerInfo.last_name || ''}`, margin + 10, y);
  }
  if (customerInfo.email) {
    y = addSmallText(`البريد الإلكتروني (Email): ${customerInfo.email}`, margin + 10, y);
  }
  if (customerAddress.phone_number) {
    y = addSmallText(`رقم الهاتف (Phone): ${customerAddress.phone_number}`, margin + 10, y);
  }
  if (customerAddress.address_line_1) {
    let fullAddress = `${customerAddress.address_line_1}`;
    if (customerAddress.address_line_2) fullAddress += `, ${customerAddress.address_line_2}`;
    if (customerAddress.city) fullAddress += `, ${customerAddress.city}`;
    if (customerAddress.postal_code) fullAddress += ` - ${customerAddress.postal_code}`;
    if (customerAddress.country) fullAddress += `, ${customerAddress.country}`;
    y = addSmallText(`العنوان (Address): ${fullAddress}`, margin + 10, y);
  }
  y -= lineHeight;

  // Items Table Header
  y = addText('المنتجات (Items):', margin, y, boldFont, 14);
  y = addText('المنتج (Product)', margin, y, boldFont, 10);
  page.drawText('الكمية (Qty)', { x: margin + 250, y, font: boldFont, size: 10 });
  page.drawText('سعر الوحدة (Unit Price)', { x: margin + 350, y, font: boldFont, size: 10 });
  page.drawText('المجموع (Total)', { x: margin + 450, y, font: boldFont, size: 10 });
  y -= smallLineHeight;
  page.drawLine({
    start: { x: margin, y: y + 5 },
    end: { x: width - margin, y: y + 5 },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= smallLineHeight;


  // Items List
  items.forEach(item => {
    if (item.product) {
      const itemTotal = (item.product.price || 0) * item.quantity;
      y = addSmallText(item.product.name || 'N/A', margin, y, font, 10);
      page.drawText(item.quantity.toString(), { x: margin + 250, y: y + smallLineHeight, font, size: 10 });
      page.drawText((item.product.price || 0).toFixed(2) + ' د.ت', { x: margin + 350, y: y + smallLineHeight, font, size: 10 });
      page.drawText(itemTotal.toFixed(2) + ' د.ت', { x: margin + 450, y: y + smallLineHeight, font, size: 10 });
    }
  });
  y -= lineHeight;

  // Totals
  const subtotal = orderDetails.total_amount - orderDetails.delivery_fee;
  y = addText(`المجموع الفرعي (Subtotal): ${subtotal.toFixed(2)} د.ت`, margin + 300, y, font, 12);
  y = addText(`رسوم التوصيل (Delivery Fee): ${orderDetails.delivery_fee.toFixed(2)} د.ت`, margin + 300, y, font, 12);
  y = addText(`المجموع الإجمالي (Grand Total): ${orderDetails.total_amount.toFixed(2)} د.ت`, margin + 300, y, boldFont, 14, rgb(0.1, 0.4, 0.2));
  y -= lineHeight;

  // Payment Method
  y = addText('طريقة الدفع (Payment Method): الدفع عند الاستلام (Cash on Delivery)', margin, y, font, 12);
  y -= lineHeight;

  // Footer Note
  // Ensure Arabic text uses the Arabic font
  y = addText('شكراً لتسوقكم معنا! سيقوم مندوبنا بالاتصال بكم قريباً لتأكيد الطلب.', margin, y, font, 10, rgb(0.5,0.5,0.5));
  // For English text, you could switch to standardFont if desired for different styling
  y = addText('Thank you for your order! Our representative will call you soon for confirmation.', margin, y, standardFont, 8, rgb(0.5,0.5,0.5));


  return pdfDoc.save();
}
