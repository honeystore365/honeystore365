import { generateInvoicePDF } from '@/lib/pdf/invoice-generator';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Utiliser directement la service key pour les opérations admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch complete order data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Vérifier que la commande n'est pas annulée
    if (order.status === 'Cancelled') {
      return NextResponse.json(
        { 
          error: 'Cannot generate invoice for cancelled orders',
          message: 'لا يمكن إنشاء فاتورة للطلبات الملغاة'
        },
        { status: 400 }
      );
    }

    // Get customer info separately
    const { data: customer } = await supabase
      .from('customers')
      .select('first_name, last_name, email')
      .eq('id', order.customer_id)
      .single();

    // Get address info separately
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', order.customer_id)
      .single();

    // Enrich order with customer and address data
    const enrichedOrder = {
      ...order,
      customers: customer,
      addresses: address
    };

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(enrichedOrder);
    
    // Générer le numéro de facture pour le nom du fichier
    const invoiceNumber = `INV-${new Date(order.order_date).getFullYear()}${String(new Date(order.order_date).getMonth() + 1).padStart(2, '0')}-${orderId.slice(-6).toUpperCase()}`;

    // Return PDF file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoiceNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}