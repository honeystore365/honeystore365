import { logger } from './index';
import { BusinessEventData, ErrorEventData, LogContext, PerformanceEventData, SecurityEventData } from './types';

// API Logger - for API routes and server actions
export class ApiLogger {
  private context: LogContext;

  constructor(requestId: string, userId?: string, endpoint?: string) {
    this.context = {
      requestId,
      userId,
      component: 'api',
      action: endpoint,
    };
  }

  logRequest(method: string, path: string, body?: any) {
    logger.info(`API Request: ${method} ${path}`, {
      ...this.context,
      method,
      path,
      body: body ? JSON.stringify(body) : undefined,
      type: 'request',
    });
  }

  logResponse(statusCode: number, duration: number, responseSize?: number) {
    logger.info(`API Response: ${statusCode}`, {
      ...this.context,
      statusCode,
      duration,
      responseSize,
      type: 'response',
    });
  }

  logError(error: Error, statusCode?: number) {
    logger.error(`API Error: ${error.message}`, error, {
      ...this.context,
      statusCode,
      type: 'error',
    });
  }
}

// Database Logger - for database operations
export class DatabaseLogger {
  private context: LogContext;

  constructor(operation: string, table?: string) {
    this.context = {
      component: 'database',
      action: operation,
      metadata: { table },
    };
  }

  logQuery(query: string, params?: any[], duration?: number) {
    logger.debug('Database Query', {
      ...this.context,
      query,
      params,
      duration,
      type: 'query',
    });
  }

  logTransaction(operation: string, tables: string[], duration?: number) {
    logger.info(`Database Transaction: ${operation}`, {
      ...this.context,
      operation,
      tables,
      duration,
      type: 'transaction',
    });
  }

  logError(error: Error, query?: string) {
    logger.error(`Database Error: ${error.message}`, error, {
      ...this.context,
      query,
      type: 'error',
    });
  }
}

// Business Logger - for business logic and events
export class BusinessLogger {
  private context: LogContext;

  constructor(component: string, userId?: string) {
    this.context = {
      component,
      userId,
    };
  }

  logEvent(data: BusinessEventData) {
    logger.info(`Business Event: ${data.event}`, {
      ...this.context,
      ...data,
      type: 'business_event',
    });
  }

  logUserAction(action: string, data?: Record<string, any>) {
    logger.info(`User Action: ${action}`, {
      ...this.context,
      action,
      data,
      type: 'user_action',
    });
  }

  logBusinessRule(rule: string, result: 'passed' | 'failed', data?: Record<string, any>) {
    const level = result === 'failed' ? 'warn' : 'info';
    logger[level](`Business Rule: ${rule} - ${result}`, {
      ...this.context,
      rule,
      result,
      data,
      type: 'business_rule',
    });
  }
}

// Security Logger - for security-related events
export class SecurityLogger {
  private context: LogContext;

  constructor(userId?: string, ipAddress?: string, userAgent?: string) {
    this.context = {
      userId,
      component: 'security',
      metadata: { ipAddress, userAgent },
    };
  }

  logSecurityEvent(data: SecurityEventData) {
    const metadata = {
      ...this.context,
      ...data,
      type: 'security_event',
    };
    
    if (data.severity === 'high') {
      logger.error(`Security Event: ${data.event}`, undefined, metadata);
    } else if (data.severity === 'medium') {
      logger.warn(`Security Event: ${data.event}`, metadata);
    } else {
      logger.info(`Security Event: ${data.event}`, metadata);
    }
  }

  logAuthAttempt(success: boolean, method: string, reason?: string) {
    const level = success ? 'info' : 'warn';
    logger[level](`Auth Attempt: ${method} - ${success ? 'success' : 'failed'}`, {
      ...this.context,
      method,
      success,
      reason,
      type: 'auth_attempt',
    });
  }

  logAccessAttempt(resource: string, action: string, allowed: boolean, reason?: string) {
    const level = allowed ? 'info' : 'warn';
    logger[level](`Access Attempt: ${action} on ${resource} - ${allowed ? 'allowed' : 'denied'}`, {
      ...this.context,
      resource,
      action,
      allowed,
      reason,
      type: 'access_attempt',
    });
  }

  logSuspiciousActivity(activity: string, details?: Record<string, any>) {
    logger.warn(`Suspicious Activity: ${activity}`, {
      ...this.context,
      activity,
      details,
      type: 'suspicious_activity',
    });
  }
}

// Performance Logger - for performance monitoring
export class PerformanceLogger {
  private context: LogContext;
  private startTime: number;

  constructor(operation: string, component?: string) {
    this.context = {
      component: component || 'performance',
      action: operation,
    };
    this.startTime = Date.now();
  }

  logPerformance(data: Partial<PerformanceEventData>) {
    const duration = data.duration || Date.now() - this.startTime;
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';

    logger[level](`Performance: ${data.operation || this.context.action} - ${duration}ms`, {
      ...this.context,
      duration,
      category: data.category || 'computation',
      metadata: data.metadata,
      type: 'performance',
    });
  }

  logSlowOperation(threshold: number = 1000) {
    const duration = Date.now() - this.startTime;
    if (duration > threshold) {
      logger.warn(`Slow Operation: ${this.context.action} took ${duration}ms`, {
        ...this.context,
        duration,
        threshold,
        type: 'slow_operation',
      });
    }
  }

  end(metadata?: Record<string, any>) {
    this.logPerformance({ metadata });
  }
}

// Error Logger - for structured error logging
export class ErrorLogger {
  private context: LogContext;

  constructor(component: string, userId?: string) {
    this.context = {
      component,
      userId,
    };
  }

  logError(data: ErrorEventData) {
    const logLevel = data.severity === 'critical' ? 'error' : data.severity === 'high' ? 'error' : 'warn';

    logger[logLevel](`${data.category} Error: ${data.error.message}`, data.error, {
      ...this.context,
      ...data.context,
      category: data.category,
      severity: data.severity,
      recoverable: data.recoverable,
      type: 'error_event',
    });
  }

  logValidationError(field: string, value: any, rule: string, message: string) {
    logger.warn(`Validation Error: ${field} - ${message}`, {
      ...this.context,
      field,
      value,
      rule,
      message,
      type: 'validation_error',
    });
  }

  logBusinessError(operation: string, error: Error, data?: Record<string, any>) {
    logger.error(`Business Error: ${operation} - ${error.message}`, error, {
      ...this.context,
      operation,
      data,
      type: 'business_error',
    });
  }
}

// Factory functions for creating specialized loggers
export const createApiLogger = (requestId: string, userId?: string, endpoint?: string) =>
  new ApiLogger(requestId, userId, endpoint);

export const createDatabaseLogger = (operation: string, table?: string) => new DatabaseLogger(operation, table);

export const createBusinessLogger = (component: string, userId?: string) => new BusinessLogger(component, userId);

export const createSecurityLogger = (userId?: string, ipAddress?: string, userAgent?: string) =>
  new SecurityLogger(userId, ipAddress, userAgent);

export const createPerformanceLogger = (operation: string, component?: string) =>
  new PerformanceLogger(operation, component);

export const createErrorLogger = (component: string, userId?: string) => new ErrorLogger(component, userId);
