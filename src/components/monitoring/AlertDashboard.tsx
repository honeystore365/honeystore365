'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { alertConfig, AlertRule } from '@/lib/monitoring';
import { Activity, AlertTriangle, CheckCircle, Clock, Settings, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { config } from '@/lib/config';

interface AlertEvent {
  id: string;
  ruleName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  value: number;
  threshold: number;
  resolved: boolean;
}

export function AlertDashboard() {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [recentEvents, setRecentEvents] = useState<AlertEvent[]>([]);
  const [stats, setStats] = useState({
    totalRules: 0,
    enabledRules: 0,
    activeEvents: 0,
  });

  // Load alert rules and stats
  useEffect(() => {
    const loadData = () => {
      setAlerts(alertConfig.getAllRules());
      setStats(alertConfig.getStats());

      // Mock recent events (in a real implementation, this would come from a store)
      setRecentEvents([
        {
          id: '1',
          ruleName: 'high_error_rate',
          message: 'Error rate exceeded threshold',
          severity: 'high',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          value: 15,
          threshold: 10,
          resolved: true,
        },
        {
          id: '2',
          ruleName: 'slow_api_response',
          message: 'API response time too slow',
          severity: 'medium',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          value: 2500,
          threshold: 2000,
          resolved: false,
        },
      ]);
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleRule = (ruleName: string) => {
    const rule = alertConfig.getRule(ruleName);
    if (rule) {
      alertConfig.setRule({
        ...rule,
        enabled: !rule.enabled,
      });
      setAlerts(alertConfig.getAllRules());
      setStats(alertConfig.getStats());
    }
  };

  const updateThreshold = (ruleName: string, newThreshold: number) => {
    const rule = alertConfig.getRule(ruleName);
    if (rule) {
      alertConfig.setRule({
        ...rule,
        threshold: newThreshold,
      });
      setAlerts(alertConfig.getAllRules());
    }
  };

  const testAlert = (ruleName: string) => {
    const rule = alertConfig.getRule(ruleName);
    if (rule) {
      alertConfig.checkAlert(ruleName, rule.threshold + 1, {
        test: true,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className='h-4 w-4 text-red-500' />;
      case 'high':
        return <AlertTriangle className='h-4 w-4 text-orange-500' />;
      case 'medium':
        return <Clock className='h-4 w-4 text-yellow-500' />;
      case 'low':
        return <Activity className='h-4 w-4 text-blue-500' />;
      default:
        return <CheckCircle className='h-4 w-4 text-gray-500' />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Shield className='h-6 w-6 text-blue-600' />
          <h1 className='text-2xl font-bold'>Alert Dashboard</h1>
          <Badge variant='outline' className='text-xs'>
            {config.app.environment}
          </Badge>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant={stats.activeEvents > 0 ? 'destructive' : 'secondary'}>{stats.activeEvents} Active</Badge>
          <Badge variant='outline'>
            {stats.enabledRules}/{stats.totalRules} Rules
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total Rules</p>
                <p className='text-2xl font-bold'>{stats.totalRules}</p>
              </div>
              <Settings className='h-8 w-8 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Enabled Rules</p>
                <p className='text-2xl font-bold text-green-600'>{stats.enabledRules}</p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-400' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Active Events</p>
                <p className='text-2xl font-bold text-red-600'>{stats.activeEvents}</p>
              </div>
              <AlertTriangle className='h-8 w-8 text-red-400' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Recent Events</p>
                <p className='text-2xl font-bold'>{recentEvents.length}</p>
              </div>
              <Clock className='h-8 w-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='rules' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='rules'>Alert Rules</TabsTrigger>
          <TabsTrigger value='events'>Recent Events</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value='rules' className='space-y-4'>
          <div className='grid gap-4'>
            {alerts.map(rule => (
              <Card key={rule.name}>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      {getSeverityIcon(rule.severity)}
                      <div>
                        <CardTitle className='text-base'>{rule.name.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                        <p className='text-sm text-gray-600'>{rule.description}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge className={getSeverityColor(rule.severity)}>{rule.severity}</Badge>
                      <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.name)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <Label className='text-xs text-gray-500'>CONDITION</Label>
                      <p className='text-sm font-mono'>{rule.condition}</p>
                    </div>
                    <div>
                      <Label className='text-xs text-gray-500'>THRESHOLD</Label>
                      <div className='flex items-center gap-2'>
                        <Input
                          type='number'
                          value={rule.threshold}
                          onChange={e => updateThreshold(rule.name, Number(e.target.value))}
                          className='w-20 h-8 text-sm'
                        />
                        <span className='text-sm text-gray-500'>/ {rule.timeWindow}min</span>
                      </div>
                    </div>
                    <div>
                      <Label className='text-xs text-gray-500'>ACTIONS</Label>
                      <div className='flex items-center gap-2'>
                        <Button size='sm' variant='outline' onClick={() => testAlert(rule.name)} className='text-xs'>
                          Test
                        </Button>
                        <Badge variant='outline' className='text-xs'>
                          {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='events' className='space-y-4'>
          <div className='space-y-3'>
            {recentEvents.length === 0 ? (
              <Card>
                <CardContent className='p-8 text-center'>
                  <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>No Recent Events</h3>
                  <p className='text-gray-500'>All systems are running smoothly.</p>
                </CardContent>
              </Card>
            ) : (
              recentEvents.map(event => (
                <Card key={event.id}>
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3'>
                        {getSeverityIcon(event.severity)}
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h4 className='font-medium'>{event.message}</h4>
                            <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                            {event.resolved && (
                              <Badge variant='outline' className='text-green-600'>
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className='text-sm text-gray-600 mb-2'>Rule: {event.ruleName.replace(/_/g, ' ')}</p>
                          <div className='flex items-center gap-4 text-xs text-gray-500'>
                            <span>Value: {event.value}</span>
                            <span>Threshold: {event.threshold}</span>
                            <span>{formatTimeAgo(event.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {event.value > event.threshold ? (
                          <TrendingUp className='h-4 w-4 text-red-500' />
                        ) : (
                          <TrendingDown className='h-4 w-4 text-green-500' />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value='settings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-sm font-medium'>Email Notifications</Label>
                  <p className='text-xs text-gray-500'>Receive alerts via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-sm font-medium'>Webhook Notifications</Label>
                  <p className='text-xs text-gray-500'>Send alerts to external services</p>
                </div>
                <Switch />
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-sm font-medium'>Sentry Integration</Label>
                  <p className='text-xs text-gray-500'>Forward alerts to Sentry</p>
                </div>
                <Switch defaultChecked={!!config.monitoring.sentryDsn} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Alert Thresholds</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm'>Default Time Window (minutes)</Label>
                  <Input type='number' defaultValue='5' className='mt-1' />
                </div>
                <div>
                  <Label className='text-sm'>Cleanup Interval (hours)</Label>
                  <Input type='number' defaultValue='24' className='mt-1' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button variant='outline' onClick={() => alertConfig.cleanup()} className='w-full'>
                Clean Up Old Events
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  alerts.forEach(rule => {
                    if (rule.enabled) {
                      testAlert(rule.name);
                    }
                  });
                }}
                className='w-full'
              >
                Test All Active Rules
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AlertDashboard;
