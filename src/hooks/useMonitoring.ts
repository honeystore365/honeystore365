import {
    metricsCollector,
    performanceMonitor,
    recordFeatureUsage,
    recordUserEvent,
    sentryService,
} from '@/lib/monitoring';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

// Hook for page performance monitoring
export function usePagePerformance() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          performanceMonitor.monitorPageLoad(pathname, {
            fcp: navEntry.responseStart - navEntry.fetchStart,
            ttfb: navEntry.responseStart - navEntry.requestStart,
          });
        }

        if (entry.entryType === 'paint') {
          const paintEntry = entry as PerformancePaintTiming;
          if (paintEntry.name === 'first-contentful-paint') {
            performanceMonitor.monitorPageLoad(pathname, {
              fcp: paintEntry.startTime,
            });
          }
        }

        if (entry.entryType === 'largest-contentful-paint') {
          const lcpEntry = entry as any;
          performanceMonitor.monitorPageLoad(pathname, {
            lcp: lcpEntry.startTime,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

    // Record page view
    metricsCollector.recordMetric(
      'page.view',
      1,
      {
        page: pathname,
      },
      {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }
    );

    return () => {
      observer.disconnect();
      
      // Record page exit time
      const timeOnPage = performance.now() - startTimeRef.current;
      metricsCollector.recordMetric(
        'page.time_on_page',
        timeOnPage,
        {
          page: pathname,
        },
        {
          duration: timeOnPage,
        }
      );
    };
  }, [pathname]);
}

// Hook for user action tracking
export function useUserTracking(userId?: string) {
  useEffect(() => {
    if (userId) {
      sentryService.setUser({
        id: userId,
      });
    }
  }, [userId]);

  const trackAction = useCallback((
    action: string,
    category: string = 'user',
    metadata?: Record<string, any>
  ) => {
    recordUserEvent(action as any, userId, {
      category,
      ...metadata,
    });
  }, [userId]);

  const trackFeature = useCallback((
    feature: string,
    action: string,
    metadata?: Record<string, any>
  ) => {
    recordFeatureUsage(feature, action, userId, metadata);
  }, [userId]);

  return {
    trackAction,
    trackFeature,
  };
}

// Hook for error boundary monitoring
export function useErrorTracking() {
  const trackError = useCallback((
    error: Error,
    errorInfo?: { componentStack?: string },
    metadata?: Record<string, any>
  ) => {
    sentryService.captureError(error);

    metricsCollector.recordErrorMetric(
      'react_error',
      error.message,
      'ErrorBoundary',
      {
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        ...metadata,
      }
    );
  }, []);

  return { trackError };
}

// Hook for business event tracking
export function useBusinessTracking() {
  const trackCartEvent = useCallback((
    event: 'add_to_cart' | 'remove_from_cart' | 'cart_view' | 'cart_abandon',
    productId?: string,
    quantity?: number,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordCartEvent(event, productId, quantity, value, metadata);
  }, []);

  const trackOrderEvent = useCallback((
    event: 'order_created' | 'order_completed' | 'order_cancelled' | 'payment_failed',
    orderId: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordOrderEvent(event, orderId, value, metadata);
  }, []);

  const trackProductEvent = useCallback((
    event: 'product_view' | 'product_search' | 'product_filter',
    productId?: string,
    searchQuery?: string,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordProductEvent(event, productId, searchQuery, metadata);
  }, []);

  return {
    trackCartEvent,
    trackOrderEvent,
    trackProductEvent,
  };
}

// Hook for form monitoring
export function useFormTracking(formName: string) {
  const trackFormStart = useCallback(() => {
    metricsCollector.recordMetric(
      'form.start',
      1,
      {
        form: formName,
      },
      {
        timestamp: new Date().toISOString(),
      }
    );
  }, [formName]);

  const trackFormSubmit = useCallback((
    success: boolean,
    errors?: string[],
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordMetric(
      'form.submit',
      1,
      {
        form: formName,
        success: success.toString(),
      },
      {
        errors,
        ...metadata,
      }
    );

    if (!success && errors) {
      errors.forEach(error => {
        metricsCollector.recordErrorMetric(
          'form_validation',
          error,
          formName,
          {
            form: formName,
          }
        );
      });
    }
  }, [formName]);

  const trackFieldError = useCallback((
    fieldName: string,
    error: string,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordMetric(
      'form.field_error',
      1,
      {
        form: formName,
        field: fieldName,
      },
      {
        error,
        ...metadata,
      }
    );
  }, [formName]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFieldError,
  };
}

// Hook for API call monitoring
export function useApiTracking() {
  const trackApiCall = useCallback((
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, any>
  ) => {
    performanceMonitor.monitorApiCall(endpoint, method, statusCode, duration, metadata);
  }, []);

  const trackApiError = useCallback((
    endpoint: string,
    method: string,
    error: Error,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordErrorMetric(
      'api_error',
      error.message,
      'api',
      {
        endpoint,
        method,
        stack: error.stack,
        ...metadata,
      }
    );

    sentryService.captureError(error);
  }, []);

  return {
    trackApiCall,
    trackApiError,
  };
}

// Hook for search tracking
export function useSearchTracking() {
  const trackSearch = useCallback((
    query: string,
    resultsCount: number,
    filters?: Record<string, any>,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordProductEvent(
      'product_search',
      undefined,
      query,
      {
        resultsCount,
        filters,
        ...metadata,
      }
    );

    // Track empty search results
    if (resultsCount === 0) {
      metricsCollector.recordMetric(
        'search.no_results',
        1,
        {
          query_length: query.length.toString(),
        },
        {
          query,
          filters,
        }
      );
    }
  }, []);

  const trackSearchFilter = useCallback((
    filterType: string,
    filterValue: string,
    resultsCount: number,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordProductEvent(
      'product_filter',
      undefined,
      undefined,
      {
        filterType,
        filterValue,
        resultsCount,
        ...metadata,
      }
    );
  }, []);

  return {
    trackSearch,
    trackSearchFilter,
  };
}

// Hook for checkout funnel tracking
export function useCheckoutTracking() {
  const trackFunnelStep = useCallback((
    step: 'cart' | 'shipping' | 'payment' | 'confirmation',
    userId?: string,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordFunnelStep(
      'checkout',
      step,
      userId,
      metadata
    );
  }, []);

  const trackCheckoutError = useCallback((
    step: string,
    error: string,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordErrorMetric(
      'checkout_error',
      error,
      'checkout',
      {
        step,
        ...metadata,
      }
    );
  }, []);

  return {
    trackFunnelStep,
    trackCheckoutError,
  };
}

// Combined monitoring hook
export function useMonitoring(options: {
  userId?: string;
  enablePageTracking?: boolean;
  enableUserTracking?: boolean;
  enableErrorTracking?: boolean;
} = {}) {
  const {
    userId,
    enablePageTracking = true,
    enableUserTracking = true,
    enableErrorTracking = true,
  } = options;

  // Enable page performance tracking
  if (enablePageTracking) {
    usePagePerformance();
  }

  // Enable user tracking
  const userTracking = enableUserTracking ? useUserTracking(userId) : null;

  // Enable error tracking
  const errorTracking = enableErrorTracking ? useErrorTracking() : null;

  // Enable business tracking
  const businessTracking = useBusinessTracking();

  return {
    userTracking,
    errorTracking,
    businessTracking,
  };
}