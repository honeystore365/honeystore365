// import { config } from '../config'; // Config disabled
const config = { app: { environment: 'development' }, monitoring: { enabled: false } };
import { logBusinessEvent } from '../logger';
import { metricsCollector } from './metrics';
// import { sentryService } from './sentry'; // Sentry disabled
const sentryService = null;

// Business metrics tracking service
export class BusinessMetricsTracker {
  private static instance: BusinessMetricsTracker;
  private sessionData: Map<string, any> = new Map();
  private conversionFunnels: Map<string, any[]> = new Map();

  private constructor() {}

  public static getInstance(): BusinessMetricsTracker {
    if (!BusinessMetricsTracker.instance) {
      BusinessMetricsTracker.instance = new BusinessMetricsTracker();
    }
    return BusinessMetricsTracker.instance;
  }

  // Track conversion funnel steps
  public trackConversionStep(
    funnelName: string,
    step: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): void {
    const key = userId || sessionId || 'anonymous';
    const funnelKey = `${funnelName}_${key}`;
    
    if (!this.conversionFunnels.has(funnelKey)) {
      this.conversionFunnels.set(funnelKey, []);
    }

    const funnel = this.conversionFunnels.get(funnelKey)!;
    funnel.push({
      step,
      timestamp: new Date(),
      metadata,
    });

    // Record the step
    metricsCollector.recordFunnelStep(funnelName, step, userId, {
      sessionId,
      stepNumber: funnel.length,
      ...metadata,
    });

    // Log business event
    logBusinessEvent(`Funnel Step: ${funnelName} - ${step}`, {
      funnelName,
      step,
      userId,
      sessionId,
      stepNumber: funnel.length,
    });
  }

  // Track cart abandonment
  public trackCartAbandonment(
    cartId: string,
    userId?: string,
    cartValue?: number,
    itemCount?: number,
    metadata?: Record<string, any>
  ): void {
    // Record cart abandonment metric
    metricsCollector.recordCartEvent(
      'cart_abandon',
      undefined,
      itemCount,
      cartValue,
      {
        cartId,
        userId,
        abandonmentReason: metadata?.reason || 'unknown',
        timeInCart: metadata?.timeInCart,
        ...metadata,
      }
    );

    // Calculate abandonment rate if we have session data
    const sessionKey = userId || cartId;
    if (this.sessionData.has(sessionKey)) {
      const sessionInfo = this.sessionData.get(sessionKey);
      const abandonmentRate = this.calculateAbandonmentRate(sessionInfo);
      
      if (abandonmentRate > 0.8) { // 80% abandonment rate
        // Trigger alert for high abandonment
        metricsCollector.recordMetric(
          'business.high_abandonment_rate',
          abandonmentRate * 100,
          {
            user_id: userId || 'anonymous',
            cart_id: cartId,
          },
          {
            cartValue,
            itemCount,
            sessionInfo,
          }
        );
      }
    }

    // Send to Sentry for business intelligence (disabled since sentryService is null)
    // sentryService.captureBusinessEvent('cart_abandoned', { ... });

    logBusinessEvent('Cart Abandoned', {
      cartId,
      userId,
      cartValue,
      itemCount,
      reason: metadata?.reason,
    });
  }

  // Track conversion completion
  public trackConversion(
    conversionType: 'purchase' | 'signup' | 'subscription' | 'lead',
    value?: number,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    // Record conversion metric
    metricsCollector.recordMetric(
      `conversion.${conversionType}`,
      value || 1,
      {
        conversion_type: conversionType,
        user_id: userId || 'anonymous',
        has_value: value ? 'true' : 'false',
      },
      {
        value,
        userId,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    );

    // Track conversion funnel completion
    if (userId) {
      const funnelKey = `purchase_${userId}`;
      if (this.conversionFunnels.has(funnelKey)) {
        const funnel = this.conversionFunnels.get(funnelKey)!;
        const conversionTime = this.calculateConversionTime(funnel);
        
        metricsCollector.recordMetric(
          'conversion.time_to_convert',
          conversionTime,
          {
            conversion_type: conversionType,
            user_id: userId,
          },
          {
            funnelSteps: funnel.length,
            value,
            ...metadata,
          }
        );

        // Clean up completed funnel
        this.conversionFunnels.delete(funnelKey);
      }
    }

    // Send high-value conversions to Sentry (disabled)
    if (value && value > 100) { // High-value conversion threshold
      // sentryService.captureBusinessEvent('high_value_conversion', { ... });
    }

    logBusinessEvent(`Conversion: ${conversionType}`, {
      conversionType,
      value,
      userId,
      ...metadata,
    });
  }

  // Track page performance impact on conversions
  public trackPagePerformanceImpact(
    page: string,
    loadTime: number,
    conversionAction?: string,
    userId?: string
  ): void {
    // Categorize load time
    let performanceCategory = 'fast';
    if (loadTime > 3000) performanceCategory = 'slow';
    else if (loadTime > 1500) performanceCategory = 'medium';

    metricsCollector.recordMetric(
      'performance.page_load_impact',
      loadTime,
      {
        page,
        performance_category: performanceCategory,
        has_conversion: conversionAction ? 'true' : 'false',
      },
      {
        conversionAction,
        userId,
      }
    );

    // Track correlation between slow pages and conversions
    if (loadTime > 3000 && conversionAction) {
      metricsCollector.recordMetric(
        'performance.slow_page_conversion',
        1,
        {
          page,
          conversion_action: conversionAction,
        },
        {
          loadTime,
          userId,
        }
      );
    }
  }

  // Track API performance impact on business metrics
  public trackApiPerformanceImpact(
    endpoint: string,
    responseTime: number,
    businessAction?: string,
    success: boolean = true
  ): void {
    metricsCollector.recordMetric(
      'api.business_impact',
      responseTime,
      {
        endpoint,
        success: success.toString(),
        has_business_action: businessAction ? 'true' : 'false',
      },
      {
        businessAction,
        responseTime,
      }
    );

    // Track slow API calls that impact business actions
    if (responseTime > 2000 && businessAction) {
      metricsCollector.recordMetric(
        'api.slow_business_impact',
        1,
        {
          endpoint,
          business_action: businessAction,
        },
        {
          responseTime,
        }
      );

      logBusinessEvent('Slow API Impact', {
        endpoint,
        responseTime,
        businessAction,
        impact: 'negative',
      });
    }
  }

  // Track user engagement metrics
  public trackUserEngagement(
    userId: string,
    sessionDuration: number,
    pageViews: number,
    interactions: number,
    metadata?: Record<string, any>
  ): void {
    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(
      sessionDuration,
      pageViews,
      interactions
    );

    metricsCollector.recordMetric(
      'user.engagement_score',
      engagementScore,
      {
        user_id: userId,
        engagement_level: this.getEngagementLevel(engagementScore),
      },
      {
        sessionDuration,
        pageViews,
        interactions,
        ...metadata,
      }
    );

    // Track high engagement users (disabled)
    if (engagementScore > 80) {
      // sentryService.captureBusinessEvent('high_engagement_user', { ... });
    }
  }

  // Track revenue metrics
  public trackRevenue(
    amount: number,
    currency: string = 'USD',
    source: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    metricsCollector.recordMetric(
      'revenue.total',
      amount,
      {
        currency,
        source,
        user_id: userId || 'anonymous',
      },
      {
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    );

    // Track revenue by time periods
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    metricsCollector.recordMetric(
      'revenue.by_hour',
      amount,
      {
        hour: hour.toString(),
        currency,
        source,
      }
    );

    metricsCollector.recordMetric(
      'revenue.by_day_of_week',
      amount,
      {
        day_of_week: dayOfWeek.toString(),
        currency,
        source,
      }
    );

    logBusinessEvent('Revenue Generated', {
      amount,
      currency,
      source,
      userId,
      hour,
      dayOfWeek,
    });
  }

  // Track customer lifetime value indicators
  public trackCustomerValue(
    userId: string,
    orderValue: number,
    orderCount: number,
    daysSinceFirstOrder: number,
    metadata?: Record<string, any>
  ): void {
    // Calculate estimated CLV
    const estimatedCLV = this.calculateEstimatedCLV(
      orderValue,
      orderCount,
      daysSinceFirstOrder
    );

    metricsCollector.recordMetric(
      'customer.estimated_clv',
      estimatedCLV,
      {
        user_id: userId,
        customer_segment: this.getCustomerSegment(estimatedCLV),
      },
      {
        orderValue,
        orderCount,
        daysSinceFirstOrder,
        ...metadata,
      }
    );

    // Track high-value customers (disabled)
    if (estimatedCLV > 500) {
      // sentryService.captureBusinessEvent('high_value_customer', { ... });
    }
  }

  // Helper methods
  private calculateAbandonmentRate(sessionInfo: any): number {
    // Simple abandonment rate calculation
    const { cartsCreated = 1, cartsAbandoned = 1 } = sessionInfo;
    return cartsAbandoned / cartsCreated;
  }

  private calculateConversionTime(funnel: any[]): number {
    if (funnel.length < 2) return 0;
    const firstStep = funnel[0].timestamp;
    const lastStep = funnel[funnel.length - 1].timestamp;
    return lastStep.getTime() - firstStep.getTime();
  }

  private calculateEngagementScore(
    sessionDuration: number,
    pageViews: number,
    interactions: number
  ): number {
    // Simple engagement score calculation (0-100)
    const durationScore = Math.min(sessionDuration / 300000, 1) * 40; // 5 minutes max
    const pageViewScore = Math.min(pageViews / 10, 1) * 30; // 10 pages max
    const interactionScore = Math.min(interactions / 20, 1) * 30; // 20 interactions max
    
    return Math.round(durationScore + pageViewScore + interactionScore);
  }

  private getEngagementLevel(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private calculateEstimatedCLV(
    orderValue: number,
    orderCount: number,
    daysSinceFirstOrder: number
  ): number {
    // Simple CLV estimation
    const avgOrderValue = orderValue / orderCount;
    const orderFrequency = orderCount / (daysSinceFirstOrder / 30); // orders per month
    const estimatedLifetime = 24; // 24 months
    
    return avgOrderValue * orderFrequency * estimatedLifetime;
  }

  private getCustomerSegment(clv: number): string {
    if (clv >= 1000) return 'premium';
    if (clv >= 500) return 'high_value';
    if (clv >= 200) return 'medium_value';
    return 'low_value';
  }

  // Cleanup old data
  public cleanup(): void {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // 24 hours ago

    // Clean up old funnel data
    for (const [key, funnel] of this.conversionFunnels.entries()) {
      const lastActivity = funnel[funnel.length - 1]?.timestamp;
      if (lastActivity && lastActivity < cutoff) {
        this.conversionFunnels.delete(key);
      }
    }

    // Clean up old session data
    for (const [key, session] of this.sessionData.entries()) {
      if (session.lastActivity && session.lastActivity < cutoff) {
        this.sessionData.delete(key);
      }
    }
  }

  // Get business metrics summary
  public getBusinessSummary(): {
    activeFunnels: number;
    activeSessions: number;
    totalConversions: number;
  } {
    return {
      activeFunnels: this.conversionFunnels.size,
      activeSessions: this.sessionData.size,
      totalConversions: 0, // Could be tracked if needed
    };
  }
}

// Export singleton instance
export const businessMetricsTracker = BusinessMetricsTracker.getInstance();

// Convenience functions
export const trackConversionStep = (
  funnelName: string,
  step: string,
  userId?: string,
  sessionId?: string,
  metadata?: Record<string, any>
) => businessMetricsTracker.trackConversionStep(funnelName, step, userId, sessionId, metadata);

export const trackCartAbandonment = (
  cartId: string,
  userId?: string,
  cartValue?: number,
  itemCount?: number,
  metadata?: Record<string, any>
) => businessMetricsTracker.trackCartAbandonment(cartId, userId, cartValue, itemCount, metadata);

export const trackConversion = (
  conversionType: Parameters<typeof businessMetricsTracker.trackConversion>[0],
  value?: number,
  userId?: string,
  metadata?: Record<string, any>
) => businessMetricsTracker.trackConversion(conversionType, value, userId, metadata);

export const trackRevenue = (
  amount: number,
  currency?: string,
  source?: string,
  userId?: string,
  metadata?: Record<string, any>
) => businessMetricsTracker.trackRevenue(amount, currency || 'USD', source || 'web', userId, metadata);

export const trackCustomerValue = (
  userId: string,
  orderValue: number,
  orderCount: number,
  daysSinceFirstOrder: number,
  metadata?: Record<string, any>
) => businessMetricsTracker.trackCustomerValue(userId, orderValue, orderCount, daysSinceFirstOrder, metadata);

// Start cleanup interval in production
if (config.app.environment === 'production') {
  setInterval(() => {
    businessMetricsTracker.cleanup();
  }, 60 * 60 * 1000); // Cleanup every hour
}

export default businessMetricsTracker;