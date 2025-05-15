'use server';

import { createClientServer } from '@/lib/supabaseClientServer';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

interface CartProduct {
  id: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  description: string | null;
}

interface CartItem {
  id: string; // cart_item_id
  quantity: number;
  product: CartProduct | null;
}

export interface AddressWithPhone {
  id: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone_number: string | null;
}

interface CustomerDetails {
  customer_id: string | null;
  first_name: string | null;
  last_name: string | null;
  address: AddressWithPhone | null;
  error: string | null;
}

export async function getCustomerDetailsForCheckout(): Promise<CustomerDetails> {
  const supabase = await createClientServer();
  // Use getUser() for server-side authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { customer_id: null, first_name: null, last_name: null, address: null, error: userError?.message || 'User not authenticated.' };
  }

  const userId = user.id;
  console.log('[getCustomerDetailsForCheckout] Authenticated User ID:', userId);

  // 1. Get customer details (id, first_name, last_name) from customers table
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('id, first_name, last_name')
    .eq('id', userId) // Corrected: 'id' column in 'customers' is the FK to auth.users.id
    .single();

  if (customerError || !customerData) {
    console.error('[getCustomerDetailsForCheckout] Error fetching customer for userId:', userId, 'Error:', JSON.stringify(customerError, null, 2));
    return { customer_id: null, first_name: null, last_name: null, address: null, error: `Failed to fetch customer details. Supabase error: ${customerError?.message}` };
  }
  const { id: customerId, first_name, last_name } = customerData;
  console.log('[getCustomerDetailsForCheckout] Found customer:', customerId, 'Name:', first_name, last_name);

  // 2. Get address with phone number from addresses table
  //    Assuming the user might have multiple addresses, we'll try to find one with a phone number.
  //    For simplicity, we take the first one found. Ideally, there'd be a "default" or "primary" address.
  const { data: addressesData, error: addressesError } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId)
    .not('phone_number', 'is', null) // Ensure phone_number is not null
    // .is('is_default', true) // Ideally, you'd have a default address flag
    .limit(1); // Or order by a preference/date and pick the most relevant

  if (addressesError) {
    console.error('[getCustomerDetailsForCheckout] Error fetching addresses for customerId:', customerId, 'Error:', JSON.stringify(addressesError, null, 2));
    return { customer_id: customerId, first_name, last_name, address: null, error: `Failed to fetch address details. Supabase error: ${addressesError?.message}` };
  }

  const address = (addressesData && addressesData.length > 0) ? addressesData[0] as AddressWithPhone : null;

  return { customer_id: customerId, first_name, last_name, address, error: null };
}

interface OrderCreationParams {
  customerId: string;
  shippingAddressId: string;
  items: CartItem[];
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string; // e.g., 'Cash on Delivery'
}

export async function createOrder(params: OrderCreationParams): Promise<{ orderId: string | null; error: string | null }> {
  // const cookieStore = cookies(); // createClientServer handles cookies internally
  const supabase = await createClientServer();
    const { customerId, shippingAddressId, items, totalAmount, deliveryFee, paymentMethod } = params;

  // 1. Create the order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      shipping_address_id: shippingAddressId,
      total_amount: totalAmount + deliveryFee, // Total including delivery
      delivery_fee: deliveryFee,
      payment_method: paymentMethod,
      status: 'Pending Confirmation', // Initial status
      order_date: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (orderError || !orderData) {
    console.error('Error creating order:', orderError);
    return { orderId: null, error: 'Failed to create order.' };
  }
  const orderId = orderData.id;

  // 2. Create order items
  const orderItemsData = items.map(item => ({
    order_id: orderId,
    product_id: item.product?.id,
    quantity: item.quantity,
    price: item.product?.price, // Price at the time of order
  }));

  const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsData);

  if (orderItemsError) {
    console.error('Error creating order items:', orderItemsError);
    // Potentially roll back order creation or mark as failed
    await supabase.from('orders').delete().eq('id', orderId); // Basic rollback
    return { orderId: null, error: 'Failed to create order items.' };
  }
  
  // 3. Clear the user's cart (optional, but good practice)
  // Assuming cart items are linked to customer_id or a cart_id associated with the session
  // For simplicity, let's assume cart items are identified by customer_id in a 'cart_items' table
  // This part needs to be adapted based on your actual cart table structure.
  // If cart items are stored in a 'carts' table with a 'customer_id'
  const { data: cartData, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('customer_id', customerId)
    .single();

  if (cartData && !cartError) {
    const { error: deleteCartItemsError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartData.id);
    if (deleteCartItemsError) {
      console.error('Error clearing cart items after order:', deleteCartItemsError);
      // Not a fatal error for order creation, but log it.
    }
  } else if (cartError && cartError.code !== 'PGRST116') { // PGRST116: 0 rows
      console.error('Error finding cart to clear:', cartError);
  }


  return { orderId, error: null };
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; error: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[deleteOrder] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
    return { success: false, error: 'Server configuration error.' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`[deleteOrder] Attempting to delete order: ${orderId}`);

  try {
    // First, delete related records from the 'order_items' table
    const { error: deleteItemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (deleteItemsError) {
      console.error(`[deleteOrder] Error deleting order items for order ${orderId}:`, deleteItemsError);
      return { success: false, error: `Failed to delete order items: ${deleteItemsError.message}` };
    }
    console.log(`[deleteOrder] Successfully deleted order items for order ${orderId}.`);

    // Then, delete related records from the 'payments' table
    const { error: deletePaymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('order_id', orderId);

    if (deletePaymentsError) {
      console.error(`[deleteOrder] Error deleting payments for order ${orderId}:`, deletePaymentsError);
      return { success: false, error: `Failed to delete payments: ${deletePaymentsError.message}` };
    }

    // Finally, delete the order from the 'orders' table
    const { error: deleteOrderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (deleteOrderError) {
      console.error(`[deleteOrder] Error deleting order ${orderId}:`, deleteOrderError);
      return { success: false, error: `Failed to delete order: ${deleteOrderError.message}` };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error(`[deleteOrder] Unexpected error deleting order ${orderId}:`, error);
    return { success: false, error: `Unexpected error deleting order: ${error.message}` };
  }
}
