// Logger types and interfaces

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  traceId?: string;
  metadata?: Record<string, any>;
}

export interface BusinessEventData {
  event: string;
  category: 'user' | 'product' | 'order' | 'cart' | 'auth' | 'system';
  data?: Record<string, any>;
  userId?: string;
}

export interface SecurityEventData {
  event: string;
  severity: 'low' | 'medium' | 'high';
  category: 'auth' | 'access' | 'data' | 'system';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PerformanceEventData {
  operation: string;
  duration: number;
  category: 'api' | 'database' | 'external' | 'computation';
  metadata?: Record<string, any>;
}

export interface ErrorEventData {
  error: Error;
  category: 'business' | 'validation' | 'network' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: LogContext;
  recoverable?: boolean;
}

// Log formatters
export type LogFormatter = (entry: any) => string;

// Log transports
export interface LogTransport {
  name: string;
  log(entry: any): void | Promise<void>;
}

// Logger configuration
export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile?: boolean;
  enableRemote?: boolean;
  formatter?: LogFormatter;
  transports?: LogTransport[];
  context?: LogContext;
}
