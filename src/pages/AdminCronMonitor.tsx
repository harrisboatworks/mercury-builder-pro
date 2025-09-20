import { CronJobMonitor } from '@/components/admin/CronJobMonitor';

export default function AdminCronMonitor() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cron Job Monitor</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage automated Mercury inventory sync jobs
        </p>
      </div>
      
      <CronJobMonitor />
    </div>
  );
}