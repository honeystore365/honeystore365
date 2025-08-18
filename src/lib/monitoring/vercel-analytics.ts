import { track } from '@vercel/analytics';
import { businessMetricsTracker } from './business';
import { metricsCollector } from './metrics';
import { config } from '../config';

// Vercel Analytics integration service
export class VercelAnalyticsService {
  private static instance: VercelAnalyticsService;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = config.features.enableAnalytics && config.app.environment === 'production';
  }

  public static getInstance(): VercelAnalyticsService {
    if (!VercelAnalyticsService.instance) {
      VercelAnalyticsService.instance = new VercelAnalyticsService();
    }
    return VercelAnalyticsService.instance;
  }

  // Track custom events
  public trackEvent(
    name: string,
    properties?: Record<string, string | number | boolean>
  ): void {
    if (!this.isEnabled) return;

    try {
      track(name, properties);
    } catch (error) {
      console.error('Failed to track Vercel Analytics event:', error);
    }
  }

  // Track business events
  public trackBusinessEvent(
    event: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    // Convert properties to Vercel Analytics format (string, number, boolean only)
    const analyticsProperties: Record<string, string | number | boolean> = {};
    
    if (properties) {
      Object.entries(properties).forEach(([key, val]) => {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          analyticsProperties[key] = val;
        } else if (val !== null && val !== undefined) {
          analyticsProperties[key] = String(val);
        }
      });
    }

    if (value !== undefined) {
      analyticsProperties.value = value;
    }

    this.trackEvent(`business_${event}`, analyticsProperties);
  }

  // Track e-commerce events
  public trackEcommerceEvent(
    event: 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'begin_checkout' | 'purchase',
    properties: {
      productId?: string;
      productName?: string;
      category?: string;
      price?: number;
      quantity?: number;
      currency?: string;
      orderId?: string;
      totalValue?: number;
    }
  ): void {
    if (!this.isEnabled) return;

    const analyticsProperties: Record<string, string | number | boolean> = {
      event_category: 'ecommerce',
    };

    // Add properties that are compatible with Vercel Analytics
    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          analyticsProperties[key] = value;
        } else {
          analyticsProperties[key] = String(value);
        }
      }
    });

    this.trackEvent(event, analyticsProperties);
  }

  // Track user engagement
  public trackEngagement(
    action: 'page_view' | 'scroll' | 'click' | 'form_submit' | 'search',
    properties?: {
      page?: string;
      element?: string;
      query?: string;
      duration?: number;
    }
  ): void {
    if (!this.isEnabled) return;

    const analyticsProperties: Record<string, string | number | boolean> = {
      event_category: 'engagement',
    };

    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          analyticsProperties[key] = typeof value === 'number' ? value : String(value);
        }
      });
    }

    this.trackEvent(`engagement_${action}`, analyticsProperties);
  }

  // Track performance metrics
  public trackPerformance(
    metric: 'page_load' | 'api_response' | 'database_query',
    duration: number,
    properties?: {
      page?: string;
      endpoint?: string;
      query?: string;
      status?: string;
    }
  ): void {
    if (!this.isEnabled) return;

    const analyticsProperties: Record<string, string | number | boolean> = {
      event_category: 'performance',
      duration,
    };

    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          analyticsProperties[key] = String(value);
        }
      });
    }

    // Only track if duration is significant
    if (duration > 100) { // More than 100ms
      this.trackEvent(`performance_${metric}`, analyticsProperties);
    }
  }

  // Track errors
  public trackError(
    errorType: string,
    errorMessage: string,
    properties?: {
      component?: string;
      page?: string;
      userId?: string;
      severity?: string;
    }
  ): void {
    if (!this.isEnabled) return;

    const analyticsProperties: Record<string, string | number | boolean> = {
      event_category: 'error',
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Limit message length
    };

    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          analyticsProperties[key] = String(value);
        }
      });
    }

    this.trackEvent('error_occurred', analyticsProperties);
  }

  // Track conversion funnel
  public trackFunnelStep(
    funnel: string,
    step: string,
    properties?: {
      userId?: string;
      sessionId?: string;
      stepNumber?: number;
    }
  ): void {
    if (!this.isEnabled) return;

    const analyticsProperties: Record<string, string | number | boolean> = {
      event_category: 'funnel',
      funnel_name: funnel,
      step_name: step,
    };

    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          analyticsProperties[key] = typeof value === 'number' ? value : String(value);
        }
      });
    }

    this.trackEvent('funnel_step', analyticsProperties);
  }

  // Track A/B test events
  public trackAbTest(
    testName: string,
    variant: string,
    event: 'view' | 'conversion',
    properties?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const analyticsProperties: Record<string, string | number | boolean> = {
      event_category: 'ab_test',
      test_name: testName,
      variant,
      test_event: event,
    };

    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            analyticsProperties[key] = value;
          } else {
            analyticsProperties[key] = String(value);
          }
        }
      });
    }

    this.trackEvent('ab_test_event', analyticsProperties);
  }

  // Sync with internal metrics
  public syncWithInternalMetrics(): void {
    if (!this.isEnabled) return;

    // This would typically be called periodically to sync internal metrics with Vercel Analytics
    // For now, we'll just track a sync event
    this.trackEvent('metrics_sync', {
      timestamp: Date.now(),
      environment: config.app.environment,
    });
  }
}

// Export singleton instance
export const vercelAnalytics = VercelAnalyticsService.getInstance();

// Convenience functions
export const trackEvent = (name: string, properties?: Record<string, string | number | boolean>) =>
  vercelAnalytics.trackEvent(name, properties);

export const trackBusinessEvent = (event: string, value?: number, properties?: Record<string, any>) =>
  vercelAnalytics.trackBusinessEvent(event, value, properties);

export const trackEcommerceEvent = (
  event: Parameters<typeof vercelAnalytics.trackEcommerceEvent>[0],
  properties: Parameters<typeof vercelAnalytics.trackEcommerceEvent>[1]
) => vercelAnalytics.trackEcommerceEvent(event, properties);

export const trackEngagement = (
  action: Parameters<typeof vercelAnalytics.trackEngagement>[0],
  properties?: Parameters<typeof vercelAnalytics.trackEngagement>[1]
) => vercelAnalytics.trackEngagement(action, properties);

export const trackPerformance = (
  metric: Parameters<typeof vercelAnalytics.trackPerformance>[0],
  duration: number,
  properties?: Parameters<typeof vercelAnalytics.trackPerformance>[2]
) => vercelAnalytics.trackPerformance(metric, duration, properties);

export const trackError = (
  errorType: string,
  errorMessage: string,
  properties?: Parameters<typeof vercelAnalytics.trackError>[2]
) => vercelAnalytics.trackError(errorType, errorMessage, properties);

export const trackFunnelStep = (
  funnel: string,
  step: string,
  properties?: Parameters<typeof vercelAnalytics.trackFunnelStep>[2]
) => vercelAnalytics.trackFunnelStep(funnel, step, properties);

export const trackAbTest = (
  testName: string,
  variant: string,
  event: Parameters<typeof vercelAnalytics.trackAbTest>[2],
  properties?: Record<string, any>
) => vercelAnalytics.trackAbTest(testName, variant, event, properties);

// Integration with existing monitoring system
export function integrateWithMonitoring(): void {
  // Override internal metrics to also send to Vercel Analytics
  const originalRecordMetric = metricsCollector.recordMetric.bind(metricsCollector);
  
  metricsCollector.recordMetric = function(
    name: string,
    value: number,
    tags?: Record<string, string>,
    metadata?: Record<string, any>
  ) {
    // Call original method
    originalRecordMetric(name, value, tags, metadata);
    
    // Also send to Vercel Analytics for important metrics
    if (shouldSyncToVercel(name)) {
      vercelAnalytics.trackEvent(name.replace(/\./g, '_'), {
        value,
        ...tags,
      });
    }
  };

  // Override business metrics to also send to Vercel Analytics
  const originalTrackConversion = businessMetricsTracker.trackConversion.bind(businessMetricsTracker);
  
  businessMetricsTracker.trackConversion = function(
    conversionType: Parameters<typeof originalTrackConversion>[0],
    value?: number,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    // Call original method
    originalTrackConversion(conversionType, value, userId, metadata);
    
    // Also send to Vercel Analytics
    vercelAnalytics.trackBusinessEvent('conversion', value, {
      conversion_type: conversionType,
      user_id: userId,
      ...metadata,
    });
  };
}

// Helper function to determine which metrics to sync to Vercel
function shouldSyncToVercel(metricName: string): boolean {
  const importantMetrics = [
    'conversion.',
    'revenue.',
    'ecommerce.',
    'user.',
    'performance.page_load',
    'error.',
    'business.',
  ];

  return importantMetrics.some(pattern => metricName.includes(pattern));
}

export default vercelAnalytics;