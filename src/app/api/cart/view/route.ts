import { createClientServer } from '@/lib/supabaseClientServer';
import { NextResponse } from 'next/server';

// Define types based on your Supabase schema
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
  image_url: string | null;
}

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products: Product | null; // Link to the Product type
}

interface Cart {
  id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  cart_items: CartItem[]; // Link to the CartItem type
}


export async function GET(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    // Fetch the user's cart and its items
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*, cart_items(*, products(*))') // Select cart and related cart items and products
      .eq('customer_id', user.id)
      .single<Cart>(); // Use the defined Cart type

    if (cartError && cartError.code !== 'PGRST116') { // PGRST116 means no rows found (no cart yet)
      console.error('Error fetching cart:', cartError);
      return NextResponse.json({ error: cartError.message }, { status: 500 });
    }

    if (!cart) {
      return NextResponse.json({ cart: null, totalAmount: 0 });
    }

    // Calculate total amount
    let totalAmount = 0;
    if (cart.cart_items) {
      totalAmount = cart.cart_items.reduce((sum: number, item: CartItem) => {
        // Ensure item.products and item.products.price are not null/undefined
        const itemPrice = item.products?.price ?? 0;
        return sum + (itemPrice * item.quantity);
      }, 0);
    }

    return NextResponse.json({ cart, totalAmount });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
