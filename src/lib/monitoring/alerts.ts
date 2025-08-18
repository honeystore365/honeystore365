// import { config } from '../config'; // Config disabled
const config = { app: { environment: 'development' }, monitoring: { enabled: false } };
import { logError, logSecurityEvent, logger } from '../logger';
// import { sentryService } from './sentry'; // Sentry disabled
const sentryService: { captureMessage?: (message: string) => void } | null = null;

// Alert rule interface
export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  timeWindow: number; // in minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  description: string;
  actions: AlertAction[];
}

// Alert action interface
export interface AlertAction {
  type: 'email' | 'webhook' | 'sentry' | 'log';
  target: string;
  template?: string;
}

// Alert event interface
export interface AlertEvent {
  rule: AlertRule;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Alert configuration class
export class AlertConfig {
  private static instance: AlertConfig;
  private rules: Map<string, AlertRule> = new Map();
  private eventCounts: Map<string, { count: number; windowStart: Date }> = new Map();

  private constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): AlertConfig {
    if (!AlertConfig.instance) {
      AlertConfig.instance = new AlertConfig();
    }
    return AlertConfig.instance;
  }

  // Initialize default alert rules
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        name: 'high_error_rate',
        condition: 'error_count > threshold',
        threshold: 10,
        timeWindow: 5,
        severity: 'high',
        enabled: true,
        description: 'Alert when error rate exceeds 10 errors in 5 minutes',
        actions: [
          { type: 'sentry', target: 'error_alert' },
          { type: 'log', target: 'error' },
        ],
      },
      {
        name: 'slow_api_response',
        condition: 'avg_response_time > threshold',
        threshold: 2000,
        timeWindow: 10,
        severity: 'medium',
        enabled: true,
        description: 'Alert when average API response time exceeds 2 seconds',
        actions: [
          { type: 'sentry', target: 'performance_alert' },
          { type: 'log', target: 'warn' },
        ],
      },
      {
        name: 'failed_orders',
        condition: 'failed_order_count > threshold',
        threshold: 5,
        timeWindow: 15,
        severity: 'critical',
        enabled: true,
        description: 'Alert when order failures exceed 5 in 15 minutes',
        actions: [
          { type: 'sentry', target: 'business_critical' },
          { type: 'log', target: 'error' },
        ],
      },
      {
        name: 'security_events',
        condition: 'security_event_count > threshold',
        threshold: 3,
        timeWindow: 5,
        severity: 'critical',
        enabled: true,
        description: 'Alert on multiple security events',
        actions: [
          { type: 'sentry', target: 'security_alert' },
          { type: 'log', target: 'error' },
        ],
      },
      {
        name: 'cart_abandonment_spike',
        condition: 'cart_abandon_rate > threshold',
        threshold: 80,
        timeWindow: 30,
        severity: 'medium',
        enabled: true,
        description: 'Alert when cart abandonment rate exceeds 80%',
        actions: [
          { type: 'sentry', target: 'business_alert' },
          { type: 'log', target: 'warn' },
        ],
      },
      {
        name: 'database_connection_errors',
        condition: 'db_error_count > threshold',
        threshold: 5,
        timeWindow: 5,
        severity: 'high',
        enabled: true,
        description: 'Alert on database connection issues',
        actions: [
          { type: 'sentry', target: 'infrastructure_alert' },
          { type: 'log', target: 'error' },
        ],
      },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.name, rule);
    });
  }

  // Add or update alert rule
  public setRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
  }

  // Get alert rule
  public getRule(name: string): AlertRule | undefined {
    return this.rules.get(name);
  }

  // Get all rules
  public getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // Remove alert rule
  public removeRule(name: string): boolean {
    return this.rules.delete(name);
  }

  // Check if event should trigger alert
  public checkAlert(
    ruleName: string,
    value: number,
    metadata?: Record<string, any>
  ): boolean {
    const rule = this.rules.get(ruleName);
    if (!rule || !rule.enabled) {
      return false;
    }

    // Update event count for time window
    const key = `${ruleName}_${this.getTimeWindowKey(rule.timeWindow)}`;
    const eventData = this.eventCounts.get(key) || { count: 0, windowStart: new Date() };
    
    // Reset if window has passed
    const now = new Date();
    const windowMs = rule.timeWindow * 60 * 1000;
    if (now.getTime() - eventData.windowStart.getTime() > windowMs) {
      eventData.count = 0;
      eventData.windowStart = now;
    }

    eventData.count += value;
    this.eventCounts.set(key, eventData);

    // Check if threshold is exceeded
    if (eventData.count > rule.threshold) {
      this.triggerAlert({
        rule,
        value: eventData.count,
        timestamp: now,
        metadata,
      });
      
      // Reset counter after alert
      eventData.count = 0;
      eventData.windowStart = now;
      this.eventCounts.set(key, eventData);
      
      return true;
    }

    return false;
  }

  // Trigger alert actions
  private triggerAlert(event: AlertEvent): void {
    logger.warn(`Alert triggered: ${event.rule.name}`, {
      component: 'AlertManager',
      rule: event.rule.name,
      value: event.value,
      threshold: event.rule.threshold,
      alertEvent: true
    });

    event.rule.actions.forEach(action => {
      try {
        this.executeAction(action, event);
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    });
  }

  // Execute alert action
  private executeAction(action: AlertAction, event: AlertEvent): void {
    switch (action.type) {
      case 'sentry':
        this.sendToSentry(event, action);
        break;
      case 'log':
        this.logAlert(event, action);
        break;
      case 'webhook':
        this.sendWebhook(event, action);
        break;
      case 'email':
        this.sendEmail(event, action);
        break;
      default:
        console.warn(`Unknown alert action type: ${action.type}`);
    }
  }

  // Send alert to Sentry
  private sendToSentry(event: AlertEvent, action: AlertAction): void {
    const message = `Alert: ${event.rule.name} - ${event.rule.description}`;
    
    if (sentryService?.captureMessage) {
      sentryService.captureMessage(message);
    }

    // Add breadcrumb for context (disabled since sentryService is null)
    // sentryService.addBreadcrumb(...)
  }

  // Log alert
  private logAlert(event: AlertEvent, action: AlertAction): void {
    const message = `Alert: ${event.rule.name} - Value: ${event.value}, Threshold: ${event.rule.threshold}`;
    
    if (event.rule.severity === 'critical' || event.rule.severity === 'high') {
      logError(message, new Error(`Alert condition met: ${event.rule.condition}`), {
        alert: event.rule.name,
        value: event.value.toString(),
        threshold: event.rule.threshold.toString(),
        severity: event.rule.severity,
        ...event.metadata,
      });
    } else {
      logSecurityEvent(message, event.rule.severity as 'low' | 'medium' | 'high', {
        alert: event.rule.name,
        value: event.value.toString(),
        threshold: event.rule.threshold.toString(),
        ...event.metadata,
      });
    }
  }

  // Send webhook (placeholder)
  private sendWebhook(event: AlertEvent, action: AlertAction): void {
    // In a real implementation, this would send HTTP request to webhook URL
    logger.info(`Webhook alert notification`, {
      component: 'AlertManager',
      action: 'webhook',
      target: action.target,
      rule: event.rule.name,
      value: event.value,
      threshold: event.rule.threshold,
      timestamp: event.timestamp,
    });
  }

  // Send email (placeholder)
  private sendEmail(event: AlertEvent, action: AlertAction): void {
    // In a real implementation, this would send email
    logger.info(`Email alert notification`, {
      component: 'AlertManager',
      action: 'email',
      target: action.target,
      subject: `Alert: ${event.rule.name}`,
      body: `${event.rule.description}\nValue: ${event.value}\nThreshold: ${event.rule.threshold}`,
    });
  }

  // Get time window key for grouping events
  private getTimeWindowKey(windowMinutes: number): string {
    const now = new Date();
    const windowMs = windowMinutes * 60 * 1000;
    const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
    return new Date(windowStart).toISOString();
  }

  // Clean up old event counts
  public cleanup(): void {
    const now = new Date();
    const cutoff = now.getTime() - (60 * 60 * 1000); // 1 hour ago

    for (const [key, eventData] of this.eventCounts.entries()) {
      if (eventData.windowStart.getTime() < cutoff) {
        this.eventCounts.delete(key);
      }
    }
  }

  // Get alert statistics
  public getStats(): {
    totalRules: number;
    enabledRules: number;
    activeEvents: number;
  } {
    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter(rule => rule.enabled).length,
      activeEvents: this.eventCounts.size,
    };
  }
}

// Export singleton instance
export const alertConfig = AlertConfig.getInstance();

// Convenience functions for common alerts
export const checkErrorAlert = (errorCount: number, metadata?: Record<string, any>) =>
  alertConfig.checkAlert('high_error_rate', errorCount, metadata);

export const checkPerformanceAlert = (responseTime: number, metadata?: Record<string, any>) =>
  alertConfig.checkAlert('slow_api_response', responseTime, metadata);

export const checkOrderFailureAlert = (failureCount: number, metadata?: Record<string, any>) =>
  alertConfig.checkAlert('failed_orders', failureCount, metadata);

export const checkSecurityAlert = (eventCount: number, metadata?: Record<string, any>) =>
  alertConfig.checkAlert('security_events', eventCount, metadata);

export const checkCartAbandonmentAlert = (abandonmentRate: number, metadata?: Record<string, any>) =>
  alertConfig.checkAlert('cart_abandonment_spike', abandonmentRate, metadata);

export const checkDatabaseAlert = (errorCount: number, metadata?: Record<string, any>) =>
  alertConfig.checkAlert('database_connection_errors', errorCount, metadata);

// Start cleanup interval
if (config.app.environment === 'production') {
  setInterval(() => {
    alertConfig.cleanup();
  }, 15 * 60 * 1000); // Cleanup every 15 minutes
}

export default alertConfig;