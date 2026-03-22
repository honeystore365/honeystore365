import { NextResponse } from 'next/server';
import { orderService } from '@/services/orders';

export async function GET() {
  try {
    const result = await orderService.getOrderStats();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch order stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('Error in orders stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}