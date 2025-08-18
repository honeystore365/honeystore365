import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { createRequestLogger } from '../logger';
import { metricsCollector } from './metrics';
import { performanceMonitor } from './performance';
// import { sentryService } from './sentry'; // Sentry disabled
const sentryService: { 
  setContext?: (name: string, context: any) => void;
  addBreadcrumb?: (message: string, category?: string, level?: string, data?: any) => void;
  captureError?: (error: Error) => void;
  captureBusinessEvent?: (event: string, data?: any) => void;
} | null = null;

// Request monitoring middleware
function withMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const startTime = performance.now();
    const requestId = generateRequestId();
    
    // Create request logger
    const logger = createRequestLogger(requestId);
    
    // Set Sentry context (disabled)
    if (sentryService?.setContext) {
      sentryService.setContext('request', {
        id: requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      });
    }

    // Add breadcrumb (disabled)
    if (sentryService?.addBreadcrumb) {
      sentryService.addBreadcrumb(
        `API Request: ${request.method} ${request.url}`,
        'http',
        'info',
        {
          method: request.method,
          url: request.url,
          requestId,
        }
      );
    }

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute handler
      response = await handler(...args);
      
      // Log successful request
      logger.info(`${request.method} ${request.url} - ${response.status}`, {
        statusCode: response.status,
        duration: performance.now() - startTime,
      });

    } catch (err) {
      error = err as Error;
      
      // Log error
      logger.error(`${request.method} ${request.url} - Error`, error, {
        duration: performance.now() - startTime,
      });

      // Create error response
      response = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    const duration = performance.now() - startTime;
    const statusCode = response.status;

    // Record performance metrics
    performanceMonitor.monitorApiCall(
      request.url,
      request.method,
      statusCode,
      duration,
      {
        requestId,
        userAgent: request.headers.get('user-agent'),
        error: error?.message,
      }
    );

    // Record business metrics
    metricsCollector.recordMetric(
      'api.request',
      1,
      {
        method: request.method,
        status: statusCode.toString(),
        endpoint: extractEndpoint(request.url),
      },
      {
        duration,
        requestId,
        error: error?.message,
      }
    );

    // Add response headers for monitoring
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', duration.toString());

    return response;
  };
}

// Database query monitoring wrapper
function withDatabaseMonitoring<T extends any[], R>(
  queryFunction: (...args: T) => Promise<R>,
  queryName: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    
    try {
      const result = await queryFunction(...args);
      const duration = performance.now() - startTime;
      
      // Monitor successful query
      performanceMonitor.monitorDatabaseQuery(
        queryName,
        duration,
        {
          success: true,
          args: args.length,
        }
      );

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Monitor failed query
      performanceMonitor.monitorDatabaseQuery(
        queryName,
        duration,
        {
          success: false,
          error: (error as Error).message,
          args: args.length,
        }
      );

      throw error;
    }
  };
}

// Component performance monitoring HOC
function withComponentMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function MonitoredComponent(props: P) {
    const startTime = performance.now();

    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      
      performanceMonitor.recordMetric(
        `component.render_time`,
        renderTime,
        'millisecond',
        {
          component: componentName,
        }
      );

      // Log slow renders
      if (renderTime > 100) {
        console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
      }
    }, []);

    return React.createElement(Component, props);
  };
}

// User action monitoring
function trackUserAction(
  action: string,
  category: string = 'user',
  metadata?: Record<string, any>
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;
        
        // Track successful action
        metricsCollector.recordMetric(
          `user_action.${action}`,
          1,
          {
            category,
            success: 'true',
          },
          {
            duration,
            ...metadata,
          }
        );

        if (sentryService?.addBreadcrumb) {
          sentryService.addBreadcrumb(
            `User Action: ${action}`,
            category,
            'info',
            {
              action,
              duration,
              success: true,
              ...metadata,
            }
          );
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        // Track failed action
        metricsCollector.recordMetric(
          `user_action.${action}`,
          1,
          {
            category,
            success: 'false',
          },
          {
            duration,
            error: (error as Error).message,
            ...metadata,
          }
        );

        if (sentryService?.addBreadcrumb) {
          sentryService.addBreadcrumb(
            `User Action Failed: ${action}`,
            category,
            'error',
            {
              action,
              duration,
              success: false,
              error: (error as Error).message,
              ...metadata,
            }
          );
        }

        throw error;
      }
    };

    return descriptor;
  };
}

// Business event tracking decorator
function trackBusinessEventDecorator(
  event: string,
  metadata?: Record<string, any>
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args);
        
        // Track business event
        metricsCollector.recordMetric(
          `business.${event}`,
          1,
          {
            event,
            success: 'true',
          },
          {
            result: typeof result === 'object' ? JSON.stringify(result) : result,
            ...metadata,
          }
        );

        if (sentryService?.captureBusinessEvent) {
          sentryService.captureBusinessEvent(event, {
            success: true,
            result: typeof result === 'object' ? JSON.stringify(result) : result,
            ...metadata,
          });
        }

        return result;
      } catch (error) {
        // Track failed business event
        metricsCollector.recordMetric(
          `business.${event}`,
          1,
          {
            event,
            success: 'false',
          },
          {
            error: (error as Error).message,
            ...metadata,
          }
        );

        if (sentryService?.captureBusinessEvent) {
          sentryService.captureBusinessEvent(event, {
            success: false,
            error: (error as Error).message,
            ...metadata,
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}

// Utility functions
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

// Export monitoring utilities
export {
    trackBusinessEventDecorator, trackUserAction, withComponentMonitoring, withDatabaseMonitoring, withMonitoring
};
