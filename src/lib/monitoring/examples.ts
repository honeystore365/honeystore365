// Examples of how to use the monitoring system

import { logBusinessEvent, logError } from '@/lib/logger';
import {
    metricsCollector,
    performanceMonitor,
    sentryService,
    withDatabaseMonitoring
} from '@/lib/monitoring';

// Example 1: Monitoring a Server Action
export async function createOrderAction(orderData: any) {
  const timingId = performanceMonitor.startTiming('create_order');
  
  try {
    // Set user context for Sentry (disabled)
    if (orderData.userId && sentryService?.setUser) {
      sentryService.setUser({
        id: orderData.userId,
        email: orderData.userEmail,
      });
    }

    // Add breadcrumb for context (disabled since sentryService is null)
    // sentryService.addBreadcrumb('Starting order creation');

    // Simulate database operation with monitoring
    const createOrder = withDatabaseMonitoring(
      async (data: any) => {
        // Simulate database call
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: 'order_123', ...data };
      },
      'create_order_query'
    );

    const order = await createOrder(orderData);

    // Record business metrics
    metricsCollector.recordOrderEvent(
      'order_created',
      order.id,
      orderData.totalAmount,
      {
        userId: orderData.userId,
        itemCount: orderData.items?.length,
        paymentMethod: orderData.paymentMethod,
      }
    );

    // Log business event
    logBusinessEvent('order_created', {
      orderId: order.id,
      totalAmount: orderData.totalAmount,
      userId: orderData.userId,
    });

    performanceMonitor.endTiming(timingId);

    return { success: true, order };

  } catch (error) {
    performanceMonitor.endTiming(timingId);
    
    // Record error metrics
    metricsCollector.recordErrorMetric(
      'order_creation_failed',
      (error as Error).message,
      'order_service',
      {
        userId: orderData.userId,
        totalAmount: orderData.totalAmount,
      }
    );

    // Log error with context
    logError('Failed to create order', error as Error, {
      userId: orderData.userId,
      orderId: orderData.id,
      action: 'create_order',
    });

    throw error;
  }
}

// Example 2: Monitoring API performance
export async function fetchProductsWithMonitoring(filters: any) {
  const startTime = performance.now();
  
  try {
    // Simulate API call
    const response = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(filters),
    });

    const duration = performance.now() - startTime;
    
    // Monitor API call
    performanceMonitor.monitorApiCall(
      '/api/products',
      'POST',
      response.status,
      duration,
      {
        filters: Object.keys(filters).length,
        cached: response.headers.get('x-cache') === 'HIT',
      }
    );

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const products = await response.json();

    // Record product metrics
    metricsCollector.recordProductEvent(
      'product_search',
      undefined,
      filters.query,
      {
        resultsCount: products.length,
        filters,
        duration,
      }
    );

    return products;

  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Record API error
    metricsCollector.recordErrorMetric(
      'api_error',
      (error as Error).message,
      'products_api',
      {
        endpoint: '/api/products',
        duration,
        filters,
      }
    );

    throw error;
  }
}

// Example 3: Using decorators for automatic monitoring
// TODO: Implement decorators when needed
class OrderService {
  // @trackBusinessEvent('order_processing')
  // @trackUserAction('process_order', 'business')
  async processOrder(orderId: string, userId: string) {
    // Add context to Sentry (disabled)
    if (sentryService?.setContext) {
      sentryService.setContext('order_processing', {
        orderId,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Record funnel step
    metricsCollector.recordFunnelStep(
      'order_fulfillment',
      'processing',
      userId,
      { orderId }
    );

    return { orderId, status: 'processed' };
  }

  async handlePayment(orderId: string, amount: number) {
    const timingId = performanceMonitor.startTiming('payment_processing');
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Record successful payment
      metricsCollector.recordOrderEvent(
        'order_completed',
        orderId,
        amount,
        {
          paymentMethod: 'credit_card',
          processingTime: performanceMonitor.endTiming(timingId),
        }
      );

      // Capture business event (disabled)
      // sentryService.captureBusinessEvent('payment_completed', { ... });

      return { success: true };

    } catch (error) {
      performanceMonitor.endTiming(timingId);

      // Record payment failure
      metricsCollector.recordOrderEvent(
        'payment_failed',
        orderId,
        amount,
        {
          error: (error as Error).message,
          paymentMethod: 'credit_card',
        }
      );

      // Capture error with high severity (disabled)
      if (sentryService?.captureError) {
        sentryService.captureError(error as Error);
      }

      throw error;
    }
  }
}

// Example 4: Monitoring user authentication
export async function authenticateUser(email: string, password: string) {
  const timingId = performanceMonitor.startTiming('user_authentication');
  
  try {
    // Add security context (disabled)
    if (sentryService?.setContext) {
      sentryService.setContext('authentication', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      });
    }

    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 150));

    const user = { id: 'user_123', email };

    // Record successful login
    metricsCollector.recordUserEvent(
      'user_login',
      user.id,
      {
        method: 'email_password',
        duration: performanceMonitor.endTiming(timingId),
      }
    );

    // Set user context in Sentry (disabled)
    if (sentryService?.setUser) {
      sentryService.setUser({
        id: user.id,
        email: user.email,
      });
    }

    return { success: true, user };

  } catch (error) {
    performanceMonitor.endTiming(timingId);

    // Record failed login attempt
    metricsCollector.recordMetric(
      'security.login_failed',
      1,
      {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error_type: 'authentication_failed',
      },
      {
        error: (error as Error).message,
      }
    );

    // Capture security event (disabled)
    // sentryService.captureSecurityEvent('authentication_failure', 'medium', ...);

    throw error;
  }
}

// Example 5: Monitoring cart operations
export async function addToCartWithMonitoring(
  productId: string,
  quantity: number,
  userId?: string
) {
  try {
    // Record cart event
    metricsCollector.recordCartEvent(
      'add_to_cart',
      productId,
      quantity,
      undefined,
      {
        userId,
        timestamp: new Date().toISOString(),
      }
    );

    // Add breadcrumb (disabled)
    if (sentryService?.addBreadcrumb) {
      sentryService.addBreadcrumb('Item added to cart');
    }

    // Simulate cart operation
    await new Promise(resolve => setTimeout(resolve, 50));

    // Record funnel step
    if (userId) {
      metricsCollector.recordFunnelStep(
        'purchase_funnel',
        'add_to_cart',
        userId,
        { productId, quantity }
      );
    }

    return { success: true };

  } catch (error) {
    // Record cart error
    metricsCollector.recordErrorMetric(
      'cart_operation_failed',
      (error as Error).message,
      'cart_service',
      {
        operation: 'add_to_cart',
        productId,
        quantity,
        userId,
      }
    );

    throw error;
  }
}

// Example 6: Performance monitoring for database queries
export const monitoredDatabaseOperations = {
  // Wrap database operations with monitoring
  getProducts: withDatabaseMonitoring(
    async (filters: any) => {
      // Simulate database query
      await new Promise(resolve => setTimeout(resolve, 80));
      return [{ id: '1', name: 'Product 1' }];
    },
    'get_products'
  ),

  createUser: withDatabaseMonitoring(
    async (userData: any) => {
      // Simulate user creation
      await new Promise(resolve => setTimeout(resolve, 120));
      return { id: 'user_123', ...userData };
    },
    'create_user'
  ),

  updateOrder: withDatabaseMonitoring(
    async (orderId: string, updates: any) => {
      // Simulate order update
      await new Promise(resolve => setTimeout(resolve, 60));
      return { id: orderId, ...updates };
    },
    'update_order'
  ),
};

// Example 7: Error boundary with monitoring
export function withErrorMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Capture error with context (disabled)
      if (sentryService?.captureError) {
        sentryService.captureError(error as Error);
      }

      // Record error metric
      metricsCollector.recordErrorMetric(
        'function_error',
        (error as Error).message,
        context,
        {
          function: fn.name,
          argsCount: args.length,
        }
      );

      throw error;
    }
  };
}

// Export examples
export const monitoringExamples = {
  createOrderAction,
  fetchProductsWithMonitoring,
  OrderService,
  authenticateUser,
  addToCartWithMonitoring,
  monitoredDatabaseOperations,
  withErrorMonitoring,
};