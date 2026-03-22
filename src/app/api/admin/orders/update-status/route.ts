import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/services/orders';
import { OrderStatus } from '@/types/enums';

export async function POST(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Map string status to OrderStatus enum
    const statusMap: Record<string, OrderStatus> = {
      'Pending Confirmation': OrderStatus.PENDING,
      'Confirmed': OrderStatus.CONFIRMED,
      'Processing': OrderStatus.PROCESSING,
      'Shipped': OrderStatus.SHIPPED,
      'Delivered': OrderStatus.DELIVERED,
      'Cancelled': OrderStatus.CANCELLED,
    };

    const orderStatus = statusMap[status];
    if (!orderStatus) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const result = await orderService.updateOrderStatus({
      orderId,
      status: orderStatus,
      notes: `Status updated via admin API`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update order status' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, order: result.data });

  } catch (error) {
    console.error('Error in update status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}