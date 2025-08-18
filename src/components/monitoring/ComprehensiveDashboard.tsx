'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { alertConfig, businessMetricsTracker, metricsCollector, performanceMonitor } from '@/lib/monitoring';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  DollarSign,
  Shield,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { config } from '@/lib/config';

interface DashboardMetric {
  name: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export function ComprehensiveDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

  // Only show in development or when explicitly enabled
  useEffect(() => {
    const shouldShow =
      config.app.environment === 'development' || localStorage.getItem('show-monitoring-dashboard') === 'true';
    setIsVisible(shouldShow);
  }, []);

  // Update real-time data
  useEffect(() => {
    if (!isVisible) return;

    const updateData = () => {
      setRealTimeData({
        performance: performanceMonitor.getPerformanceSummary(),
        metrics: metricsCollector.getMetricsSummary(),
        alerts: alertConfig.getStats(),
        business: businessMetricsTracker.getBusinessSummary(),
        timestamp: new Date(),
      });
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo((): DashboardMetric[] => {
    if (!realTimeData) return [];

    return [
      {
        name: 'Active Transactions',
        value: realTimeData.performance.activeTransactions,
        format: 'number',
        status: realTimeData.performance.activeTransactions > 10 ? 'warning' : 'good',
        icon: <Activity className='h-4 w-4' />,
      },
      {
        name: 'Buffered Metrics',
        value: realTimeData.metrics.bufferedMetrics,
        format: 'number',
        status: realTimeData.metrics.bufferedMetrics > 50 ? 'warning' : 'good',
        icon: <BarChart3 className='h-4 w-4' />,
      },
      {
        name: 'Active Alerts',
        value: realTimeData.alerts.activeEvents,
        format: 'number',
        status: realTimeData.alerts.activeEvents > 0 ? 'critical' : 'good',
        icon: <AlertTriangle className='h-4 w-4' />,
      },
      {
        name: 'Alert Rules',
        value: `${realTimeData.alerts.enabledRules}/${realTimeData.alerts.totalRules}`,
        format: 'number',
        status: 'good',
        icon: <Shield className='h-4 w-4' />,
      },
      {
        name: 'Conversion Funnels',
        value: realTimeData.business.activeFunnels,
        format: 'number',
        status: 'good',
        icon: <TrendingUp className='h-4 w-4' />,
      },
      {
        name: 'Active Sessions',
        value: realTimeData.business.activeSessions,
        format: 'number',
        status: 'good',
        icon: <Users className='h-4 w-4' />,
      },
    ];
  }, [realTimeData]);

  // Mock chart data (in a real implementation, this would come from your metrics)
  const performanceChartData: ChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Response Time (ms)',
        data: [120, 150, 180, 200, 170, 140],
        color: '#3b82f6',
      },
      {
        label: 'Error Rate (%)',
        data: [0.5, 0.8, 1.2, 0.9, 0.6, 0.4],
        color: '#ef4444',
      },
    ],
  };

  const businessChartData: ChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Conversions',
        data: [12, 19, 15, 25, 22, 18, 20],
        color: '#10b981',
      },
      {
        label: 'Cart Abandonment',
        data: [8, 12, 10, 15, 13, 9, 11],
        color: '#f59e0b',
      },
    ],
  };

  const formatMetricValue = (metric: DashboardMetric): string => {
    if (typeof metric.value === 'string') return metric.value;

    switch (metric.format) {
      case 'percentage':
        return `${metric.value}%`;
      case 'currency':
        return `$${metric.value.toLocaleString()}`;
      case 'duration':
        return `${metric.value}ms`;
      default:
        return metric.value.toLocaleString();
    }
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isVisible || !realTimeData) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <Activity className='h-6 w-6 text-blue-600' />
              <h1 className='text-2xl font-bold'>Monitoring Dashboard</h1>
              <Badge variant='outline' className='text-xs'>
                {config.app.environment}
              </Badge>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex gap-1'>
                {['1h', '24h', '7d'].map(range => (
                  <Button
                    key={range}
                    size='sm'
                    variant={selectedTimeRange === range ? 'default' : 'outline'}
                    onClick={() => setSelectedTimeRange(range as any)}
                    className='text-xs'
                  >
                    {range}
                  </Button>
                ))}
              </div>
              <Button size='sm' variant='outline' onClick={() => setIsVisible(false)}>
                Close
              </Button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6'>
            {dashboardMetrics.map((metric, index) => (
              <Card key={index} className='p-3'>
                <div className='flex items-center justify-between mb-2'>
                  <div className={`p-1 rounded ${getStatusColor(metric.status)}`}>{metric.icon}</div>
                  {metric.status === 'critical' && <AlertTriangle className='h-4 w-4 text-red-500' />}
                </div>
                <div className='text-2xl font-bold mb-1'>{formatMetricValue(metric)}</div>
                <div className='text-xs text-gray-600'>{metric.name}</div>
              </Card>
            ))}
          </div>

          <Tabs defaultValue='overview' className='w-full'>
            <TabsList className='grid w-full grid-cols-5'>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='performance'>Performance</TabsTrigger>
              <TabsTrigger value='business'>Business</TabsTrigger>
              <TabsTrigger value='alerts'>Alerts</TabsTrigger>
              <TabsTrigger value='system'>System</TabsTrigger>
            </TabsList>

            <TabsContent value='overview' className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm'>System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm'>Error Tracking</span>
                        <div className='flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          <span className='text-sm'>Active</span>
                        </div>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm'>Performance Monitoring</span>
                        <div className='flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          <span className='text-sm'>Active</span>
                        </div>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm'>Business Metrics</span>
                        <div className='flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          <span className='text-sm'>Active</span>
                        </div>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm'>Sentry Integration</span>
                        <div className='flex items-center gap-2'>
                          {config.monitoring.sentryDsn ? (
                            <CheckCircle className='h-4 w-4 text-green-500' />
                          ) : (
                            <AlertTriangle className='h-4 w-4 text-yellow-500' />
                          )}
                          <span className='text-sm'>
                            {config.monitoring.sentryDsn ? 'Connected' : 'Not configured'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm'>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2 text-xs'>
                      <div className='flex justify-between'>
                        <span>Last metric flush</span>
                        <span className='text-gray-500'>2 min ago</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Last performance check</span>
                        <span className='text-gray-500'>30 sec ago</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Last alert check</span>
                        <span className='text-gray-500'>1 min ago</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Dashboard updated</span>
                        <span className='text-gray-500'>{realTimeData.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='performance' className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm'>Response Time Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='h-32 flex items-center justify-center text-gray-500'>
                      <div className='text-center'>
                        <BarChart3 className='h-8 w-8 mx-auto mb-2' />
                        <div className='text-sm'>Chart visualization would go here</div>
                        <div className='text-xs'>Avg: 150ms | P95: 300ms</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm'>Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm'>Current Error Rate</span>
                        <Badge variant='outline' className='text-green-600'>
                          0.2%
                        </Badge>
                      </div>
                      <Progress value={0.2} className='h-2' />
                      <div className='text-xs text-gray-500'>Target: &lt; 1% | Last 24h: 0.15%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='business' className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <ShoppingCart className='h-4 w-4' />
                      Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold text-green-600'>3.2%</div>
                    <div className='text-xs text-gray-500'>+0.3% from last week</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <TrendingDown className='h-4 w-4' />
                      Cart Abandonment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold text-yellow-600'>68%</div>
                    <div className='text-xs text-gray-500'>-2% from last week</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <DollarSign className='h-4 w-4' />
                      Revenue Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold text-blue-600'>$2,450</div>
                    <div className='text-xs text-gray-500'>+12% from yesterday</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='alerts' className='space-y-4'>
              <div className='space-y-3'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm'>Alert Rules Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      {[
                        { name: 'High Error Rate', status: 'active', threshold: '10 errors/5min' },
                        { name: 'Slow API Response', status: 'active', threshold: '2s avg' },
                        { name: 'Failed Orders', status: 'active', threshold: '5 failures/15min' },
                        { name: 'Security Events', status: 'active', threshold: '3 events/5min' },
                      ].map((rule, index) => (
                        <div key={index} className='flex justify-between items-center p-2 bg-gray-50 rounded'>
                          <div>
                            <div className='text-sm font-medium'>{rule.name}</div>
                            <div className='text-xs text-gray-500'>{rule.threshold}</div>
                          </div>
                          <Badge variant='outline' className='text-green-600'>
                            {rule.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='system' className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm'>Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2 text-xs'>
                      <div className='flex justify-between'>
                        <span>Environment</span>
                        <Badge variant='outline'>{config.app.environment}</Badge>
                      </div>
                      <div className='flex justify-between'>
                        <span>Log Level</span>
                        <Badge variant='outline'>{config.logging.level}</Badge>
                      </div>
                      <div className='flex justify-between'>
                        <span>Error Tracking</span>
                        <Badge variant={config.monitoring.enableErrorTracking ? 'default' : 'secondary'}>
                          {config.monitoring.enableErrorTracking ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className='flex justify-between'>
                        <span>Performance Monitoring</span>
                        <Badge variant={config.monitoring.enablePerformanceMonitoring ? 'default' : 'secondary'}>
                          {config.monitoring.enablePerformanceMonitoring ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm'>Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='w-full text-xs'
                        onClick={() => metricsCollector.flush()}
                      >
                        Flush Metrics
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        className='w-full text-xs'
                        onClick={() => alertConfig.cleanup()}
                      >
                        Cleanup Alerts
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        className='w-full text-xs'
                        onClick={() => businessMetricsTracker.cleanup()}
                      >
                        Cleanup Business Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Toggle button component
export function MonitoringDashboardToggle() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shouldShow = config.app.environment === 'development';
    setIsVisible(shouldShow);
  }, []);

  const toggleDashboard = () => {
    const current = localStorage.getItem('show-monitoring-dashboard') === 'true';
    localStorage.setItem('show-monitoring-dashboard', (!current).toString());
    window.location.reload(); // Simple way to toggle
  };

  if (!isVisible) return null;

  return (
    <Button size='sm' variant='outline' onClick={toggleDashboard} className='fixed bottom-4 left-4 z-40'>
      <Activity className='h-4 w-4 mr-2' />
      Monitoring
    </Button>
  );
}

export default ComprehensiveDashboard;
