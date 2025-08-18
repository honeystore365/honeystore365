// Migration utility to replace console.log statements with proper logging
// This file provides guidance and utilities for migrating from console.log to structured logging

import { logger } from './index';
// TODO: Implement these specialized loggers
// import { createApiLogger, createBusinessLogger, createSecurityLogger } from './index';
// import { createPerformanceLogger } from './specialized';

// Migration guide for different types of console.log usage
export const MIGRATION_GUIDE = {
  // Debug information during development
  DEBUG: {
    old: 'console.log("Debug info:", data)',
    new: 'logger.debug("Debug info", { data })',
    example: () => logger.debug('Debug info', { data: 'example' }),
  },

  // General information logging
  INFO: {
    old: 'console.log("Operation completed")',
    new: 'logger.info("Operation completed")',
    example: () => logger.info('Operation completed'),
  },

  // TODO: Implement specialized loggers
  /*
  // API request/response logging
  API: {
    old: 'console.log("API call:", method, path)',
    new: 'apiLogger.logRequest(method, path)',
    example: () => {
      const apiLogger = createApiLogger('req-123', 'user-456', '/api/products');
      apiLogger.logRequest('GET', '/api/products');
    },
  },

  // Business events
  BUSINESS: {
    old: 'console.log("User action:", action)',
    new: 'businessLogger.logUserAction(action, data)',
    example: () => {
      const businessLogger = createBusinessLogger('cart', 'user-123');
      businessLogger.logUserAction('add_to_cart', { productId: 'prod-456' });
    },
  },

  // Performance monitoring
  PERFORMANCE: {
    old: 'console.log("Operation took:", Date.now() - start, "ms")',
    new: 'performanceLogger.end()',
    example: () => {
      // const performanceLogger = createPerformanceLogger('database_query');
      // ... operation ...
      // performanceLogger.end();
    },
  },
  */

  // Error logging
  ERROR: {
    old: 'console.error("Error:", error)',
    new: 'logger.error("Error occurred", error)',
    example: () => logger.error('Error occurred', new Error('Example error')),
  },
};

// Utility functions to help with migration
export const migrationHelpers = {
  // Replace simple debug logs
  replaceDebugLog: (message: string, data?: any) => {
    logger.debug(message, data ? { data } : undefined);
  },

  // Replace info logs
  replaceInfoLog: (message: string, data?: any) => {
    logger.info(message, data ? { data } : undefined);
  },

  // Replace error logs
  replaceErrorLog: (message: string, error?: Error, data?: any) => {
    logger.error(message, error, data ? { data } : undefined);
  },

  // TODO: Implement specialized loggers
  /*
  // Replace API logs
  replaceApiLog: (requestId: string, method: string, path: string, data?: any) => {
    const apiLogger = createApiLogger(requestId, undefined, path);
    apiLogger.logRequest(method, path, data);
  },

  // Replace business event logs
  replaceBusinessLog: (component: string, event: string, data?: any, userId?: string) => {
    const businessLogger = createBusinessLogger(component, userId);
    businessLogger.logUserAction(event, data);
  },

  // Replace security logs
  replaceSecurityLog: (event: string, severity: 'low' | 'medium' | 'high', userId?: string) => {
    const securityLogger = createSecurityLogger(userId);
    securityLogger.logSecurityEvent({
      event,
      severity,
      category: 'system',
    });
  },
  */
};

// TODO: Implement specialized loggers
/*
// Common patterns and their replacements
export const COMMON_PATTERNS = {
  // Authentication logs
  AUTH_SUCCESS: (userId: string) => {
    const securityLogger = createSecurityLogger(userId);
    securityLogger.logAuthAttempt(true, 'login');
  },

  AUTH_FAILURE: (reason: string) => {
    const securityLogger = createSecurityLogger();
    securityLogger.logAuthAttempt(false, 'login', reason);
  },

  // Cart operations
  CART_ADD_ITEM: (userId: string, productId: string, quantity: number) => {
    const businessLogger = createBusinessLogger('cart', userId);
    businessLogger.logUserAction('add_to_cart', { productId, quantity });
  },

  CART_REMOVE_ITEM: (userId: string, productId: string) => {
    const businessLogger = createBusinessLogger('cart', userId);
    businessLogger.logUserAction('remove_from_cart', { productId });
  },

  // Order operations
  ORDER_CREATED: (userId: string, orderId: string, total: number) => {
    const businessLogger = createBusinessLogger('orders', userId);
    businessLogger.logEvent({
      event: 'order_created',
      category: 'order',
      data: { orderId, total },
      userId,
    });
  },

  // Product operations
  PRODUCT_VIEWED: (userId: string | undefined, productId: string) => {
    const businessLogger = createBusinessLogger('products', userId);
    businessLogger.logUserAction('product_viewed', { productId });
  },

  // Database operations
  DATABASE_QUERY: (operation: string, table: string, duration?: number) => {
    logger.debug(`Database ${operation}`, {
      component: 'database',
      table,
      duration,
      operation,
    });
  },

  // API operations
  API_REQUEST: (requestId: string, method: string, path: string, userId?: string) => {
    const apiLogger = createApiLogger(requestId, userId, path);
    apiLogger.logRequest(method, path);
  },

  API_RESPONSE: (requestId: string, statusCode: number, duration: number) => {
    const apiLogger = createApiLogger(requestId);
    apiLogger.logResponse(statusCode, duration);
  },

  // Performance monitoring
  SLOW_OPERATION: (operation: string, duration: number, threshold: number = 1000) => {
    if (duration > threshold) {
      logger.warn(`Slow operation detected: ${operation}`, {
        component: 'performance',
        operation,
        duration,
        threshold,
      });
    }
  },
};
*/

// Development helper to identify console.log usage
export const findConsoleLogs = () => {
  if (typeof window !== 'undefined') {
    // Browser environment - override console methods temporarily for detection
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      logger.warn('Unmigrated console.log detected', {
        args: args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))),
        stack: new Error().stack,
      });
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      logger.error('Console.error usage detected', undefined, {
        args: args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))),
        stack: new Error().stack,
      });
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      logger.warn('Console.warn usage detected', {
        args: args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))),
        stack: new Error().stack,
      });
      originalWarn.apply(console, args);
    };

    // Restore original methods after a delay (for development only)
    setTimeout(() => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }, 10000); // 10 seconds
  }
};

// Export migration utilities
export default {
  MIGRATION_GUIDE,
  migrationHelpers,
  // COMMON_PATTERNS, // TODO: Uncomment when specialized loggers are implemented
  findConsoleLogs,
};
