// Export Sentry service and utilities
export {
    addBreadcrumb,
    captureBusinessEvent, captureError,
    captureMessage, captureSecurityEvent, sentryService, setUser
} from './sentry';

// Export performance monitoring utilities
export {
    endTiming, measure, measureAsync, monitorApiCall,
    monitorDatabaseQuery,
    monitorPageLoad, performanceMonitor, recordMetric, startTiming
} from './performance';

// Export metrics collection utilities
export {
    metricsCollector,
    recordCartEvent, recordFeatureUsage, recordFunnelStep, recordOrderEvent,
    recordProductEvent,
    recordUserEvent
} from './metrics';

// Export alert configuration
export {
    alertConfig, checkCartAbandonmentAlert,
    checkDatabaseAlert, checkErrorAlert, checkOrderFailureAlert, checkPerformanceAlert, checkSecurityAlert
} from './alerts';

// Export monitoring middleware
export {
    trackBusinessEventDecorator, trackUserAction, withComponentMonitoring, withDatabaseMonitoring, withMonitoring
} from './middleware';

// Re-export types
export type {
    AbTestEvent,
    AbTestResult, AlertAction,
    AlertEvent, AlertRule, ApiPerformanceMetrics, BusinessMetric, DashboardChart, DashboardMetric, DatabasePerformanceMetrics, EcommerceMetrics, ErrorMetric, FeatureUsageAnalysis, FeatureUsageEvent, FunnelAnalysis, FunnelStep, MonitoringConfig, MonitoringDashboard, PagePerformanceMetrics, PerformanceMetric, SecurityEvent, ServiceHealth
} from './types';

// Export business metrics tracking
export {
    businessMetricsTracker, trackCartAbandonment,
    trackConversion, trackConversionStep, trackCustomerValue, trackRevenue
} from './business';

// Export Vercel Analytics integration
export {
    integrateWithMonitoring, trackAbTest, trackBusinessEvent,
    trackEcommerceEvent,
    trackEngagement, trackError, trackEvent, trackFunnelStep, trackPerformance, vercelAnalytics
} from './vercel-analytics';

// Export API middleware
export { withApiMonitoring } from './api-middleware';
