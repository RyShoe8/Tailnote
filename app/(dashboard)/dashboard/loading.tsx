import { OverviewAnalyticsSkeleton } from '@/components/dashboard/DashboardPageSkeleton';

function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />;
}

export default function DashboardHomeLoading() {
  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-8">
      <OverviewAnalyticsSkeleton />
      <Bone className="h-64 w-full" />
    </div>
  );
}
