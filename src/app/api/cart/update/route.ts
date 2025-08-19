import { createClientServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { cart_item_id, quantity } = await request.json();

  if (!cart_item_id || quantity === undefined || quantity < 0) {
    return NextResponse.json({ error: 'Invalid cart_item_id or quantity' }, { status: 400 });
  }

  try {
    // Verify the cart item belongs to the user's cart before updating
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

    if (quantity === 0) {
      // If quantity is 0, remove the item
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cart_item_id);

      if (deleteError) {
        console.error('Error deleting cart item:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
      return NextResponse.json({ message: 'Cart item removed successfully' });

    } else {
      // Update the quantity
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cart_item_id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating cart item quantity:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json({ message: 'Cart item quantity updated', item: updatedItem });
    }

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}