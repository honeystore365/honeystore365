// Error handler for managing and processing application errors

import { logger, logSecurityEvent } from '../logger';
import { AppError, AuthError, NetworkError, SystemError } from './custom-errors';
import { APIErrorResponse, ErrorContext, ServiceResult, UserFriendlyError } from './types';

export interface IErrorHandler {
  logError(error: Error, context?: ErrorContext): void;
  handleClientError(error: Error, context?: ErrorContext): UserFriendlyError;
  handleServerError(error: Error, context?: ErrorContext): APIErrorResponse;
  handleServiceError<T>(error: Error, context?: ErrorContext): ServiceResult<T>;
  shouldRetry(error: Error): boolean;
  getRetryDelay(error: Error, attempt: number): number;
}

class ErrorHandler implements IErrorHandler {
  private readonly isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log error with appropriate level and context
   */
  logError(error: Error, context?: ErrorContext): void {
    const errorContext = {
      ...context,
      timestamp: new Date(),
      errorName: error.name,
      errorMessage: error.message,
      stack: this.isDevelopment ? error.stack : undefined,
    };

    if (error instanceof AppError) {
      // Log application errors with their severity
      const logLevel = this.getLogLevelFromSeverity(error.severity);

      logger.log(logLevel, `Application Error [${error.code}]: ${error.message}`, error, {
        ...errorContext,
        errorCode: error.code,
        errorSeverity: error.severity,
        errorCategory: error.category,
        errorContext: error.context,
      });

      // Log security events for auth and permission errors
      if (error.category === 'auth' || error.category === 'permission') {
        logSecurityEvent(`${error.category}_error`, error.severity === 'critical' ? 'high' : error.severity, {
          ...errorContext,
          errorCode: error.code,
        });
      }
    } else {
      // Log unexpected errors as critical
      logger.error(`Unexpected Error: ${error.message}`, error, {
        ...errorContext,
        unexpected: true,
      });
    }
  }

  /**
   * Handle client-side errors and return user-friendly messages
   */
  handleClientError(error: Error, context?: ErrorContext): UserFriendlyError {
    this.logError(error, { action: 'client_error', ...context, side: 'client' });

    if (error instanceof AppError) {
      return error.toUserFriendlyError();
    }

    // Handle common JavaScript errors
    if (error.name === 'TypeError') {
      return {
        message: 'حدث خطأ في التطبيق، يرجى إعادة تحميل الصفحة',
        code: 'CLIENT_TYPE_ERROR',
        severity: 'error',
        translationKey: 'errors.client.typeError',
      };
    }

    if (error.name === 'ReferenceError') {
      return {
        message: 'حدث خطأ في التطبيق، يرجى إعادة تحميل الصفحة',
        code: 'CLIENT_REFERENCE_ERROR',
        severity: 'error',
        translationKey: 'errors.client.referenceError',
      };
    }

    // Generic client error
    return {
      message: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى',
      code: 'CLIENT_UNKNOWN_ERROR',
      severity: 'error',
      translationKey: 'errors.client.unknown',
    };
  }

  /**
   * Handle server-side errors and return API responses
   */
  handleServerError(error: Error, context?: ErrorContext): APIErrorResponse {
    this.logError(error, { action: 'server_error', ...context, side: 'server' });

    if (error instanceof AppError) {
      return error.toAPIErrorResponse();
    }

    // Don't expose internal error details in production
    const message = this.isDevelopment ? error.message : 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً';

    return {
      success: false,
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message,
        details: this.isDevelopment ? { stack: error.stack } : undefined,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle service layer errors and return service results
   */
  handleServiceError<T>(error: Error, context?: ErrorContext): ServiceResult<T> {
    const userFriendlyError = this.handleClientError(error, context);

    return {
      success: false,
      error: userFriendlyError,
    };
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error: Error): boolean {
    if (error instanceof AppError) {
      return error.recoveryStrategy === 'retry';
    }

    // Retry network errors and timeouts
    if (error instanceof NetworkError) {
      return error.recoveryStrategy === 'retry';
    }

    // Don't retry auth or validation errors
    if (error instanceof AuthError) {
      return false;
    }

    // Retry system errors
    if (error instanceof SystemError) {
      return true;
    }

    // Default: don't retry unknown errors
    return false;
  }

  /**
   * Get retry delay for an error with exponential backoff
   */
  getRetryDelay(error: Error, attempt: number): number {
    let baseDelay = 1000; // 1 second default

    // Use different base delays based on error type
    if (error instanceof NetworkError) {
      baseDelay = 2000; // 2 seconds for network errors
    } else if (error instanceof SystemError) {
      baseDelay = 3000; // 3 seconds for system errors
    }

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;

    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Get maximum retry attempts for an error
   */
  getMaxRetries(error: Error): number {
    // Return max retries based on recovery strategy
    if (error instanceof AppError && error.recoveryStrategy === 'retry') {
      return 3; // Default retry count
    }

    // Default retry limits
    if (error instanceof NetworkError) {
      return 3;
    }

    if (error instanceof SystemError) {
      return 2;
    }

    return 0;
  }

  /**
   * Convert error severity to log level
   */
  private getLogLevelFromSeverity(severity: string): number {
    switch (severity) {
      case 'low':
        return 1; // INFO
      case 'medium':
        return 2; // WARN
      case 'high':
      case 'critical':
        return 3; // ERROR
      default:
        return 2; // WARN
    }
  }

  /**
   * Create error context from request information
   */
  createRequestContext(
    action: string,
    userId?: string,
    sessionId?: string,
    component?: string,
    metadata?: Record<string, any>
  ): ErrorContext {
    return {
      action,
      userId,
      sessionId,
      component,
      metadata,
      timestamp: new Date(),
    };
  }

  /**
   * Wrap async functions with error handling
   */
  async wrapAsync<T>(fn: () => Promise<T>, context: ErrorContext, maxRetries: number = 0): Promise<ServiceResult<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await fn();
        return { success: true, data: result };
      } catch (error) {
        lastError = error as Error;

        // Log the error
        this.logError(lastError, { ...context, attempt });

        // Check if we should retry
        if (attempt <= maxRetries && this.shouldRetry(lastError)) {
          const delay = this.getRetryDelay(lastError, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    return this.handleServiceError<T>(lastError!, context);
  }

  /**
   * Wrap sync functions with error handling
   */
  wrapSync<T>(fn: () => T, context: ErrorContext): ServiceResult<T> {
    try {
      const result = fn();
      return { success: true, data: result };
    } catch (error) {
      return this.handleServiceError<T>(error as Error, context);
    }
  }
}

// Create singleton error handler instance
export const errorHandler = new ErrorHandler();

// Export convenience functions
export const logError = (error: Error, context?: ErrorContext) => {
  errorHandler.logError(error, context);
};

export const handleClientError = (error: Error, context?: ErrorContext) => {
  return errorHandler.handleClientError(error, context);
};

export const handleServerError = (error: Error, context?: ErrorContext) => {
  return errorHandler.handleServerError(error, context);
};

export const handleServiceError = <T>(error: Error, context?: ErrorContext) => {
  return errorHandler.handleServiceError<T>(error, context);
};

export const shouldRetry = (error: Error) => {
  return errorHandler.shouldRetry(error);
};

export const wrapAsync = <T>(fn: () => Promise<T>, context: ErrorContext, maxRetries?: number) => {
  return errorHandler.wrapAsync(fn, context, maxRetries);
};

export const wrapSync = <T>(fn: () => T, context: ErrorContext) => {
  return errorHandler.wrapSync(fn, context);
};

export default errorHandler;
