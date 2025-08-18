'use server';

import { orderService } from '@/services/orders/orders.service';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { createClientServer } from '@/lib/supabase/server';
import { getCartItems } from '@/actions/cartActions';

// Create order function
export async function createOrder(orderData: any) {
  try {
    const result = await orderService.createOrder(orderData);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('Error in createOrder action', error as Error);
    return { success: false, error: 'Failed to create order' };
  }
}

// Get customer details for checkout
export async function getCustomerDetailsForCheckout(customerId: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) {
      logger.error('Error fetching customer details', customerError);
      return { success: false, error: 'Failed to fetch customer details' };
    }

    // Get customer address
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (addressError && addressError.code !== 'PGRST116') {
      logger.error('Error fetching customer address', addressError);
      return { success: false, error: 'Failed to fetch customer address' };
    }

    return {
      success: true,
      data: {
        customer,
        address
      }
    };
  } catch (error) {
    logger.error('Error in getCustomerDetailsForCheckout action', error as Error);
    return { success: false, error: 'Failed to get customer details' };
  }
}

// Create order with payment method
export async function createOrderWithPaymentMethod(_: any, paymentMethod: string) {
  try {
    // Build trusted order data on the server from the authenticated user's cart and address
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Load cart items from server action
    const cart = await getCartItems();
    const items = (cart.items || []).filter((i: any) => i.product);
    if (!items || items.length === 0) {
      return { success: false, error: 'سلة التسوق فارغة' };
    }
    const shipping = Number(cart.shipping || 0);

    // Fetch customer's default/shipping address
    const { data: address, error: addrErr } = await supabase
      .from('addresses')
      .select('id, address_line_1, city, phone_number')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (addrErr) {
      logger.error('Error fetching address for checkout', addrErr);
      return { success: false, error: 'فشل في جلب عنوان التوصيل' };
    }

    if (!address?.id || !address.address_line_1 || !address.city || !address.phone_number) {
      return { success: false, error: 'يرجى استكمال بيانات التوصيل: العنوان، المدينة، رقم الهاتف' };
    }

    // Map items to CreateOrderItemData
    const orderItems = items.map((it: any) => ({
      productId: it.product.id,
      quantity: it.quantity,
      unitPrice: it.product.price ?? 0,
    }));

    const createData: any = {
      customerId: user.id,
      items: orderItems,
      shippingAddressId: address.id,
      paymentMethod: paymentMethod as any,
      deliveryFee: shipping,
      notes: undefined,
    };

    const result = await orderService.createOrder(createData);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('Error in createOrderWithPaymentMethod action', error as Error);
    return { success: false, error: 'Failed to create order with payment method' };
  }
}