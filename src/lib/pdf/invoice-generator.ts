// Générateur de facture PDF conforme aux normes comptables tunisiennes/françaises
// Utilise Puppeteer pour créer un vrai PDF

import puppeteer from 'puppeteer';
import { logger } from '@/lib/logger';

interface OrderData {
  id: string;
  order_date: string;
  total_amount: number;
  delivery_fee?: number;
  payment_method: string;
  status?: string;
  customers: {
    first_name: string;
    last_name: string;
    email?: string;
  };
  addresses: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    postal_code?: string;
    country?: string;
    phone_number?: string;
  };
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    products: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}

// Configuration de l'entreprise conforme aux normes comptables
const COMPANY_INFO = {
  name: 'مناحل الرحيق',
  nameEn: 'Honey Store 365',
  address: 'تونس العاصمة، تونس',
  phone: '+216 XX XXX XXX',
  email: 'info@honeystore365.com',
  website: 'www.honeystore365.com',
  registrationNumber: 'RC: XXXXXXX', // Numéro de registre de commerce
  taxNumber: 'MF: XXXXXXX', // Matricule fiscal
  vatNumber: 'TVA: XXXXXXX' // Numéro TVA si applicable
};

export async function generateInvoicePDF(order: OrderData): Promise<Buffer> {
  let browser;
  
  try {
    logger.info('🚀 Starting Puppeteer for invoice generation...');
    
    // Lancer Puppeteer avec des options optimisées
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Générer le HTML de la facture
    const htmlContent = generateInvoiceHTML(order);
    logger.info('📄 HTML generated, converting to PDF...');
    
    // Charger le HTML dans la page
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Générer le PDF avec les bonnes options
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });
    
    logger.info('✅ PDF generated successfully');
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    logger.error('❌ PDF generation failed', error as Error, { orderId: order.id });
    throw new Error(`Impossible de générer la facture PDF: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (browser) {
      await browser.close();
      logger.info('🔒 Puppeteer closed');
    }
  }
}

function generateInvoiceHTML(order: OrderData): string {
  const invoiceNumber = generateInvoiceNumber(order.id, order.order_date);
  const orderDate = new Date(order.order_date).toLocaleDateString('fr-FR');
  const subtotal = calculateSubtotal(order.order_items);
  const tva = calculateTVA(subtotal); // TVA 19% en Tunisie
  const totalHT = subtotal;
  const totalTTC = order.total_amount;
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة رقم ${invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: #fff;
            direction: rtl;
        }
        
        .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
            min-height: 297mm;
        }
        
        /* En-tête conforme aux normes */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f59e0b;
        }
        
        .company-info {
            flex: 1;
            text-align: right;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #f59e0b;
            margin-bottom: 5px;
        }
        
        .company-name-en {
            font-size: 14px;
            color: #666;
            font-style: italic;
            margin-bottom: 10px;
        }
        
        .company-details {
            font-size: 11px;
            color: #555;
            line-height: 1.6;
        }
        
        .legal-info {
            margin-top: 8px;
            font-size: 10px;
            color: #777;
        }
        
        .invoice-type {
            flex: 1;
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border: 2px solid #f59e0b;
            border-radius: 8px;
        }
        
        .invoice-title {
            font-size: 18px;
            font-weight: bold;
            color: #f59e0b;
            margin-bottom: 5px;
        }
        
        .invoice-number {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        
        .invoice-date {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        /* Informations client et facture */
        .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 25px 0;
        }
        
        .info-box {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            background: #fafafa;
        }
        
        .info-title {
            font-weight: bold;
            color: #f59e0b;
            font-size: 14px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #f59e0b;
        }
        
        .info-content {
            font-size: 12px;
            line-height: 1.6;
        }
        
        /* Tableau des articles conforme aux normes */
        .items-section {
            margin: 25px 0;
        }
        
        .items-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border: 1px solid #ddd;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #333;
            padding: 8px 6px;
            text-align: center;
        }
        
        .items-table th {
            background-color: #f59e0b;
            color: white;
            font-weight: bold;
            font-size: 12px;
        }
        
        .items-table td {
            vertical-align: middle;
        }
        
        .item-description {
            text-align: right;
            padding-right: 10px;
        }
        
        .amount {
            font-weight: bold;
            text-align: left;
            direction: ltr;
        }
        
        /* Totaux conformes aux normes comptables */
        .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            border-collapse: collapse;
            font-size: 12px;
            min-width: 300px;
        }
        
        .totals-table td {
            border: 1px solid #333;
            padding: 8px 12px;
        }
        
        .totals-table .label {
            background: #f8f9fa;
            font-weight: bold;
            text-align: right;
            width: 60%;
        }
        
        .totals-table .amount {
            text-align: left;
            direction: ltr;
            font-weight: bold;
            width: 40%;
        }
        
        .total-final {
            background: #f59e0b !important;
            color: white !important;
            font-size: 14px;
            font-weight: bold;
        }
        
        /* Conditions et mentions légales */
        .legal-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
        }
        
        .payment-info {
            margin-bottom: 15px;
            padding: 10px;
            background: #f0f8ff;
            border-left: 4px solid #f59e0b;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        
        /* Styles optimisés pour PDF */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .invoice-container {
                margin: 0;
                padding: 0;
                box-shadow: none;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
        
        @page {
            size: A4;
            margin: 0;
        }
        
        /* Optimisations PDF */
        * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .invoice-container {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0;
            background: white;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- En-tête -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">${COMPANY_INFO.name}</div>
                <div class="company-name-en">${COMPANY_INFO.nameEn}</div>
                <div class="company-details">
                    ${COMPANY_INFO.address}<br>
                    الهاتف: ${COMPANY_INFO.phone}<br>
                    البريد الإلكتروني: ${COMPANY_INFO.email}<br>
                    الموقع: ${COMPANY_INFO.website}
                </div>
                <div class="legal-info">
                    ${COMPANY_INFO.registrationNumber}<br>
                    ${COMPANY_INFO.taxNumber}<br>
                    ${COMPANY_INFO.vatNumber}
                </div>
            </div>
            
            <div class="invoice-type">
                <div class="invoice-title">فاتورة بيع</div>
                <div class="invoice-title" style="font-size: 14px; color: #666;">FACTURE DE VENTE</div>
                <div class="invoice-number">${invoiceNumber}</div>
                <div class="invoice-date">التاريخ: ${orderDate}</div>
                <div class="invoice-date">Date: ${orderDate}</div>
            </div>
        </div>

        <!-- Informations client et facture -->
        <div class="info-section">
            <div class="info-box">
                <div class="info-title">معلومات العميل / Client</div>
                <div class="info-content">
                    <strong>${order.customers.first_name} ${order.customers.last_name}</strong><br>
                    ${order.addresses.address_line_1}<br>
                    ${order.addresses.address_line_2 ? order.addresses.address_line_2 + '<br>' : ''}
                    ${order.addresses.city} ${order.addresses.postal_code || ''}<br>
                    ${order.addresses.country || 'تونس'}<br><br>
                    الهاتف: ${order.addresses.phone_number || 'غير متوفر'}<br>
                    البريد: ${order.customers.email || 'غير متوفر'}
                </div>
            </div>
            
            <div class="info-box">
                <div class="info-title">تفاصيل الفاتورة / Détails</div>
                <div class="info-content">
                    <strong>رقم الطلب:</strong> #${order.id.slice(-8)}<br>
                    <strong>N° Commande:</strong> #${order.id.slice(-8)}<br><br>
                    <strong>طريقة الدفع:</strong> ${getPaymentMethodText(order.payment_method)}<br>
                    <strong>Mode paiement:</strong> ${getPaymentMethodTextFr(order.payment_method)}<br><br>
                    <strong>الحالة:</strong> ${getStatusText(order.status || 'Confirmed')}<br>
                    <strong>Statut:</strong> ${getStatusTextFr(order.status || 'Confirmed')}
                </div>
            </div>
        </div>

        <!-- Tableau des articles -->
        <div class="items-section">
            <div class="items-title">تفاصيل المنتجات / DÉTAIL DES PRODUITS</div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">رقم<br>N°</th>
                        <th style="width: 35%;">المنتج<br>PRODUIT</th>
                        <th style="width: 25%;">الوصف<br>DESCRIPTION</th>
                        <th style="width: 8%;">الكمية<br>QTÉ</th>
                        <th style="width: 12%;">السعر الوحدة<br>P.U. (DT)</th>
                        <th style="width: 15%;">المجموع<br>TOTAL (DT)</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.order_items.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td class="item-description">
                                <strong>${item.products.name}</strong>
                            </td>
                            <td class="item-description">
                                ${item.products.description || '-'}
                            </td>
                            <td>${item.quantity}</td>
                            <td class="amount">${item.price.toFixed(3)}</td>
                            <td class="amount">${(item.price * item.quantity).toFixed(3)}</td>
                        </tr>
                    `).join('')}
                    
                    ${order.delivery_fee && order.delivery_fee > 0 ? `
                        <tr>
                            <td>${order.order_items.length + 1}</td>
                            <td class="item-description"><strong>رسوم التوصيل</strong></td>
                            <td class="item-description">Frais de livraison</td>
                            <td>1</td>
                            <td class="amount">${order.delivery_fee.toFixed(3)}</td>
                            <td class="amount">${order.delivery_fee.toFixed(3)}</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>

        <!-- Totaux -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">المجموع قبل الضريبة / Total HT</td>
                    <td class="amount">${totalHT.toFixed(3)} DT</td>
                </tr>
                <tr>
                    <td class="label">ضريبة القيمة المضافة 19% / TVA 19%</td>
                    <td class="amount">${tva.toFixed(3)} DT</td>
                </tr>
                <tr class="total-final">
                    <td class="label total-final">المجموع الإجمالي / TOTAL TTC</td>
                    <td class="amount total-final">${totalTTC.toFixed(3)} DT</td>
                </tr>
            </table>
        </div>

        <!-- Informations de paiement -->
        <div class="legal-section">
            <div class="payment-info">
                <strong>معلومات الدفع / Informations de paiement:</strong><br>
                طريقة الدفع: ${getPaymentMethodText(order.payment_method)} / Mode: ${getPaymentMethodTextFr(order.payment_method)}<br>
                ${order.payment_method === 'cash_on_delivery' ? 
                    'الدفع عند الاستلام / Paiement à la livraison' : 
                    'تم الدفع / Payé'
                }
            </div>
            
            <div style="font-size: 10px; line-height: 1.6;">
                <strong>شروط البيع / Conditions de vente:</strong><br>
                • البضاعة المباعة لا تُسترد إلا في حالة العيب / Marchandise vendue non reprise sauf défaut<br>
                • يجب فحص البضاعة عند الاستلام / Vérification obligatoire à la réception<br>
                • أي نزاع يخضع لمحاكم تونس / Tout litige relève des tribunaux de Tunis<br><br>
                
                <strong>ملاحظة مهمة:</strong> هذه الفاتورة صادرة وفقاً للقانون التونسي والمعايير المحاسبية المعمول بها.<br>
                <strong>Note importante:</strong> Cette facture est émise conformément à la législation tunisienne et aux normes comptables en vigueur.
            </div>
        </div>

        <!-- Pied de page -->
        <div class="footer">
            <p><strong>شكراً لثقتكم بنا / Merci de votre confiance</strong></p>
            <p>فاتورة إلكترونية صادرة بتاريخ ${new Date().toLocaleDateString('fr-FR')} / Facture électronique émise le ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>جميع الحقوق محفوظة © ${new Date().getFullYear()} ${COMPANY_INFO.name} / Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;
}

// Fonctions utilitaires
function generateInvoiceNumber(orderId: string, orderDate: string): string {
  const year = new Date(orderDate).getFullYear();
  const orderNumber = orderId.slice(-6).toUpperCase();
  return `INV-${year}-${orderNumber}`;
}

function calculateSubtotal(items: OrderData['order_items']): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateTVA(subtotal: number): number {
  // TVA 19% en Tunisie
  return subtotal * 0.19;
}

function getPaymentMethodText(method: string): string {
  const methods: Record<string, string> = {
    'cash_on_delivery': 'الدفع عند الاستلام',
    'bank_transfer': 'تحويل بنكي',
    'credit_card': 'بطاقة ائتمان',
    'mobile_payment': 'دفع عبر الهاتف'
  };
  return methods[method] || method;
}

function getPaymentMethodTextFr(method: string): string {
  const methods: Record<string, string> = {
    'cash_on_delivery': 'Paiement à la livraison',
    'bank_transfer': 'Virement bancaire',
    'credit_card': 'Carte de crédit',
    'mobile_payment': 'Paiement mobile'
  };
  return methods[method] || method;
}

function getStatusText(status: string): string {
  const statuses: Record<string, string> = {
    'Pending Confirmation': 'في انتظار التأكيد',
    'Confirmed': 'مؤكد',
    'Delivered': 'تم التوصيل',
    'Cancelled': 'ملغى'
  };
  return statuses[status] || status;
}

function getStatusTextFr(status: string): string {
  const statuses: Record<string, string> = {
    'Pending Confirmation': 'En attente de confirmation',
    'Confirmed': 'Confirmé',
    'Delivered': 'Livré',
    'Cancelled': 'Annulé'
  };
  return statuses[status] || status;
}