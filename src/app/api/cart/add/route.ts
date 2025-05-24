import { createClientServer } from '@/lib/supabaseClientServer';
import { NextResponse } from 'next/server';

// Define types based on your Supabase schema
interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

interface Cart {
  id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
}

export async function POST(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { product_id, quantity } = await request.json();

  if (!product_id || quantity === undefined || quantity <= 0) {
    return NextResponse.json({ error: 'Invalid product_id or quantity' }, { status: 400 });
  }

  try {
    // Find or create the user's cart
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('customer_id', user.id)
      .single<Cart>();

    if (cartError && cartError.code === 'PGRST116') { // No cart found, create one
      const { data: newCart, error: createCartError } = await supabase
        .from('carts')
        .insert([{ customer_id: user.id }])
        .select('*')
        .single<Cart>();

      if (createCartError) {
        console.error('Error creating cart:', createCartError);
        return NextResponse.json({ error: createCartError.message }, { status: 500 });
      }
      cart = newCart;
    } else if (cartError) {
      console.error('Error fetching cart:', cartError);
      return NextResponse.json({ error: cartError.message }, { status: 500 });
    }

    if (!cart) {
       return NextResponse.json({ error: 'Could not find or create cart' }, { status: 500 });
    }

    // Check if the product already exists in the cart
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .single<CartItem>();

    if (existingItemError && existingItemError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing cart item:', existingItemError);
      return NextResponse.json({ error: existingItemError.message }, { status: 500 });
    }

    if (existingItem) {
      // Update quantity if item exists
      const { data: updatedItem, error: updateItemError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select('*')
        .single<CartItem>();

      if (updateItemError) {
        console.error('Error updating cart item quantity:', updateItemError);
        return NextResponse.json({ error: updateItemError.message }, { status: 500 });
      }
      return NextResponse.json({ message: 'Cart item quantity updated', item: updatedItem });

    } else {
      // Insert new cart item if it doesn't exist
      const { data: newItem, error: insertItemError } = await supabase
        .from('cart_items')
        .insert([{ cart_id: cart.id, product_id, quantity }])
        .select('*')
        .single<CartItem>();

      if (insertItemError) {
        console.error('Error inserting new cart item:', insertItemError);
        return NextResponse.json({ error: insertItemError.message }, { status: 500 });
      }
      return NextResponse.json({ message: 'Product added to cart', item: newItem });
    }

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
