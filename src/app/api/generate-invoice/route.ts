import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabaseClientServer';
import { generatePdfBuffer } from '@/lib/generatePdfBuffer'; // Import generatePdfBuffer
import { cookies } from 'next/headers';
import { Buffer } from 'buffer';
import { UTApi } from 'uploadthing/server'; // Import UTApi
const utapi = new UTApi(); // Initialize UTApi
// InvoiceTemplateProps might still be useful if you want to type check invoiceData before sending
import { InvoiceTemplateProps } from '@/components/InvoiceTemplate';

export const runtime = 'nodejs';

// Define types for data fetching (align with your schema)
interface CartProduct { id: string; name: string | null; price: number | null; }
interface CartItemForInvoice { id: string; quantity: number; product: CartProduct | null; }
interface CustomerAddressForInvoice {
  address_line_1?: string | null; address_line_2?: string | null; city?: string | null;
  state?: string | null; postal_code?: string | null; country?: string | null; phone_number?: string | null;
}
interface CustomerInfoForInvoice { first_name?: string | null; last_name?: string | null; email?: string | null; }
interface OrderDetailsForInvoice {
  id: string; order_date: string; total_amount: number; delivery_fee: number; payment_method?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = await createClientServer();

    // 1. Fetch order details (same as before)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, customers!inner(*, addresses!inner(*))')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error(`[API/generate-invoice] Error fetching order ${orderId}:`, orderError);
      return NextResponse.json({ error: `Failed to fetch order details: ${orderError?.message}` }, { status: 500 });
    }
    if (!orderData.customers) {
      return NextResponse.json({ error: 'Customer data not found for this order.' }, { status: 500 });
    }
    const customerAddresses = orderData.customers.addresses as CustomerAddressForInvoice[] | null;
    const customerAddressData = customerAddresses?.[0];
    if (!customerAddressData) {
      return NextResponse.json({ error: 'Address data not found for this customer.' }, { status: 500 });
    }

    // 2. Fetch order items (same as before)
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, quantity, products!inner(id, name, price)')
      .eq('order_id', orderId);

    if (orderItemsError || !orderItemsData) {
      console.error(`[API/generate-invoice] Error fetching order items for order ${orderId}:`, orderItemsError);
      return NextResponse.json({ error: `Failed to fetch order items: ${orderItemsError?.message}` }, { status: 500 });
    }

    // 3. Prepare data for the InvoiceTemplate (same as before)
    const customer = orderData.customers;
    const address = customerAddressData;
    const invoiceData: InvoiceTemplateProps = {
      orderDetails: {
        id: orderData.id, order_date: orderData.order_date, total_amount: orderData.total_amount,
        delivery_fee: orderData.delivery_fee || 0, payment_method: orderData.payment_method || 'Cash on Delivery',
      },
      customerInfo: {
        first_name: customer.first_name, last_name: customer.last_name, email: customer.email,
      },
      customerAddress: {
        address_line_1: address.address_line_1, address_line_2: address.address_line_2, city: address.city,
        state: address.state, postal_code: address.postal_code, country: address.country, phone_number: address.phone_number,
      },
      items: orderItemsData.map(item => {
        const productInfo = item.products as any as CartProduct | null;
        return { id: item.id, quantity: item.quantity, product: productInfo };
      }),
      logoUrl: `${req.nextUrl.origin}/icon.png`, // Base URL for logo if PDF service fetches it
    };

    // 4. Generate the PDF using generatePdfBuffer
    const pdfBuffer = await generatePdfBuffer(invoiceData);

    console.log('[API/generate-invoice] PDF buffer generated. Size:', pdfBuffer.length); // Add log

    // 5. Upload the PDF to Uploadthing
    console.log('Value of UPLOADTHING_SECRET:', process.env.UPLOADTHING_SECRET); // Added logging for env var
    console.log('Value of utapi:', utapi); // Added logging for utapi
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const file = new File([blob], `invoice-${orderId}.pdf`, { type: "application/pdf" });
    const uploadthingResponse = await utapi.uploadFiles(file);

    if (uploadthingResponse.error) { // Check for error property
      console.error(`[API/generate-invoice] Uploadthing failed to upload file:`, uploadthingResponse.error); // Log the specific error
      return NextResponse.json({ error: `Uploadthing failed to upload file: ${uploadthingResponse.error.message}` }, { status: 500 }); // Return error message
    }

    const pdfUrl = uploadthingResponse.data.url; // Access url from data property

    console.log('[API/generate-invoice] PDF uploaded to Uploadthing. URL:', pdfUrl); // Add log

    // 6. Store the PDF URL in the database
    const { data: updateData, error: updateError } = await supabase
      .from('orders')
      .update({ pdf_url: pdfUrl })
      .eq('id', orderId);

    if (updateError) {
      console.error(`[API/generate-invoice] Error updating order with PDF URL:`, updateError);
      return NextResponse.json({ error: `Failed to update order with PDF URL: ${updateError?.message}` }, { status: 500 });
    }

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('[API/generate-invoice] Unhandled error in POST:', error);
    return NextResponse.json({ error: `Failed to generate PDF: ${error.message}` }, { status: 500 });
  }
}
