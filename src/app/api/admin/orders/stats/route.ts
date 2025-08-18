import { createClientServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClientServer();

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    if (ordersError) {
      console.error('Error fetching orders for stats:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: orders.length,
      pending: orders.filter(o => (o.status || 'Pending Confirmation') === 'Pending Confirmation').length,
      confirmed: orders.filter(o => o.status === 'Confirmed').length,
      processing: orders.filter(o => o.status === 'Processing').length,
      shipped: orders.filter(o => o.status === 'Shipped').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
      todayOrders: orders.filter(o => new Date(o.order_date) >= today).length,
      totalRevenue: orders
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0),
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in orders stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}