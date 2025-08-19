import { createClientServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { cart_item_id } = await request.json();

  if (!cart_item_id) {
    return NextResponse.json({ error: 'Invalid cart_item_id' }, { status: 400 });
  }

  try {
    // Verify the cart item belongs to the user's cart before deleting
    const { data: cartItem, error: fetchItemError } = await supabase
      .from('cart_items')
      .select('id, cart_id')
      .eq('id', cart_item_id)
      .single();

    if (fetchItemError) {
      console.error('Error fetching cart item:', fetchItemError);
      return NextResponse.json({ error: fetchItemError.message }, { status: 500 });
    }

    const { data: cart, error: fetchCartError } = await supabase
      .from('carts')
      .select('id')
      .eq('id', cartItem.cart_id)
      .eq('customer_id', user.id)
      .single();

    if (fetchCartError) {
       console.error('Error verifying cart ownership:', fetchCartError);
       return NextResponse.json({ error: 'Unauthorized or cart not found' }, { status: 403 });
    }

    // Delete the cart item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cart_item_id);

    if (deleteError) {
      console.error('Error deleting cart item:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Cart item removed successfully' });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}