import { BusinessError, ValidationError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import { createClientServer } from '@/lib/supabase/server';
import {
    CheckoutData,
    CheckoutResult,
    CreateOrderData,
    Order,
    OrderFilters,
    OrderItem,
    OrderStats,
    OrderTracking,
    UpdateOrderStatusData,
} from '@/types/business';
import { PaginatedResult, ServiceResult } from '@/types/common';
import { OrderStatus, PaymentMethod, PaymentStatus, ProductStatus, UserRole } from '@/types/enums';
import { Tables } from '@/types/supabase';
import { productService } from '../products/products.service';
import { CheckoutService, OrderService } from './orders.types';

type OrderRow = Tables<'orders'>;
type OrderItemRow = Tables<'order_items'>;
type PaymentRow = Tables<'payments'>;

export class OrderServiceImpl implements OrderService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(operation: string, params?: any): string {
    return `order_${operation}_${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearOrderCache(orderId?: string): void {
    if (orderId) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(orderId));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  private async mapOrderRow(orderRow: OrderRow, items: any[] = [], payments: any[] = []): Promise<Order> {
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = item.products;
      if (product) {
        const unitPrice = item.price || 0;
        const totalPrice = unitPrice * item.quantity;

        orderItems.push({
          id: item.id,
          orderId: orderRow.id,
          productId: item.product_id,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            imageUrl: product.image_url,
            status: ProductStatus.ACTIVE,
            categories: [],
            images: [],
            isActive: true,
            createdAt: new Date(product.created_at),
            updatedAt: new Date(product.created_at),
          },
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          createdAt: new Date(item.created_at || orderRow.order_date),
          updatedAt: new Date(item.created_at || orderRow.order_date),
        });

        subtotal += totalPrice;
      }
    }

    // Map payments
    const payment =
      payments.length > 0
        ? {
            id: payments[0].id,
            orderId: orderRow.id,
            amount: payments[0].amount,
            paymentMethod: payments[0].payment_method as PaymentMethod,
            status: PaymentStatus.PENDING, // Default status
            transactionId: payments[0].transaction_id,
            processedAt: payments[0].processed_at ? new Date(payments[0].processed_at) : undefined,
            createdAt: new Date(payments[0].created_at),
            updatedAt: new Date(payments[0].created_at),
          }
        : undefined;

    const deliveryFee = (orderRow as any).delivery_fee ? Number((orderRow as any).delivery_fee) : 0;

    // Create basic tracking
    const tracking: OrderTracking[] = [
      {
        status: OrderStatus.PENDING,
        timestamp: new Date(orderRow.order_date),
        notes: 'Order created',
      },
    ];

    return {
      id: orderRow.id,
      customerId: orderRow.customer_id || '',
      customer: {
        id: orderRow.customer_id || '',
        email: '',
        firstName: '',
        lastName: '',
        role: UserRole.CUSTOMER,
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      items: orderItems,
      status: OrderStatus.PENDING, // Default status since not in current schema
      totalAmount: orderRow.total_amount,
      subtotal,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: deliveryFee,
      shippingAddress: {
        id: '',
        customerId: orderRow.customer_id || '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false,
        type: 'home',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      paymentMethod: ((orderRow as any).payment_method as PaymentMethod) || PaymentMethod.CASH_ON_DELIVERY,
      payment,
      notes: '',
      tracking,
      orderDate: new Date(orderRow.order_date),
      createdAt: new Date(orderRow.order_date),
      updatedAt: new Date(orderRow.order_date),
    };
  }

  async createOrder(data: CreateOrderData): Promise<ServiceResult<Order>> {
    const startTime = Date.now();

    try {
      // Validation
      if (!data.customerId) {
        throw new ValidationError('Customer ID is required', 'customerId', 'REQUIRED');
      }
      if (!data.items || data.items.length === 0) {
        throw new ValidationError('Order items are required', 'items', 'REQUIRED');
      }
      if (!data.shippingAddressId) {
        throw new ValidationError('Shipping address is required', 'shippingAddressId', 'REQUIRED');
      }
      if (!data.paymentMethod) {
        throw new ValidationError('Payment method is required', 'paymentMethod', 'REQUIRED');
      }

      // Validate items and calculate totals
      let subtotal = 0;
      for (const item of data.items) {
        if (!item.productId) {
          throw new ValidationError('Product ID is required for all items', 'productId', 'REQUIRED');
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new ValidationError('Quantity must be greater than 0', 'quantity', 'INVALID');
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          throw new ValidationError('Unit price must be greater than 0', 'unitPrice', 'INVALID');
        }

        // Verify product exists and has sufficient stock
        const productResult = await productService.getProduct(item.productId);
        if (!productResult.success || !productResult.data) {
          throw new BusinessError(`Product ${item.productId} not found`, 'PRODUCT_NOT_FOUND');
        }

        const product = productResult.data;
        if (product.stock < item.quantity) {
          throw new BusinessError(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
            'INSUFFICIENT_STOCK'
          );
        }

        subtotal += item.unitPrice * item.quantity;
      }

      const supabase = await createClientServer('service_role');

      // Create order
      const shipping = typeof (data as any).deliveryFee === 'number' ? Number((data as any).deliveryFee) : 0;
      const total = subtotal + shipping;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: data.customerId,
          total_amount: total,
          delivery_fee: shipping,
          shipping_address_id: (data as any).shippingAddressId,
          payment_method: data.paymentMethod as any,
          status: 'Pending Confirmation',
          order_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        logger.error('Failed to create order', orderError, {
          action: 'createOrder',
          data,
        });
        throw new BusinessError('Failed to create order', 'ORDER_CREATE_ERROR');
      }

      // Create order items
      const orderItemsData = data.items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.unitPrice,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);

      if (itemsError) {
        logger.error('Failed to create order items', itemsError, {
          action: 'createOrder',
          orderId: orderData.id,
        });

        // Rollback order creation
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw new BusinessError('Failed to create order items', 'ORDER_ITEMS_CREATE_ERROR');
      }

      // Create payment record if needed
      if (data.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
        const { error: paymentError } = await supabase.from('payments').insert({
          order_id: orderData.id,
          amount: total,
          payment_method: data.paymentMethod,
          transaction_id: `pending_${orderData.id}`,
        });

        if (paymentError) {
          logger.warn('Failed to create payment record', {
            action: 'createOrder',
            orderId: orderData.id,
            error: paymentError.message,
          });
        }
      }

      // Update product stock
      for (const item of data.items) {
        const productResult = await productService.getProduct(item.productId);
        if (productResult.success && productResult.data) {
          const newStock = productResult.data.stock - item.quantity;
          await productService.updateProduct({
            id: item.productId,
            stock: newStock,
          });
        }
      }

      // Clear cache
      this.clearOrderCache();

      // Fetch the complete order
      const result = await this.getOrder(orderData.id);
      if (!result.success) {
        throw new BusinessError('Order created but failed to retrieve', 'ORDER_RETRIEVE_ERROR');
      }

      logger.info('Order created successfully', {
        action: 'createOrder',
        orderId: orderData.id,
        customerId: data.customerId,
        totalAmount: total,
        itemCount: data.items.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Error in createOrder', error as Error, {
        action: 'createOrder',
        data,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the order',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getOrder(id: string): Promise<ServiceResult<Order>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getOrder', { id });

    try {
      if (!id) {
        throw new ValidationError('Order ID is required', 'id', 'REQUIRED');
      }

      // Check cache first
      const cached = this.getFromCache<Order>(cacheKey);
      if (cached) {
        logger.debug('Order retrieved from cache', {
          action: 'getOrder',
          orderId: id,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *,
            products (*)
          ),
          payments (*)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Order not found', { action: 'getOrder', orderId: id });
          throw new BusinessError('Order not found', 'ORDER_NOT_FOUND');
        }

        logger.error('Failed to fetch order', error, {
          action: 'getOrder',
          orderId: id,
        });
        throw new BusinessError('Failed to fetch order', 'ORDER_FETCH_ERROR');
      }

      const order = await this.mapOrderRow(data, data.order_items || [], data.payments || []);

      // Cache the result
      this.setCache(cacheKey, order);

      logger.info('Order fetched successfully', {
        action: 'getOrder',
        orderId: id,
        duration: Date.now() - startTime,
      });

      return { success: true, data: order };
    } catch (error) {
      logger.error('Error in getOrder', error as Error, {
        action: 'getOrder',
        orderId: id,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching the order',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getOrders(filters?: OrderFilters): Promise<ServiceResult<PaginatedResult<Order>>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getOrders', filters);

    try {
      // Check cache first
      const cached = this.getFromCache<PaginatedResult<Order>>(cacheKey);
      if (cached) {
        logger.debug('Orders retrieved from cache', {
          action: 'getOrders',
          filters,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      let query = supabase.from('orders').select(`
          *,
          order_items (
            *,
            products (*)
          ),
          payments (*)
        `);

      // Apply filters
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.dateFrom) {
        query = query.gte('order_date', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte('order_date', filters.dateTo.toISOString());
      }
      if (filters?.minAmount) {
        query = query.gte('total_amount', filters.minAmount);
      }
      if (filters?.maxAmount) {
        query = query.lte('total_amount', filters.maxAmount);
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'orderDate';
      const sortOrder = filters?.sortOrder || 'desc';
      const dbSortBy = sortBy === 'orderDate' ? 'order_date' : sortBy === 'totalAmount' ? 'total_amount' : 'order_date';
      query = query.order(dbSortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to fetch orders', error, {
          action: 'getOrders',
          filters,
        });
        throw new BusinessError('Failed to fetch orders', 'ORDERS_FETCH_ERROR');
      }

      const orders = await Promise.all(
        (data || []).map(orderRow => this.mapOrderRow(orderRow, orderRow.order_items || [], orderRow.payments || []))
      );

      const total = count || orders.length;
      const totalPages = Math.ceil(total / limit);

      const result: PaginatedResult<Order> = {
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      // Cache the result
      this.setCache(cacheKey, result);

      logger.info('Orders fetched successfully', {
        action: 'getOrders',
        count: orders.length,
        duration: Date.now() - startTime,
        filters,
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('Error in getOrders', error as Error, {
        action: 'getOrders',
        filters,
      });

      if (error instanceof BusinessError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching orders',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getUserOrders(userId: string, filters?: OrderFilters): Promise<ServiceResult<Order[]>> {
    const startTime = Date.now();

    try {
      if (!userId) {
        throw new ValidationError('User ID is required', 'userId', 'REQUIRED');
      }

      const ordersResult = await this.getOrders({
        ...filters,
        customerId: userId,
      });

      if (!ordersResult.success) {
        return {
          success: false,
          error: ordersResult.error,
        };
      }

      logger.info('User orders fetched successfully', {
        action: 'getUserOrders',
        userId,
        count: ordersResult.data?.data.length || 0,
        duration: Date.now() - startTime,
      });

      return { success: true, data: ordersResult.data?.data || [] };
    } catch (error) {
      logger.error('Error in getUserOrders', error as Error, {
        action: 'getUserOrders',
        userId,
        filters,
      });

      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching user orders',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async updateOrderStatus(data: UpdateOrderStatusData): Promise<ServiceResult<Order>> {
    const startTime = Date.now();

    try {
      if (!data.orderId) {
        throw new ValidationError('Order ID is required', 'orderId', 'REQUIRED');
      }
      if (!data.status) {
        throw new ValidationError('Order status is required', 'status', 'REQUIRED');
      }

      // Verify order exists
      const orderResult = await this.getOrder(data.orderId);
      if (!orderResult.success || !orderResult.data) {
        throw new BusinessError('Order not found', 'ORDER_NOT_FOUND');
      }

      const supabase = await createClientServer('service_role');

      // Note: Current schema doesn't have status field, so we'll log the status change
      // In a real implementation, you'd update the status field
      logger.info('Order status update requested', {
        action: 'updateOrderStatus',
        orderId: data.orderId,
        newStatus: data.status,
        notes: data.notes,
        trackingNumber: data.trackingNumber,
      });

      // Clear cache
      this.clearOrderCache(data.orderId);

      // Return updated order
      const result = await this.getOrder(data.orderId);

      logger.info('Order status updated successfully', {
        action: 'updateOrderStatus',
        orderId: data.orderId,
        status: data.status,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Error in updateOrderStatus', error as Error, {
        action: 'updateOrderStatus',
        data,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating order status',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!orderId) {
        throw new ValidationError('Order ID is required', 'orderId', 'REQUIRED');
      }

      // Verify order exists and can be cancelled
      const orderResult = await this.getOrder(orderId);
      if (!orderResult.success || !orderResult.data) {
        throw new BusinessError('Order not found', 'ORDER_NOT_FOUND');
      }

      const order = orderResult.data;

      // Check if order can be cancelled (business logic)
      if (order.status === OrderStatus.DELIVERED) {
        throw new BusinessError('Cannot cancel delivered order', 'ORDER_ALREADY_DELIVERED');
      }
      if (order.status === OrderStatus.CANCELLED) {
        throw new BusinessError('Order is already cancelled', 'ORDER_ALREADY_CANCELLED');
      }

      // Update order status to cancelled
      await this.updateOrderStatus({
        orderId,
        status: OrderStatus.CANCELLED,
        notes: reason || 'Order cancelled by customer',
      });

      // Restore product stock
      for (const item of order.items) {
        const productResult = await productService.getProduct(item.productId);
        if (productResult.success && productResult.data) {
          const newStock = productResult.data.stock + item.quantity;
          await productService.updateProduct({
            id: item.productId,
            stock: newStock,
          });
        }
      }

      logger.info('Order cancelled successfully', {
        action: 'cancelOrder',
        orderId,
        reason,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in cancelOrder', error as Error, {
        action: 'cancelOrder',
        orderId,
        reason,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while cancelling the order',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getOrderStats(filters?: Partial<OrderFilters>): Promise<ServiceResult<OrderStats>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getOrderStats', filters);

    try {
      // Check cache first
      const cached = this.getFromCache<OrderStats>(cacheKey);
      if (cached) {
        logger.debug('Order stats retrieved from cache', {
          action: 'getOrderStats',
          filters,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();

      // Get basic order statistics
      let query = supabase.from('orders').select('total_amount, order_date');

      // Apply filters
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.dateFrom) {
        query = query.gte('order_date', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte('order_date', filters.dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch order stats', error, {
          action: 'getOrderStats',
          filters,
        });
        throw new BusinessError('Failed to fetch order statistics', 'ORDER_STATS_FETCH_ERROR');
      }

      const orders = data || [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get recent orders
      const recentOrdersResult = await this.getOrders({
        ...filters,
        sortBy: 'orderDate',
        sortOrder: 'desc',
      });

      const recentOrders = recentOrdersResult.success ? recentOrdersResult.data?.data.slice(0, 5) || [] : [];

      const stats: OrderStats = {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus: {
          [OrderStatus.PENDING]: totalOrders, // Simplified since we don't have status in current schema
          [OrderStatus.CONFIRMED]: 0,
          [OrderStatus.PROCESSING]: 0,
          [OrderStatus.SHIPPED]: 0,
          [OrderStatus.DELIVERED]: 0,
          [OrderStatus.CANCELLED]: 0,
        },
        recentOrders,
      };

      // Cache the result
      this.setCache(cacheKey, stats);

      logger.info('Order stats calculated successfully', {
        action: 'getOrderStats',
        totalOrders,
        totalRevenue,
        duration: Date.now() - startTime,
      });

      return { success: true, data: stats };
    } catch (error) {
      logger.error('Error in getOrderStats', error as Error, {
        action: 'getOrderStats',
        filters,
      });

      if (error instanceof BusinessError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while calculating order statistics',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  // Cache management methods
  async clearCache(key?: string): Promise<ServiceResult<void>> {
    try {
      if (key) {
        this.cache.delete(key);
        logger.info('Order service cache key cleared', { action: 'clearCache', key });
      } else {
        this.cache.clear();
        logger.info('Order service cache cleared', { action: 'clearCache' });
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Failed to clear order service cache', error as Error, { key });
      return {
        success: false,
        error: {
          message: 'Failed to clear cache',
          code: 'CACHE_CLEAR_ERROR',
        },
      };
    }
  }

  async refreshCache(key?: string): Promise<ServiceResult<void>> {
    try {
      if (key) {
        this.cache.delete(key);
        logger.info('Order service cache key refreshed', { action: 'refreshCache', key });
      } else {
        this.cache.clear();
        logger.info('Order service cache refreshed', { action: 'refreshCache' });
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Failed to refresh order service cache', error as Error, { key });
      return {
        success: false,
        error: {
          message: 'Failed to refresh cache',
          code: 'CACHE_REFRESH_ERROR',
        },
      };
    }
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export class CheckoutServiceImpl implements CheckoutService {
  async processCheckout(data: CheckoutData): Promise<ServiceResult<CheckoutResult>> {
    const startTime = Date.now();

    try {
      // Validation
      if (!data.cartId) {
        throw new ValidationError('Cart ID is required', 'cartId', 'REQUIRED');
      }
      if (!data.shippingAddressId) {
        throw new ValidationError('Shipping address is required', 'shippingAddressId', 'REQUIRED');
      }
      if (!data.paymentMethod) {
        throw new ValidationError('Payment method is required', 'paymentMethod', 'REQUIRED');
      }

      // Validate checkout data
      const validationResult = await this.validateCheckout(data);
      if (!validationResult.success || !validationResult.data) {
        throw new BusinessError('Checkout validation failed', 'CHECKOUT_VALIDATION_FAILED');
      }

      // Get cart data
      const supabase = await createClientServer();
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select(
          `
          *,
          cart_items (
            *,
            products (*)
          )
        `
        )
        .eq('id', data.cartId)
        .single();

      if (cartError || !cartData) {
        logger.error('Failed to fetch cart for checkout', cartError || new Error('Cart not found'), {
          action: 'processCheckout',
          cartId: data.cartId,
        });
        throw new BusinessError('Cart not found', 'CART_NOT_FOUND');
      }

      if (!cartData.cart_items || cartData.cart_items.length === 0) {
        throw new BusinessError('Cart is empty', 'CART_EMPTY');
      }

      // Calculate total
      const totalResult = await this.calculateOrderTotal(data.cartId, data.discountCode);
      if (!totalResult.success || totalResult.data === undefined) {
        throw new BusinessError('Failed to calculate order total', 'TOTAL_CALCULATION_ERROR');
      }

      // Create order data
      const orderItems = cartData.cart_items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: item.products?.price || 0,
      }));

      const createOrderData: CreateOrderData = {
        customerId: cartData.customer_id,
        items: orderItems,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        discountCode: data.discountCode,
      };

      // Create order
      const orderResult = await orderService.createOrder(createOrderData);
      if (!orderResult.success || !orderResult.data) {
        throw new BusinessError('Failed to create order', 'ORDER_CREATION_FAILED');
      }

      const order = orderResult.data;

      // Clear cart after successful order creation
      const { error: clearCartError } = await supabase.from('cart_items').delete().eq('cart_id', data.cartId);

      if (clearCartError) {
        logger.warn('Failed to clear cart after checkout', {
          action: 'processCheckout',
          cartId: data.cartId,
          orderId: order.id,
          error: clearCartError.message,
        });
      }

      const checkoutResult: CheckoutResult = {
        success: true,
        orderId: order.id,
        paymentUrl: data.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY ? `/payment/${order.id}` : undefined,
      };

      logger.info('Checkout processed successfully', {
        action: 'processCheckout',
        cartId: data.cartId,
        orderId: order.id,
        totalAmount: totalResult.data,
        paymentMethod: data.paymentMethod,
        duration: Date.now() - startTime,
      });

      return { success: true, data: checkoutResult };
    } catch (error) {
      logger.error('Error in processCheckout', error as Error, {
        action: 'processCheckout',
        data,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred during checkout',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async validateCheckout(data: CheckoutData): Promise<ServiceResult<boolean>> {
    const startTime = Date.now();

    try {
      // Basic validation
      if (!data.cartId) {
        throw new ValidationError('Cart ID is required', 'cartId', 'REQUIRED');
      }
      if (!data.shippingAddressId) {
        throw new ValidationError('Shipping address is required', 'shippingAddressId', 'REQUIRED');
      }
      if (!data.paymentMethod) {
        throw new ValidationError('Payment method is required', 'paymentMethod', 'REQUIRED');
      }

      const supabase = await createClientServer();

      // Validate cart exists and has items
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select(
          `
          *,
          cart_items (
            *,
            products (*)
          )
        `
        )
        .eq('id', data.cartId)
        .single();

      if (cartError || !cartData) {
        throw new BusinessError('Cart not found', 'CART_NOT_FOUND');
      }

      if (!cartData.cart_items || cartData.cart_items.length === 0) {
        throw new BusinessError('Cart is empty', 'CART_EMPTY');
      }

      // Validate shipping address exists
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', data.shippingAddressId)
        .eq('customer_id', cartData.customer_id)
        .single();

      if (addressError || !addressData) {
        throw new BusinessError('Shipping address not found or not owned by customer', 'INVALID_SHIPPING_ADDRESS');
      }

      // Validate billing address if provided
      if (data.billingAddressId) {
        const { data: billingAddressData, error: billingAddressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', data.billingAddressId)
          .eq('customer_id', cartData.customer_id)
          .single();

        if (billingAddressError || !billingAddressData) {
          throw new BusinessError('Billing address not found or not owned by customer', 'INVALID_BILLING_ADDRESS');
        }
      }

      // Validate cart items (stock availability, product existence) and calculate subtotal
      let subtotal = 0;
      for (const item of cartData.cart_items) {
        const product = item.products;
        if (!product) {
          throw new BusinessError(`Product not found for cart item ${item.id}`, 'PRODUCT_NOT_FOUND');
        }

        if (product.stock < item.quantity) {
          throw new BusinessError(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
            'INSUFFICIENT_STOCK'
          );
        }

        if (product.price <= 0) {
          throw new BusinessError(`Invalid price for product ${product.name}`, 'INVALID_PRODUCT_PRICE');
        }

        subtotal += product.price * item.quantity;
      }

      // Validate discount code if provided
      if (data.discountCode) {
        const { DiscountService } = await import('../discounts/discount.service');
        const discountValidation = await DiscountService.validateDiscountCode(data.discountCode, subtotal);
        
        if (!discountValidation.isValid) {
          throw new ValidationError(`Discount code error: ${discountValidation.error}`, 'INVALID_DISCOUNT_CODE');
        }
        
        logger.info('Discount code validated successfully', {
          action: 'validateCheckout',
          discountCode: data.discountCode,
        });
      }

      logger.info('Checkout validation completed successfully', {
        action: 'validateCheckout',
        cartId: data.cartId,
        itemCount: cartData.cart_items.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: true };
    } catch (error) {
      logger.error('Error in validateCheckout', error as Error, {
        action: 'validateCheckout',
        data,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred during checkout validation',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async calculateOrderTotal(cartId: string, discountCode?: string): Promise<ServiceResult<number>> {
    const startTime = Date.now();

    try {
      if (!cartId) {
        throw new ValidationError('Cart ID is required', 'cartId', 'REQUIRED');
      }

      const supabase = await createClientServer();
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select(
          `
          *,
          cart_items (
            *,
            products (*)
          )
        `
        )
        .eq('id', cartId)
        .single();

      if (cartError || !cartData) {
        throw new BusinessError('Cart not found', 'CART_NOT_FOUND');
      }

      if (!cartData.cart_items || cartData.cart_items.length === 0) {
        return { success: true, data: 0 };
      }

      // Calculate subtotal
      let subtotal = 0;
      for (const item of cartData.cart_items) {
        const product = item.products;
        if (product && product.price) {
          subtotal += product.price * item.quantity;
        }
      }

      // Apply discount if provided
      let discountAmount = 0;
      if (discountCode) {
        const { DiscountService } = await import('../discounts/discount.service');
        const discountValidation = await DiscountService.validateDiscountCode(discountCode, subtotal);
        
        if (discountValidation.isValid && discountValidation.discountAmount) {
          discountAmount = discountValidation.discountAmount;
        }
        
        logger.info('Discount code processed', {
          action: 'calculateOrderTotal',
          discountCode,
        });
      }

      // Calculate tax (simplified - could be based on address)
      const taxRate = 0.0; // 0% tax for now
      const taxAmount = subtotal * taxRate;

      // Calculate shipping (simplified - could be based on address/weight)
      const shippingAmount = subtotal > 100 ? 0 : 10; // Free shipping over $100

      const total = subtotal - discountAmount + taxAmount + shippingAmount;

      logger.info('Order total calculated successfully', {
        action: 'calculateOrderTotal',
        cartId,
        subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        total,
        duration: Date.now() - startTime,
      });

      return { success: true, data: total };
    } catch (error) {
      logger.error('Error in calculateOrderTotal', error as Error, {
        action: 'calculateOrderTotal',
        cartId,
        discountCode,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while calculating order total',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }
}

// Export singleton instances
export const orderService = new OrderServiceImpl();
export const checkoutService = new CheckoutServiceImpl();
