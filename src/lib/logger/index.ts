// Sentry service disabled
let sentryService: any = null;

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Log metadata interface
export interface LogMetadata {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  action?: string;
  component?: string;
  timestamp?: Date;
  [key: string]: any;
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: LogMetadata;
  error?: Error;
}

// Logger interface
export interface ILogger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, error?: Error, metadata?: LogMetadata): void;
  log(level: LogLevel, message: string, error?: Error, metadata?: LogMetadata): void;
}

// Logger implementation
class Logger implements ILogger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.minLevel = LogLevel.INFO; // Default level
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const metadata = entry.metadata ? JSON.stringify(entry.metadata) : '';

    let logMessage = `[${timestamp}] ${level}: ${entry.message}`;

    if (metadata) {
      logMessage += ` | ${metadata}`;
    }

    if (entry.error) {
      logMessage += `\nError: ${entry.error.message}`;
      if (this.isDevelopment && entry.error.stack) {
        logMessage += `\nStack: ${entry.error.stack}`;
      }
    }

    return logMessage;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedMessage = this.formatLogEntry(entry);

    // Send to Sentry for error tracking
    this.sendToSentry(entry);

    // In development, use console methods for better formatting
    if (this.isDevelopment) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    } else {
      // In production, use structured logging
      const logData = {
        timestamp: entry.timestamp.toISOString(),
        level: LogLevel[entry.level],
        message: entry.message,
        metadata: entry.metadata,
        error: entry.error
          ? {
              message: entry.error.message,
              stack: entry.error.stack,
              name: entry.error.name,
            }
          : undefined,
      };

      console.log(JSON.stringify(logData));
    }
  }

  private sendToSentry(entry: LogEntry): void {
    // Only send warnings and errors to Sentry to avoid noise
    if (entry.level < LogLevel.WARN || !sentryService) {
      return;
    }

    try {
      if (entry.error) {
        // Send error with context
        sentryService.captureError(entry.error, entry.metadata);
      } else {
        // Send message with appropriate level
        sentryService.captureMessage(entry.message, entry.level, entry.metadata);
      }

      // Add breadcrumb for context
      sentryService.addBreadcrumb(
        entry.message,
        entry.metadata?.component || 'logger',
        entry.level === LogLevel.ERROR ? 'error' : 'warning',
        entry.metadata
      );
    } catch (sentryError) {
      // Don't let Sentry errors break the logging system
      console.error('Failed to send log to Sentry:', sentryError);
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, undefined, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, undefined, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, undefined, metadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.log(LogLevel.ERROR, message, error, metadata);
  }

  log(level: LogLevel, message: string, error?: Error, metadata?: LogMetadata): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        timestamp: new Date(),
      },
      error,
    };

    this.writeLog(entry);
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export logger instance and utilities
export { logger };
export default logger;

// Convenience functions for common logging patterns
export const logError = (message: string, error: Error, metadata?: LogMetadata) => {
  logger.error(message, error, metadata);
};

export const logInfo = (message: string, metadata?: LogMetadata) => {
  logger.info(message, metadata);
};

export const logWarn = (message: string, metadata?: LogMetadata) => {
  logger.warn(message, metadata);
};

export const logDebug = (message: string, metadata?: LogMetadata) => {
  logger.debug(message, metadata);
};

// Request logging middleware helper
export const createRequestLogger = (requestId: string, userId?: string) => {
  return {
    debug: (message: string, metadata?: LogMetadata) => logger.debug(message, { ...metadata, requestId, userId }),
    info: (message: string, metadata?: LogMetadata) => logger.info(message, { ...metadata, requestId, userId }),
    warn: (message: string, metadata?: LogMetadata) => logger.warn(message, { ...metadata, requestId, userId }),
    error: (message: string, error?: Error, metadata?: LogMetadata) =>
      logger.error(message, error, { ...metadata, requestId, userId }),
  };
};

// Performance logging utility
export const logPerformance = (operation: string, startTime: number, metadata?: LogMetadata) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation} completed in ${duration}ms`, {
    ...metadata,
    operation,
    duration,
    performance: true,
  });
};

// Business event logging
export const logBusinessEvent = (event: string, data?: Record<string, any>, metadata?: LogMetadata) => {
  logger.info(`Business Event: ${event}`, {
    ...metadata,
    event,
    data,
    businessEvent: true,
  });
  
  // Also send to Sentry for business analytics
  if (sentryService) {
    try {
      sentryService.captureBusinessEvent(event, data, metadata);
    } catch (error) {
      console.error('Failed to send business event to Sentry:', error);
    }
  }
};

// Security event logging
export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high', metadata?: LogMetadata) => {
  const logLevel = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
  logger.log(logLevel, `Security Event: ${event}`, undefined, {
    ...metadata,
    event,
    severity,
    securityEvent: true,
  });
  
  // Also send to Sentry for security monitoring
  if (sentryService) {
    try {
      sentryService.captureSecurityEvent(event, severity, metadata);
    } catch (error) {
      console.error('Failed to send security event to Sentry:', error);
    }
  }
};
