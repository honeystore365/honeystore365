'use client';

import { config } from '@/lib/config';
import { businessMetricsTracker, metricsCollector, performanceMonitor } from '@/lib/monitoring';
import { integrateWithMonitoring, vercelAnalytics } from '@/lib/monitoring/vercel-analytics';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { usePathname } from 'next/navigation';
import React, { createContext, useContext, useEffect } from 'react';
import { ComprehensiveDashboard, MonitoringDashboardToggle } from './ComprehensiveDashboard';
// sentryService disabled
const sentryService: { 
  setUser?: (user: any) => void;
  captureError?: (error: Error, context?: any) => void;
} | null = null;

// Monitoring context
interface MonitoringContextType {
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  trackBusinessEvent: (event: string, value?: number, properties?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (name: string, duration: number, properties?: Record<string, any>) => void;
  isEnabled: boolean;
}

const MonitoringContext = createContext<MonitoringContextType | null>(null);

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within MonitoringProvider');
  }
  return context;
}

interface MonitoringProviderProps {
  children: React.ReactNode;
  userId?: string;
  userEmail?: string;
}

export function MonitoringProvider({ children, userId, userEmail }: MonitoringProviderProps) {
  const pathname = usePathname();

  // Initialize monitoring services
  useEffect(() => {
    // Set user context in Sentry
    if ((userId || userEmail) && sentryService?.setUser) {
      sentryService.setUser({
        id: userId,
        email: userEmail,
      });
    }

    // Integrate Vercel Analytics with internal monitoring
    if (config.features.enableAnalytics) {
      integrateWithMonitoring();
    }

    // Start periodic cleanup in production
    if (config.app.environment === 'production') {
      const cleanupInterval = setInterval(
        () => {
          businessMetricsTracker.cleanup();
        },
        60 * 60 * 1000
      ); // Every hour

      return () => clearInterval(cleanupInterval);
    }

    // Return undefined for non-production environments
    return undefined;
  }, [userId, userEmail]);

  // Track page views
  useEffect(() => {
    if (config.features.enableAnalytics) {
      vercelAnalytics.trackEngagement('page_view', {
        page: pathname,
      });
    }

    // Track page view in internal metrics
    metricsCollector.recordMetric(
      'page.view',
      1,
      {
        page: pathname,
        user_id: userId || 'anonymous',
      },
      {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      }
    );
  }, [pathname, userId]);

  // Monitoring context value
  const monitoringValue: MonitoringContextType = {
    trackEvent: (name: string, properties?: Record<string, any>) => {
      // Track in internal metrics
      metricsCollector.recordMetric(name, 1, {
        user_id: userId || 'anonymous',
        ...properties,
      });

      // Track in Vercel Analytics
      if (config.features.enableAnalytics) {
        vercelAnalytics.trackEvent(name, properties);
      }
    },

    trackBusinessEvent: (event: string, value?: number, properties?: Record<string, any>) => {
      // Track in business metrics
      businessMetricsTracker.trackConversion(event as any, value, userId, properties);

      // Track in Vercel Analytics
      if (config.features.enableAnalytics) {
        vercelAnalytics.trackBusinessEvent(event, value, {
          user_id: userId,
          ...properties,
        });
      }
    },

    trackError: (error: Error, context?: Record<string, any>) => {
      // Track in Sentry
      if (sentryService?.captureError) {
        sentryService.captureError(error, {
          user_id: userId,
          page: pathname,
          ...context,
        });
      }

      // Track in Vercel Analytics
      if (config.features.enableAnalytics) {
        vercelAnalytics.trackError(error.name || 'Error', error.message, {
          component: context?.component,
          page: pathname,
          userId,
        });
      }
    },

    trackPerformance: (name: string, duration: number, properties?: Record<string, any>) => {
      // Track in performance monitor
      performanceMonitor.recordMetric(name, duration, 'millisecond', {
        user_id: userId || 'anonymous',
        page: pathname,
        ...properties,
      });

      // Track in Vercel Analytics
      if (config.features.enableAnalytics) {
        vercelAnalytics.trackPerformance(name as any, duration, {
          page: pathname,
          ...properties,
        });
      }
    },

    isEnabled: config.monitoring.enableErrorTracking || config.features.enableAnalytics,
  };

  return (
    <MonitoringContext.Provider value={monitoringValue}>
      {children}

      {/* Vercel Analytics */}
      {config.features.enableAnalytics && <Analytics />}

      {/* Vercel Speed Insights */}
      {config.features.enableAnalytics && <SpeedInsights />}

      {/* Development monitoring dashboard */}
      {config.app.environment === 'development' && (
        <>
          <MonitoringDashboardToggle />
          {typeof window !== 'undefined' && localStorage.getItem('show-monitoring-dashboard') === 'true' && (
            <ComprehensiveDashboard />
          )}
        </>
      )}
    </MonitoringContext.Provider>
  );
}

// Error boundary with monitoring
interface MonitoringErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface MonitoringErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MonitoringErrorBoundary extends React.Component<
  MonitoringErrorBoundaryProps,
  MonitoringErrorBoundaryState
> {
  constructor(props: MonitoringErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MonitoringErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error in monitoring systems
    if (sentryService?.captureError) {
      sentryService.captureError(error, {
        component: 'ErrorBoundary',
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      });
    }

    metricsCollector.recordErrorMetric('react_error_boundary', error.message, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      stack: error.stack,
    });

    if (config.features.enableAnalytics) {
      vercelAnalytics.trackError('react_error_boundary', error.message, {
        component: 'ErrorBoundary',
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-6'>
            <div className='flex items-center mb-4'>
              <div className='flex-shrink-0'>
                <svg className='h-8 w-8 text-red-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-lg font-medium text-gray-900'>Something went wrong</h3>
              </div>
            </div>
            <div className='mb-4'>
              <p className='text-sm text-gray-500'>We've been notified about this error and will fix it soon.</p>
              {config.app.environment === 'development' && (
                <details className='mt-2'>
                  <summary className='text-sm text-gray-700 cursor-pointer'>Error details (development only)</summary>
                  <pre className='mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto'>
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={this.resetError}
              className='w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors'
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MonitoringProvider;
