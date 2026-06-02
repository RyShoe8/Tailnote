import { AdminAnalyticsChart } from '@/components/admin/AdminAnalyticsChart';

export const dynamic = 'force-dynamic';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View growth trends across organizations, users, revenue, and signature engagement.
        </p>
      </div>
      <AdminAnalyticsChart />
    </div>
  );
}
