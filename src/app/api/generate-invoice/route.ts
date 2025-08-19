import { createClientServerReadOnly } from '@/lib/supabase/server-readonly';
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

    const supabase = await createClientServerReadOnly();

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          email
        ),
        addresses (
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          phone_number
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

    // For now, return a simple invoice data structure
    // In a real implementation, you would generate a PDF or formatted invoice
    const invoiceData = {
      orderId: order.id,
      orderDate: order.created_at,
      customer: order.customers,
      address: order.addresses,
      total: order.total_amount,
      status: order.status,
      // Add more invoice details as needed
    };

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
      message: 'Invoice generated successfully'
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}