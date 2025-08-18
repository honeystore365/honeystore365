import { config } from '../config';
import { logBusinessEvent, logger } from '../logger';
// import { sentryService } from './sentry'; // Sentry disabled
const sentryService: { 
  capturePerformanceMetric?: (name: string, value: number, unit?: string, tags?: any) => void;
  captureBusinessEvent?: (name: string, data?: any) => void;
} | null = null;

// Business metrics interface
export interface BusinessMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

// Metrics collector service
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metricsBuffer: BusinessMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start periodic flush in production
    if (config.app.environment === 'production') {
      this.startPeriodicFlush();
    }
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // Record a business metric
  public recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
    metadata?: Record<string, any>
  ): void {
    const metric: BusinessMetric = {
      name,
      value,
      timestamp: new Date(),
      tags,
      metadata,
    };

    // Add to buffer
    this.metricsBuffer.push(metric);

    // Send to Sentry immediately for important metrics
    if (this.isImportantMetric(name)) {
      this.sendToSentry(metric);
    }

    // Log business event
    logBusinessEvent(`Metric: ${name}`, { value, tags, metadata });

    // Flush if buffer is getting large
    if (this.metricsBuffer.length >= 100) {
      this.flush();
    }
  }

  // E-commerce specific metrics
  public recordCartEvent(
    event: 'add_to_cart' | 'remove_from_cart' | 'cart_view' | 'cart_abandon',
    productId?: string,
    quantity?: number,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric(
      `ecommerce.cart.${event}`,
      value || quantity || 1,
      {
        product_id: productId || 'unknown',
        event_type: 'cart',
      },
      {
        event,
        productId,
        quantity,
        value,
        ...metadata,
      }
    );
  }

  public recordOrderEvent(
    event: 'order_created' | 'order_completed' | 'order_cancelled' | 'payment_failed',
    orderId: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric(
      `ecommerce.order.${event}`,
      value || 1,
      {
        order_id: orderId,
        event_type: 'order',
      },
      {
        event,
        orderId,
        value,
        ...metadata,
      }
    );
  }

  public recordProductEvent(
    event: 'product_view' | 'product_search' | 'product_filter',
    productId?: string,
    searchQuery?: string,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric(
      `ecommerce.product.${event}`,
      1,
      {
        product_id: productId || 'unknown',
        event_type: 'product',
      },
      {
        event,
        productId,
        searchQuery,
        ...metadata,
      }
    );
  }

  public recordUserEvent(
    event: 'user_login' | 'user_register' | 'user_logout' | 'profile_update',
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric(
      `user.${event}`,
      1,
      {
        user_id: userId || 'anonymous',
        event_type: 'user',
      },
      {
        event,
        userId,
        ...metadata,
      }
    );
  }

  // Performance metrics
  public recordPerformanceMetric(
    name: string,
    value: number,
    unit: string = 'millisecond',
    tags?: Record<string, string>
  ): void {
    this.recordMetric(
      `performance.${name}`,
      value,
      {
        unit,
        ...tags,
      },
      {
        performance: true,
        unit,
      }
    );
  }

  // Error metrics
  public recordErrorMetric(
    errorType: string,
    errorMessage: string,
    component?: string,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric(
      `error.${errorType}`,
      1,
      {
        error_type: errorType,
        component: component || 'unknown',
      },
      {
        errorMessage,
        component,
        ...metadata,
      }
    );
  }

  // Conversion funnel tracking
  public recordFunnelStep(
    funnel: string,
    step: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric(
      `funnel.${funnel}.${step}`,
      1,
      {
        funnel,
        step,
        user_id: userId || 'anonymous',
      },
      {
        funnel,
        step,
        userId,
        ...metadata,
      }
    );
  }

  // A/B test metrics
  public recordAbTestMetric(
    testName: string,
    variant: string,
    event: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric(
      `ab_test.${testName}.${event}`,
      value || 1,
      {
        test_name: testName,
        variant,
        event,
      },
      {
        testName,
        variant,
        event,
        ...metadata,
      }
    );
  }

  // Feature usage metrics
  public recordFeatureUsage(
    feature: string,
    action: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric(
      `feature.${feature}.${action}`,
      1,
      {
        feature,
        action,
        user_id: userId || 'anonymous',
      },
      {
        feature,
        action,
        userId,
        ...metadata,
      }
    );
  }

  // Send metrics to external services
  private sendToSentry(metric: BusinessMetric): void {
    if (!config.monitoring.enablePerformanceMonitoring) return;

    try {
      if (sentryService?.capturePerformanceMetric) {
        sentryService.capturePerformanceMetric(
          metric.name,
          metric.value,
          'count',
          metric.tags
        );
      }

      if (sentryService?.captureBusinessEvent) {
        sentryService.captureBusinessEvent(
          metric.name,
          {
            value: metric.value,
            ...metric.metadata,
            timestamp: metric.timestamp,
            ...metric.tags,
          }
        );
      }
    } catch (error) {
      console.error('Failed to send metric to Sentry:', error);
    }
  }

  // Check if metric is important and should be sent immediately
  private isImportantMetric(name: string): boolean {
    const importantMetrics = [
      'ecommerce.order.order_completed',
      'ecommerce.order.payment_failed',
      'error.',
      'security.',
      'performance.api.response_time',
    ];

    return importantMetrics.some(pattern => name.includes(pattern));
  }

  // Flush metrics buffer
  public flush(): void {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Send to external services
    metricsToFlush.forEach(metric => {
      if (!this.isImportantMetric(metric.name)) {
        this.sendToSentry(metric);
      }
    });

    logger.debug(`Metrics flushed`, {
      component: 'MetricsCollector',
      count: metricsToFlush.length,
      action: 'flush'
    });
  }

  // Start periodic flush
  private startPeriodicFlush(): void {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, 60000); // Flush every minute
  }

  // Stop periodic flush
  public stopPeriodicFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // Get metrics summary
  public getMetricsSummary(): {
    bufferedMetrics: number;
    totalRecorded: number;
  } {
    return {
      bufferedMetrics: this.metricsBuffer.length,
      totalRecorded: 0, // Could be tracked if needed
    };
  }

  // Export metrics for analysis
  public exportMetrics(
    startDate?: Date,
    endDate?: Date
  ): BusinessMetric[] {
    let metrics = [...this.metricsBuffer];

    if (startDate || endDate) {
      metrics = metrics.filter(metric => {
        if (startDate && metric.timestamp < startDate) return false;
        if (endDate && metric.timestamp > endDate) return false;
        return true;
      });
    }

    return metrics;
  }
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance();

// Convenience functions
export const recordMetric = (
  name: string,
  value: number,
  tags?: Record<string, string>,
  metadata?: Record<string, any>
) => metricsCollector.recordMetric(name, value, tags, metadata);

export const recordCartEvent = (
  event: Parameters<typeof metricsCollector.recordCartEvent>[0],
  productId?: string,
  quantity?: number,
  value?: number,
  metadata?: Record<string, any>
) => metricsCollector.recordCartEvent(event, productId, quantity, value, metadata);

export const recordOrderEvent = (
  event: Parameters<typeof metricsCollector.recordOrderEvent>[0],
  orderId: string,
  value?: number,
  metadata?: Record<string, any>
) => metricsCollector.recordOrderEvent(event, orderId, value, metadata);

export const recordProductEvent = (
  event: Parameters<typeof metricsCollector.recordProductEvent>[0],
  productId?: string,
  searchQuery?: string,
  metadata?: Record<string, any>
) => metricsCollector.recordProductEvent(event, productId, searchQuery, metadata);

export const recordUserEvent = (
  event: Parameters<typeof metricsCollector.recordUserEvent>[0],
  userId?: string,
  metadata?: Record<string, any>
) => metricsCollector.recordUserEvent(event, userId, metadata);

export const recordFunnelStep = (
  funnel: string,
  step: string,
  userId?: string,
  metadata?: Record<string, any>
) => metricsCollector.recordFunnelStep(funnel, step, userId, metadata);

export const recordFeatureUsage = (
  feature: string,
  action: string,
  userId?: string,
  metadata?: Record<string, any>
) => metricsCollector.recordFeatureUsage(feature, action, userId, metadata);

export default metricsCollector;