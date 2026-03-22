// Minimal monitoring configuration
// Extracted from deleted lib/config to fix monitoring dependencies

export const monitoringConfig = {
  enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
  enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;
