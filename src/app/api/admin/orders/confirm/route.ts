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

    // Vérifier que la commande existe
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (checkError || !existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status to confirmed
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'Confirmed'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error confirming order:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm order' },
        { status: 500 }
      );
    }

    // TODO: Send notification to customer (email, SMS, etc.)
    // You can implement notification logic here

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in confirm order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}