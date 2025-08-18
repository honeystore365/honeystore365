'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { alertConfig, metricsCollector, performanceMonitor } from '@/lib/monitoring';
import { useEffect, useState } from 'react';
import { config } from '@/lib/config';
// sentryService disabled
const sentryService: { captureError?: (error: Error, context?: any) => void } | null = null;

interface MonitoringStats {
  performance: {
    activeTransactions: number;
    totalMeasurements: number;
  };
  metrics: {
    bufferedMetrics: number;
    totalRecorded: number;
  };
  alerts: {
    totalRules: number;
    enabledRules: number;
    activeEvents: number;
  };
}

export function MonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  useEffect(() => {
    setIsVisible(config.app.environment === 'development');
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      setStats({
        performance: performanceMonitor.getPerformanceSummary(),
        metrics: metricsCollector.getMetricsSummary(),
        alerts: alertConfig.getStats(),
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleFlushMetrics = () => {
    metricsCollector.flush();
    console.log('Metrics flushed manually');
  };

  const handleTestAlert = () => {
    alertConfig.checkAlert('high_error_rate', 15, {
      test: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleTestError = () => {
    const testError = new Error('Test error for monitoring');
    if (sentryService?.captureError) {
      sentryService.captureError(testError, {
        test: true,
        component: 'MonitoringDashboard',
      });
    } else {
      console.error('Test error for monitoring:', testError);
    }
  };

  if (!isVisible || !stats) {
    return null;
  }

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <Card className='w-96 max-h-96 overflow-auto bg-white/95 backdrop-blur-sm border shadow-lg'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm flex items-center justify-between'>
            🔍 Monitoring Dashboard
            <Badge variant='outline' className='text-xs'>
              {config.app.environment}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <Tabs defaultValue='overview' className='w-full'>
            <TabsList className='grid w-full grid-cols-3 text-xs'>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='metrics'>Metrics</TabsTrigger>
              <TabsTrigger value='alerts'>Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value='overview' className='space-y-2 mt-2'>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                <div className='p-2 bg-blue-50 rounded'>
                  <div className='font-medium'>Performance</div>
                  <div>Active: {stats.performance.activeTransactions}</div>
                </div>
                <div className='p-2 bg-green-50 rounded'>
                  <div className='font-medium'>Metrics</div>
                  <div>Buffered: {stats.metrics.bufferedMetrics}</div>
                </div>
                <div className='p-2 bg-yellow-50 rounded'>
                  <div className='font-medium'>Alerts</div>
                  <div>
                    Rules: {stats.alerts.enabledRules}/{stats.alerts.totalRules}
                  </div>
                </div>
                <div className='p-2 bg-purple-50 rounded'>
                  <div className='font-medium'>Sentry</div>
                  <div className={config.monitoring.sentryDsn ? 'text-green-600' : 'text-red-600'}>
                    {config.monitoring.sentryDsn ? 'Connected' : 'Not configured'}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='metrics' className='space-y-2 mt-2'>
              <div className='space-y-2'>
                <div className='flex justify-between items-center text-xs'>
                  <span>Buffered Metrics:</span>
                  <Badge variant='secondary'>{stats.metrics.bufferedMetrics}</Badge>
                </div>
                <Button size='sm' variant='outline' onClick={handleFlushMetrics} className='w-full text-xs'>
                  Flush Metrics
                </Button>
                <div className='text-xs text-gray-600'>
                  Metrics are automatically flushed every minute in production.
                </div>
              </div>
            </TabsContent>

            <TabsContent value='alerts' className='space-y-2 mt-2'>
              <div className='space-y-2'>
                <div className='flex justify-between items-center text-xs'>
                  <span>Total Rules:</span>
                  <Badge variant='secondary'>{stats.alerts.totalRules}</Badge>
                </div>
                <div className='flex justify-between items-center text-xs'>
                  <span>Enabled:</span>
                  <Badge variant='secondary'>{stats.alerts.enabledRules}</Badge>
                </div>
                <div className='flex justify-between items-center text-xs'>
                  <span>Active Events:</span>
                  <Badge variant='secondary'>{stats.alerts.activeEvents}</Badge>
                </div>
                <div className='space-y-1'>
                  <Button size='sm' variant='outline' onClick={handleTestAlert} className='w-full text-xs'>
                    Test Alert
                  </Button>
                  <Button size='sm' variant='outline' onClick={handleTestError} className='w-full text-xs'>
                    Test Error
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className='mt-2 pt-2 border-t text-xs text-gray-500'>
            <div>Monitoring: {config.monitoring.enableErrorTracking ? '✅' : '❌'} Errors</div>
            <div>Performance: {config.monitoring.enablePerformanceMonitoring ? '✅' : '❌'} Tracking</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MonitoringDashboard;
