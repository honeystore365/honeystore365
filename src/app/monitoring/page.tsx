import { AlertDashboard } from '@/components/monitoring/AlertDashboard';
import { ComprehensiveDashboard } from '@/components/monitoring/ComprehensiveDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MonitoringPage() {
  return (
    <div className='container mx-auto py-8'>
      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='alerts'>Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='mt-6'>
          <ComprehensiveDashboard />
        </TabsContent>

        <TabsContent value='alerts' className='mt-6'>
          <AlertDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
