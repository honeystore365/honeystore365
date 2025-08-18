import { config } from '../config';
import { logPerformance } from '../logger';
// import { sentryService } from './sentry'; // Sentry disabled
const sentryService: { 
  startTransaction?: (name: string, type: string, description?: string) => any;
  capturePerformanceMetric?: (name: string, value: number, unit?: string, tags?: any) => void;
} | null = null;

// Performance monitoring service
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private activeTransactions: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  public startTiming(operationName: string, metadata?: Record<string, any>): string {
    const timingId = `${operationName}_${Date.now()}_${Math.random()}`;
    const startTime = performance.now();

    // Store timing info
    this.activeTransactions.set(timingId, {
      operationName,
      startTime,
      metadata,
    });

    // Start Sentry transaction if enabled
    if (config.monitoring.enablePerformanceMonitoring && sentryService?.startTransaction) {
      const transaction = sentryService.startTransaction(
        operationName,
        'operation',
        `Performance monitoring for ${operationName}`
      );
      
      if (transaction) {
        this.activeTransactions.set(`${timingId}_sentry`, transaction);
      }
    }

    return timingId;
  }

  // End timing and record performance
  public endTiming(timingId: string): number | null {
    const timingInfo = this.activeTransactions.get(timingId);
    if (!timingInfo) {
      console.warn(`No timing found for ID: ${timingId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - timingInfo.startTime;

    // Log performance
    logPerformance(timingInfo.operationName, timingInfo.startTime, {
      ...timingInfo.metadata,
      duration,
      endTime,
    });

    // Send to Sentry
    if (config.monitoring.enablePerformanceMonitoring && sentryService?.capturePerformanceMetric) {
      sentryService.capturePerformanceMetric(
        `operation.${timingInfo.operationName}`,
        duration,
        'millisecond',
        {
          operation: timingInfo.operationName,
          ...timingInfo.metadata,
        }
      );

      // End Sentry transaction
      const sentryTransaction = this.activeTransactions.get(`${timingId}_sentry`);
      if (sentryTransaction) {
        sentryTransaction.finish();
        this.activeTransactions.delete(`${timingId}_sentry`);
      }
    }

    // Clean up
    this.activeTransactions.delete(timingId);

    return duration;
  }

  // Measure async operation
  public async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timingId = this.startTiming(operationName, metadata);
    
    try {
      const result = await operation();
      this.endTiming(timingId);
      return result;
    } catch (error) {
      this.endTiming(timingId);
      throw error;
    }
  }

  // Measure sync operation
  public measure<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    const timingId = this.startTiming(operationName, metadata);
    
    try {
      const result = operation();
      this.endTiming(timingId);
      return result;
    } catch (error) {
      this.endTiming(timingId);
      throw error;
    }
  }

  // Record custom performance metric
  public recordMetric(
    name: string,
    value: number,
    unit: string = 'millisecond',
    tags?: Record<string, string>
  ): void {
    if (config.monitoring.enablePerformanceMonitoring && sentryService?.capturePerformanceMetric) {
      sentryService.capturePerformanceMetric(name, value, unit, tags);
    }

    // Also log for local monitoring
    logPerformance(name, Date.now() - value, {
      metric: name,
      value,
      unit,
      tags,
    });
  }

  // Monitor API response times
  public monitorApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const tags = {
      endpoint,
      method,
      status_code: statusCode.toString(),
      ...metadata,
    };

    this.recordMetric('api.response_time', duration, 'millisecond', tags);

    // Log slow API calls
    if (duration > 1000) { // More than 1 second
      logPerformance(`Slow API call: ${method} ${endpoint}`, Date.now() - duration, {
        endpoint,
        method,
        statusCode,
        duration,
        slow: true,
        ...metadata,
      });
    }
  }

  // Monitor database query performance
  public monitorDatabaseQuery(
    query: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const tags = {
      query_type: this.extractQueryType(query),
      ...metadata,
    };

    this.recordMetric('database.query_time', duration, 'millisecond', tags);

    // Log slow queries
    if (duration > 500) { // More than 500ms
      logPerformance(`Slow database query`, Date.now() - duration, {
        query: query.substring(0, 100), // Truncate for logging
        duration,
        slow: true,
        ...metadata,
      });
    }
  }

  // Monitor page load performance
  public monitorPageLoad(
    page: string,
    metrics: {
      fcp?: number; // First Contentful Paint
      lcp?: number; // Largest Contentful Paint
      fid?: number; // First Input Delay
      cls?: number; // Cumulative Layout Shift
      ttfb?: number; // Time to First Byte
    }
  ): void {
    Object.entries(metrics).forEach(([metric, value]) => {
      if (value !== undefined) {
        this.recordMetric(
          `page.${metric}`,
          value,
          metric === 'cls' ? 'ratio' : 'millisecond',
          { page }
        );
      }
    });

    // Log poor Core Web Vitals
    if (metrics.lcp && metrics.lcp > 2500) {
      logPerformance(`Poor LCP on ${page}`, Date.now() - metrics.lcp, {
        page,
        lcp: metrics.lcp,
        poor_performance: true,
      });
    }

    if (metrics.fid && metrics.fid > 100) {
      logPerformance(`Poor FID on ${page}`, Date.now() - metrics.fid, {
        page,
        fid: metrics.fid,
        poor_performance: true,
      });
    }

    if (metrics.cls && metrics.cls > 0.1) {
      logPerformance(`Poor CLS on ${page}`, Date.now(), {
        page,
        cls: metrics.cls,
        poor_performance: true,
      });
    }
  }

  // Extract query type from SQL
  private extractQueryType(query: string): string {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'select';
    if (trimmed.startsWith('insert')) return 'insert';
    if (trimmed.startsWith('update')) return 'update';
    if (trimmed.startsWith('delete')) return 'delete';
    if (trimmed.startsWith('create')) return 'create';
    if (trimmed.startsWith('alter')) return 'alter';
    if (trimmed.startsWith('drop')) return 'drop';
    return 'other';
  }

  // Get performance summary
  public getPerformanceSummary(): {
    activeTransactions: number;
    totalMeasurements: number;
  } {
    return {
      activeTransactions: this.activeTransactions.size,
      totalMeasurements: 0, // Could be tracked if needed
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const startTiming = (operationName: string, metadata?: Record<string, any>) =>
  performanceMonitor.startTiming(operationName, metadata);

export const endTiming = (timingId: string) =>
  performanceMonitor.endTiming(timingId);

export const measureAsync = <T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
) => performanceMonitor.measureAsync(operationName, operation, metadata);

export const measure = <T>(
  operationName: string,
  operation: () => T,
  metadata?: Record<string, any>
) => performanceMonitor.measure(operationName, operation, metadata);

export const recordMetric = (
  name: string,
  value: number,
  unit?: string,
  tags?: Record<string, string>
) => performanceMonitor.recordMetric(name, value, unit, tags);

export const monitorApiCall = (
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
) => performanceMonitor.monitorApiCall(endpoint, method, statusCode, duration, metadata);

export const monitorDatabaseQuery = (
  query: string,
  duration: number,
  metadata?: Record<string, any>
) => performanceMonitor.monitorDatabaseQuery(query, duration, metadata);

export const monitorPageLoad = (
  page: string,
  metrics: Parameters<typeof performanceMonitor.monitorPageLoad>[1]
) => performanceMonitor.monitorPageLoad(page, metrics);

export default performanceMonitor;