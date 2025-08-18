// Performance monitoring types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

// Business metrics types
export interface BusinessMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

// Alert rule types
export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  timeWindow: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  description: string;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'sentry' | 'log';
  target: string;
  template?: string;
}

export interface AlertEvent {
  rule: AlertRule;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Monitoring configuration types
export interface MonitoringConfig {
  sentry: {
    dsn?: string;
    environment: string;
    release?: string;
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
    debug: boolean;
  };
  performance: {
    enabled: boolean;
    apiMonitoring: boolean;
    databaseMonitoring: boolean;
    pageLoadMonitoring: boolean;
    customMetrics: boolean;
  };
  alerts: {
    enabled: boolean;
    rules: AlertRule[];
    defaultActions: AlertAction[];
  };
  metrics: {
    enabled: boolean;
    bufferSize: number;
    flushInterval: number;
    businessEvents: boolean;
    performanceEvents: boolean;
  };
}

// E-commerce specific metric types
export interface EcommerceMetrics {
  cart: {
    addToCart: number;
    removeFromCart: number;
    cartView: number;
    cartAbandon: number;
    cartConversion: number;
  };
  orders: {
    created: number;
    completed: number;
    cancelled: number;
    failed: number;
    totalValue: number;
    averageValue: number;
  };
  products: {
    views: number;
    searches: number;
    filters: number;
    conversions: number;
  };
  users: {
    registrations: number;
    logins: number;
    profileUpdates: number;
    activeUsers: number;
  };
}

// Performance tracking types
export interface PagePerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  domContentLoaded?: number;
  loadComplete?: number;
}

export interface ApiPerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize?: number;
  responseSize?: number;
  userAgent?: string;
  userId?: string;
}

export interface DatabasePerformanceMetrics {
  query: string;
  queryType: 'select' | 'insert' | 'update' | 'delete' | 'other';
  duration: number;
  rowsAffected?: number;
  error?: string;
}

// Error tracking types
export interface ErrorMetric {
  type: string;
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

// Security event types
export interface SecurityEvent {
  type: 'authentication_failure' | 'authorization_failure' | 'suspicious_activity' | 'data_breach' | 'injection_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  details: Record<string, any>;
  timestamp: Date;
}

// Funnel tracking types
export interface FunnelStep {
  funnel: string;
  step: string;
  stepOrder: number;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface FunnelAnalysis {
  funnel: string;
  totalUsers: number;
  steps: {
    step: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
  }[];
  overallConversionRate: number;
}

// A/B test types
export interface AbTestEvent {
  testName: string;
  variant: string;
  event: string;
  userId?: string;
  value?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AbTestResult {
  testName: string;
  variants: {
    name: string;
    users: number;
    conversions: number;
    conversionRate: number;
    averageValue?: number;
  }[];
  statisticalSignificance?: number;
  winner?: string;
}

// Feature usage types
export interface FeatureUsageEvent {
  feature: string;
  action: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface FeatureUsageAnalysis {
  feature: string;
  totalUsers: number;
  totalUsage: number;
  averageUsagePerUser: number;
  topActions: {
    action: string;
    count: number;
    percentage: number;
  }[];
}

// Dashboard types
export interface DashboardMetric {
  name: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  status?: 'good' | 'warning' | 'critical';
}

export interface DashboardChart {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color?: string;
    }[];
  };
  timeRange?: string;
}

export interface MonitoringDashboard {
  title: string;
  description?: string;
  metrics: DashboardMetric[];
  charts: DashboardChart[];
  alerts: {
    active: number;
    critical: number;
    warnings: number;
  };
  lastUpdated: Date;
}

// Export utility types
export type MetricValue = number | string | boolean;
export type MetricTags = Record<string, string>;
export type MetricMetadata = Record<string, any>;

export type MonitoringEventType = 
  | 'performance'
  | 'business'
  | 'error'
  | 'security'
  | 'user'
  | 'system';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertActionType = 'email' | 'webhook' | 'sentry' | 'log';

// Configuration validation types
export interface MonitoringValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime?: number;
  errorRate?: number;
  details?: Record<string, any>;
}