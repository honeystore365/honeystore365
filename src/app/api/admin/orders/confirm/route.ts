import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/services/orders';
import { OrderStatus } from '@/types/enums';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const result = await orderService.updateOrderStatus({
      orderId,
      status: OrderStatus.CONFIRMED,
      notes: 'Order confirmed via admin API',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to confirm order' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, order: result.data });

  } catch (error) {
    console.error('Error in confirm order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}