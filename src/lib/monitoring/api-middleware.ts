import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '../logger';
import { businessMetricsTracker } from './business';
import { metricsCollector } from './metrics';
import { performanceMonitor } from './performance';
// import { sentryService } from './sentry'; // Sentry disabled
const sentryService: { 
  setContext?: (name: string, context: any) => void;
  addBreadcrumb?: (message: string, category?: string, level?: string, data?: any) => void;
  captureError?: (error: Error) => void;
} | null = null;

// API monitoring middleware for Next.js API routes
export function withApiMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    endpoint?: string;
    trackBusiness?: boolean;
    trackPerformance?: boolean;
    trackErrors?: boolean;
  } = {}
) {
  const {
    endpoint,
    trackBusiness = true,
    trackPerformance = true,
    trackErrors = true,
  } = options;

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    const requestId = generateRequestId();
    const endpointName = endpoint || extractEndpoint(req.url);
    
    // Create request logger
    const logger = createRequestLogger(requestId);
    
    // Set Sentry context (disabled since sentryService is null)
    if (trackErrors && sentryService?.setContext) {
      sentryService.setContext('api_request', {
        id: requestId,
        method: req.method,
        endpoint: endpointName,
        userAgent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      });
    }

    if (trackErrors && sentryService?.addBreadcrumb) {
      sentryService.addBreadcrumb(
        `API Request: ${req.method} ${endpointName}`,
        'http',
        'info',
        {
          method: req.method,
          endpoint: endpointName,
          requestId,
        }
      );
    }

    let response: NextResponse;
    let error: Error | null = null;
    let businessData: any = null;

    try {
      // Execute handler
      response = await handler(req);
      
      // Extract business data from response if available
      if (trackBusiness && response.headers.get('content-type')?.includes('application/json')) {
        try {
          const responseClone = response.clone();
          businessData = await responseClone.json();
        } catch {
          // Ignore JSON parsing errors
        }
      }

      // Log successful request
      logger.info(`${req.method} ${endpointName} - ${response.status}`, {
        statusCode: response.status,
        duration: performance.now() - startTime,
        requestId,
      });

    } catch (err) {
      error = err as Error;
      
      // Log error
      logger.error(`${req.method} ${endpointName} - Error`, error, {
        duration: performance.now() - startTime,
        requestId,
      });

      // Create error response
      response = NextResponse.json(
        { 
          error: 'Internal Server Error',
          requestId: trackErrors ? requestId : undefined,
        },
        { status: 500 }
      );
    }

    const duration = performance.now() - startTime;
    const statusCode = response.status;

    // Track performance metrics
    if (trackPerformance) {
      performanceMonitor.monitorApiCall(
        endpointName,
        req.method,
        statusCode,
        duration,
        {
          requestId,
          userAgent: req.headers.get('user-agent'),
          error: error?.message,
        }
      );

      // Track API performance impact on business
      if (businessData) {
        businessMetricsTracker.trackApiPerformanceImpact(
          endpointName,
          duration,
          extractBusinessAction(endpointName, businessData),
          statusCode < 400
        );
      }
    }

    // Track business metrics
    if (trackBusiness) {
      trackApiBusinessMetrics(
        endpointName,
        req.method,
        statusCode,
        businessData,
        duration,
        requestId
      );
    }

    // Track errors
    if (trackErrors && error) {
      metricsCollector.recordErrorMetric(
        'api_error',
        error.message,
        'api',
        {
          endpoint: endpointName,
          method: req.method,
          statusCode,
          duration,
          requestId,
        }
      );
    }

    // Add monitoring headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', duration.toString());
    
    if (trackPerformance) {
      response.headers.set('X-Performance-Category', getPerformanceCategory(duration));
    }

    return response;
  };
}

// Track business-specific API metrics
function trackApiBusinessMetrics(
  endpoint: string,
  method: string,
  statusCode: number,
  businessData: any,
  duration: number,
  requestId: string
): void {
  // Track different business actions based on endpoint
  if (endpoint.includes('/cart')) {
    trackCartApiMetrics(endpoint, method, statusCode, businessData, requestId);
  } else if (endpoint.includes('/order')) {
    trackOrderApiMetrics(endpoint, method, statusCode, businessData, requestId);
  } else if (endpoint.includes('/product')) {
    trackProductApiMetrics(endpoint, method, statusCode, businessData, requestId);
  } else if (endpoint.includes('/user') || endpoint.includes('/auth')) {
    trackUserApiMetrics(endpoint, method, statusCode, businessData, requestId);
  }

  // Track general API usage
  metricsCollector.recordMetric(
    'api.usage',
    1,
    {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'), // Normalize IDs
      method,
      status: statusCode.toString(),
      success: statusCode < 400 ? 'true' : 'false',
    },
    {
      duration,
      requestId,
      businessData: businessData ? 'present' : 'absent',
    }
  );
}

// Track cart-related API metrics
function trackCartApiMetrics(
  endpoint: string,
  method: string,
  statusCode: number,
  businessData: any,
  requestId: string
): void {
  if (method === 'POST' && endpoint.includes('/add')) {
    // Add to cart
    metricsCollector.recordCartEvent(
      'add_to_cart',
      businessData?.productId,
      businessData?.quantity,
      businessData?.price,
      {
        apiCall: true,
        statusCode,
        requestId,
      }
    );
  } else if (method === 'DELETE') {
    // Remove from cart
    metricsCollector.recordCartEvent(
      'remove_from_cart',
      businessData?.productId,
      businessData?.quantity,
      undefined,
      {
        apiCall: true,
        statusCode,
        requestId,
      }
    );
  } else if (method === 'GET') {
    // View cart
    metricsCollector.recordCartEvent(
      'cart_view',
      undefined,
      businessData?.itemCount,
      businessData?.totalValue,
      {
        apiCall: true,
        statusCode,
        requestId,
      }
    );
  }
}

// Track order-related API metrics
function trackOrderApiMetrics(
  endpoint: string,
  method: string,
  statusCode: number,
  businessData: any,
  requestId: string
): void {
  if (method === 'POST' && statusCode === 201) {
    // Order created
    metricsCollector.recordOrderEvent(
      'order_created',
      businessData?.orderId || businessData?.id,
      businessData?.totalAmount || businessData?.total,
      {
        apiCall: true,
        itemCount: businessData?.items?.length,
        paymentMethod: businessData?.paymentMethod,
        requestId,
      }
    );

    // Track conversion
    businessMetricsTracker.trackConversion(
      'purchase',
      businessData?.totalAmount || businessData?.total,
      businessData?.userId || businessData?.customerId,
      {
        orderId: businessData?.orderId || businessData?.id,
        apiCall: true,
        requestId,
      }
    );
  } else if (method === 'PUT' || method === 'PATCH') {
    // Order updated
    if (businessData?.status === 'completed') {
      metricsCollector.recordOrderEvent(
        'order_completed',
        businessData?.orderId || businessData?.id,
        businessData?.totalAmount || businessData?.total,
        {
          apiCall: true,
          requestId,
        }
      );
    } else if (businessData?.status === 'cancelled') {
      metricsCollector.recordOrderEvent(
        'order_cancelled',
        businessData?.orderId || businessData?.id,
        businessData?.totalAmount || businessData?.total,
        {
          apiCall: true,
          requestId,
        }
      );
    }
  }
}

// Track product-related API metrics
function trackProductApiMetrics(
  endpoint: string,
  method: string,
  statusCode: number,
  businessData: any,
  requestId: string
): void {
  if (method === 'GET') {
    if (endpoint.includes('/search')) {
      // Product search
      metricsCollector.recordProductEvent(
        'product_search',
        undefined,
        businessData?.query,
        {
          resultsCount: businessData?.results?.length || businessData?.count,
          filters: businessData?.filters,
          apiCall: true,
          requestId,
        }
      );
    } else if (businessData?.id || businessData?.productId) {
      // Product view
      metricsCollector.recordProductEvent(
        'product_view',
        businessData?.id || businessData?.productId,
        undefined,
        {
          apiCall: true,
          requestId,
        }
      );
    }
  }
}

// Track user-related API metrics
function trackUserApiMetrics(
  endpoint: string,
  method: string,
  statusCode: number,
  businessData: any,
  requestId: string
): void {
  if (endpoint.includes('/auth/login') && method === 'POST') {
    if (statusCode === 200) {
      metricsCollector.recordUserEvent(
        'user_login',
        businessData?.userId || businessData?.user?.id,
        {
          method: 'api',
          success: true,
          requestId,
        }
      );
    } else {
      metricsCollector.recordMetric(
        'auth.login_failed',
        1,
        {
          method: 'api',
          status_code: statusCode.toString(),
        },
        {
          requestId,
          error: businessData?.error,
        }
      );
    }
  } else if (endpoint.includes('/auth/register') && method === 'POST') {
    if (statusCode === 201) {
      metricsCollector.recordUserEvent(
        'user_register',
        businessData?.userId || businessData?.user?.id,
        {
          method: 'api',
          success: true,
          requestId,
        }
      );
    }
  } else if (endpoint.includes('/profile') && method === 'PUT') {
    metricsCollector.recordUserEvent(
      'profile_update',
      businessData?.userId || businessData?.user?.id,
      {
        method: 'api',
        requestId,
      }
    );
  }
}

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function extractEndpoint(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
}

function extractBusinessAction(endpoint: string, businessData: any): string | undefined {
  if (endpoint.includes('/cart')) return 'cart_operation';
  if (endpoint.includes('/order')) return 'order_operation';
  if (endpoint.includes('/product')) return 'product_operation';
  if (endpoint.includes('/auth')) return 'auth_operation';
  return undefined;
}

function getPerformanceCategory(duration: number): string {
  if (duration < 100) return 'fast';
  if (duration < 500) return 'medium';
  if (duration < 2000) return 'slow';
  return 'very_slow';
}

// Export the middleware
export default withApiMonitoring;