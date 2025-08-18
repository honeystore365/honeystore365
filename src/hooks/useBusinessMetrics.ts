import {
    businessMetricsTracker,
    trackCartAbandonment,
    trackConversion,
    trackConversionStep,
    trackRevenue,
} from '@/lib/monitoring/business';
import { metricsCollector } from '@/lib/monitoring/metrics';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

// Hook for e-commerce conversion tracking
export function useConversionTracking(userId?: string) {
  const sessionIdRef = useRef<string>();

  useEffect(() => {
    // Generate session ID if not exists
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  const trackStep = useCallback((
    funnelName: string,
    step: string,
    metadata?: Record<string, any>
  ) => {
    trackConversionStep(funnelName, step, userId, sessionIdRef.current, metadata);
  }, [userId]);

  const trackPurchaseFunnel = useCallback((
    step: 'product_view' | 'add_to_cart' | 'checkout_start' | 'payment_info' | 'purchase',
    metadata?: Record<string, any>
  ) => {
    trackStep('purchase_funnel', step, metadata);
  }, [trackStep]);

  const trackSignupFunnel = useCallback((
    step: 'landing' | 'signup_start' | 'form_complete' | 'email_verify' | 'signup_complete',
    metadata?: Record<string, any>
  ) => {
    trackStep('signup_funnel', step, metadata);
  }, [trackStep]);

  return {
    trackStep,
    trackPurchaseFunnel,
    trackSignupFunnel,
    sessionId: sessionIdRef.current,
  };
}

// Hook for cart abandonment tracking
export function useCartTracking(userId?: string) {
  const cartStartTimeRef = useRef<number>();
  const cartDataRef = useRef<{
    cartId?: string;
    itemCount?: number;
    cartValue?: number;
  }>({});

  const startCartSession = useCallback((cartId: string) => {
    cartStartTimeRef.current = Date.now();
    cartDataRef.current.cartId = cartId;
  }, []);

  const updateCartData = useCallback((itemCount: number, cartValue: number) => {
    cartDataRef.current.itemCount = itemCount;
    cartDataRef.current.cartValue = cartValue;
  }, []);

  const trackAbandonment = useCallback((reason?: string) => {
    if (!cartDataRef.current.cartId) return;

    const timeInCart = cartStartTimeRef.current 
      ? Date.now() - cartStartTimeRef.current 
      : undefined;

    trackCartAbandonment(
      cartDataRef.current.cartId,
      userId,
      cartDataRef.current.cartValue,
      cartDataRef.current.itemCount,
      {
        reason,
        timeInCart,
        abandonedAt: new Date().toISOString(),
      }
    );
  }, [userId]);

  const trackCartCompletion = useCallback(() => {
    if (!cartDataRef.current.cartId || !cartDataRef.current.cartValue) return;

    trackConversion(
      'purchase',
      cartDataRef.current.cartValue,
      userId,
      {
        cartId: cartDataRef.current.cartId,
        itemCount: cartDataRef.current.itemCount,
        timeToConvert: cartStartTimeRef.current 
          ? Date.now() - cartStartTimeRef.current 
          : undefined,
      }
    );

    trackRevenue(
      cartDataRef.current.cartValue,
      'USD',
      'ecommerce',
      userId,
      {
        cartId: cartDataRef.current.cartId,
        itemCount: cartDataRef.current.itemCount,
      }
    );

    // Reset cart data
    cartDataRef.current = {};
    cartStartTimeRef.current = undefined;
  }, [userId]);

  // Track abandonment on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (cartDataRef.current.cartId && cartDataRef.current.itemCount && cartDataRef.current.itemCount > 0) {
        trackAbandonment('page_exit');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackAbandonment]);

  return {
    startCartSession,
    updateCartData,
    trackAbandonment,
    trackCartCompletion,
  };
}

// Hook for page performance impact tracking
export function usePagePerformanceTracking() {
  const pathname = usePathname();
  const pageStartTimeRef = useRef<number>();

  useEffect(() => {
    pageStartTimeRef.current = performance.now();

    // Track page load performance
    const handleLoad = () => {
      if (pageStartTimeRef.current) {
        const loadTime = performance.now() - pageStartTimeRef.current;
        businessMetricsTracker.trackPagePerformanceImpact(
          pathname,
          loadTime
        );
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
      return undefined;
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [pathname]);

  const trackConversionWithPerformance = useCallback((
    conversionAction: string,
    userId?: string
  ) => {
    if (pageStartTimeRef.current) {
      const loadTime = performance.now() - pageStartTimeRef.current;
      businessMetricsTracker.trackPagePerformanceImpact(
        pathname,
        loadTime,
        conversionAction,
        userId
      );
    }
  }, [pathname]);

  return {
    trackConversionWithPerformance,
  };
}

// Hook for user engagement tracking
export function useEngagementTracking(userId?: string) {
  const sessionStartRef = useRef<number>();
  const pageViewsRef = useRef<number>(0);
  const interactionsRef = useRef<number>(0);
  const lastActivityRef = useRef<number>();

  useEffect(() => {
    sessionStartRef.current = Date.now();
    lastActivityRef.current = Date.now();
    pageViewsRef.current = 1; // Current page view

    // Track interactions
    const trackInteraction = () => {
      interactionsRef.current += 1;
      lastActivityRef.current = Date.now();
    };

    // Add event listeners for interactions
    const events = ['click', 'scroll', 'keydown', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });

    // Track engagement on page unload
    const handleBeforeUnload = () => {
      if (sessionStartRef.current && userId) {
        const sessionDuration = Date.now() - sessionStartRef.current;
        businessMetricsTracker.trackUserEngagement(
          userId,
          sessionDuration,
          pageViewsRef.current,
          interactionsRef.current,
          {
            lastActivity: lastActivityRef.current,
            sessionEnd: Date.now(),
          }
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackInteraction);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId]);

  const incrementPageViews = useCallback(() => {
    pageViewsRef.current += 1;
  }, []);

  const getEngagementData = useCallback(() => {
    return {
      sessionDuration: sessionStartRef.current ? Date.now() - sessionStartRef.current : 0,
      pageViews: pageViewsRef.current,
      interactions: interactionsRef.current,
      lastActivity: lastActivityRef.current,
    };
  }, []);

  return {
    incrementPageViews,
    getEngagementData,
  };
}

// Hook for A/B test tracking
export function useAbTestTracking() {
  const trackTestEvent = useCallback((
    testName: string,
    variant: string,
    event: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordMetric(
      `ab_test.${testName}.${event}`,
      value || 1,
      {
        test_name: testName,
        variant,
        event,
        ...metadata,
      }
    );
  }, []);

  const trackTestConversion = useCallback((
    testName: string,
    variant: string,
    conversionValue?: number,
    metadata?: Record<string, any>
  ) => {
    trackTestEvent(testName, variant, 'conversion', conversionValue, metadata);
  }, [trackTestEvent]);

  return {
    trackTestEvent,
    trackTestConversion,
  };
}

// Hook for revenue tracking
export function useRevenueTracking() {
  const trackSale = useCallback((
    amount: number,
    currency: string = 'USD',
    source: string = 'web',
    userId?: string,
    metadata?: Record<string, any>
  ) => {
    trackRevenue(amount, currency, source, userId, metadata);
  }, []);

  const trackRefund = useCallback((
    amount: number,
    orderId: string,
    reason?: string,
    userId?: string,
    metadata?: Record<string, any>
  ) => {
    metricsCollector.recordMetric(
      'revenue.refund',
      -amount, // Negative amount for refunds
      {
        order_id: orderId,
        user_id: userId || 'anonymous',
        reason: reason || 'unknown',
      },
      {
        orderId,
        reason,
        ...metadata,
      }
    );
  }, []);

  return {
    trackSale,
    trackRefund,
  };
}

// Combined business metrics hook
export function useBusinessMetrics(options: {
  userId?: string;
  enableConversionTracking?: boolean;
  enableCartTracking?: boolean;
  enableEngagementTracking?: boolean;
  enablePerformanceTracking?: boolean;
} = {}) {
  const {
    userId,
    enableConversionTracking = true,
    enableCartTracking = true,
    enableEngagementTracking = true,
    enablePerformanceTracking = true,
  } = options;

  const conversionTracking = enableConversionTracking ? useConversionTracking(userId) : null;
  const cartTracking = enableCartTracking ? useCartTracking(userId) : null;
  const engagementTracking = enableEngagementTracking ? useEngagementTracking(userId) : null;
  const performanceTracking = enablePerformanceTracking ? usePagePerformanceTracking() : null;
  const abTestTracking = useAbTestTracking();
  const revenueTracking = useRevenueTracking();

  return {
    conversionTracking,
    cartTracking,
    engagementTracking,
    performanceTracking,
    abTestTracking,
    revenueTracking,
  };
}