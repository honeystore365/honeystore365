import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/services/orders';

export async function POST(request: NextRequest) {
  try {
    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const result = await orderService.cancelOrder(orderId, reason || 'Cancelled via admin API');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to cancel order' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in cancel order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}