'use server';

import { createClientServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Define Product type (consider moving to a shared types file)
interface Product {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
}

// Define CartItemWithProduct type
interface CartItemWithProduct {
  id: string;
  quantity: number;
  products: Product | null; // Product can be null if join fails or product deleted
}

// Define the expected shape of the items from the Supabase query
interface SupabaseCartItem {
  id: string;
  quantity: number;
  // If Supabase returns products as an array even for a to-one join, adjust this:
  products: Product[] | Product | null; 
}


// Helper function to get or create a cart for the current user
async function getOrCreateCart(supabase: any, userId: string) {
  // Check if an active cart exists for the user
  let { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('customer_id', userId)
    // Potentially add a status like 'active' if carts can be 'completed' or 'abandoned'
    // For now, we assume one cart per customer or the latest updated one.
    .order('updated_at', { ascending: false }) 
    .limit(1)
    .single();

  if (cartError && cartError.code !== 'PGRST116') { // PGRST116: 'single' row not found
    console.error('Error fetching cart:', cartError);
    throw new Error('Could not retrieve cart.');
  }

  if (!cart) {
    // Create a new cart for the user
    const { data: newCart, error: newCartError } = await supabase
      .from('carts')
      .insert({ customer_id: userId })
      .select('id')
      .single();

    if (newCartError) {
      console.error('Error creating cart:', newCartError);
      throw new Error('Could not create cart.');
    }
    cart = newCart;
  }
  return cart;
}

export async function addItemToCart(productId: string, quantity: number) {
  console.log(`addItemToCart: Received productId: ${productId}, quantity: ${quantity}`); // Log received parameters
  const supabase = await createClientServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('User not authenticated for addItemToCart');
    return { success: false, message: 'User not authenticated.' };
  }

  try {
    // Fetch product details for logging and validation
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('id', productId)
      .single();

    if (productError || !productData) {
      console.error(`addItemToCart: Product with ID ${productId} not found or error fetching. Error: ${productError?.message}`);
      return { success: false, message: `Product with ID ${productId} not found.` };
    }
    console.log('addItemToCart: Fetched product details:', JSON.stringify(productData, null, 2));
    if (typeof productData.price !== 'number') {
      console.error(`addItemToCart: Product ${productData.name} (ID: ${productId}) has an invalid price: ${productData.price}`);
      return { success: false, message: `Product ${productData.name} has an invalid price.` };
    }


    const cart = await getOrCreateCart(supabase, user.id);

    // Check if the item already exists in the cart
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single();

    if (existingItemError && existingItemError.code !== 'PGRST116') {
      console.error('Error checking for existing cart item:', existingItemError);
      throw new Error('Could not check cart item.');
    }

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + quantity;
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity }) // updated_at will be handled by the trigger
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item quantity:', updateError);
        throw new Error('Could not update item quantity in cart.');
      }
    } else {
      // Add new item if it doesn't exist
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          quantity: quantity,
        });

      if (insertError) {
        console.error('Error adding item to cart:', insertError);
        throw new Error('Could not add item to cart.');
      }
    }
    
    // Update the cart's updated_at timestamp
    await supabase
      .from('carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cart.id);

    revalidatePath('/cart'); // Revalidate the cart page
    revalidatePath('/profile'); // Revalidate profile page if it shows cart info/count
    // Potentially revalidate other pages like product detail pages if they show cart status
    return { success: true, message: 'Item added to cart.' };

  } catch (error: any) {
    console.error('addItemToCart Error:', error);
    return { success: false, message: error.message || 'Failed to add item to cart.' };
  }
}

export async function getCartItems() {
  const supabase = await createClientServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('User not authenticated for getCartItems');
    return { items: [], total: 0, error: 'User not authenticated.' };
  }

  try {
    const cart = await getOrCreateCart(supabase, user.id);

    const { data, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          price,
          image_url,
          description
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      throw new Error('Could not retrieve cart items.');
    }
    
    const items = data as any[] | null; // Use a more general type assertion first

    // Calculate total
    let total = 0;
    const processedItems = items?.map((item) => {
      // Defensive access to product, assuming it might be an object or an array with one object
      const productArray = Array.isArray(item.products) ? item.products : [item.products];
      const actualProduct: Product | null = productArray[0] || null;
      
      const productPrice = actualProduct?.price ?? 0;
      total += productPrice * item.quantity;
      return {
        id: item.id,
        quantity: item.quantity,
        product: actualProduct 
      };
    }) || [];
    
    // Fetch store settings for delivery fee using service role to avoid RLS issues
    const supabaseAdmin = await createClientServer('service_role');
    const { data: settingsRows, error: settingsError } = await supabaseAdmin
      .from('store_settings')
      .select('delivery_fee, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (settingsError) {
      console.warn('[Server] Error fetching store settings:', settingsError);
    }
    const settingsData = Array.isArray(settingsRows) ? settingsRows[0] : settingsRows;
    const deliveryFee = settingsData?.delivery_fee || 0;
    const shipping = deliveryFee; // Always apply delivery fee
    const grandTotal = total + shipping;

    return {
      items: processedItems,
      subtotal: total,
      shipping,
      grandTotal,
      error: null
    };

  } catch (error: any) {
    console.error('getCartItems Error:', error);
    return { items: [], subtotal: 0, error: error.message || 'Failed to retrieve cart items.' };
  }
}

// Optional: Action to remove an item from the cart
export async function removeCartItem(cartItemId: string) {
  const supabase = await createClientServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'User not authenticated.' };
  }

  try {
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
      // Potentially add .eq('cart_id', user_cart_id) for security if cart_id is known

    if (deleteError) {
      throw deleteError;
    }
    revalidatePath('/cart');
    return { success: true, message: 'Item removed from cart.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to remove item.' };
  }
}

// Optional: Action to update item quantity in cart
export async function updateCartItemQuantity(cartItemId: string, newQuantity: number) {
  const supabase = await createClientServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'User not authenticated.' };
  }

  if (newQuantity <= 0) {
    return removeCartItem(cartItemId); // Or handle as an error/disallow
  }

  try {
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity }) // updated_at will be handled by the trigger
      .eq('id', cartItemId);
      // Potentially add .eq('cart_id', user_cart_id) for security

    if (updateError) {
      throw updateError;
    }
    // Do NOT revalidate path here for quantity updates to avoid page jump.
    // Client-side state will handle the immediate visual update.
    // revalidatePath('/cart'); 
    return { success: true, message: 'Item quantity updated.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to update quantity.' };
  }
}

export async function clearCart() {
  const supabase = await createClientServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('User not authenticated for clearCart');
    return { success: false, message: 'User not authenticated.' };
  }

  try {
    const cart = await getOrCreateCart(supabase, user.id); // Get the user's cart

    // Delete all items from that cart
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      console.error('Error clearing cart items:', deleteError);
      throw new Error('Could not clear cart items.');
    }

    revalidatePath('/cart'); // Revalidate the cart page
    revalidatePath('/profile'); // Also revalidate profile if it shows cart count

    return { success: true, message: 'Cart cleared successfully.' };

  } catch (error: any) {
    console.error('clearCart Error:', error);
    return { success: false, message: error.message || 'Failed to clear cart.' };
  }
}
