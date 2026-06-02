import {
  OverviewAnalyticsSkeleton,
  OverviewStatsSkeleton,
} from '@/components/dashboard/DashboardPageSkeleton';

function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />;
}

export default function DashboardHomeLoading() {
  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-8">
      <div className="space-y-2">
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-full max-w-md" />
      </div>
      <OverviewStatsSkeleton />
      <OverviewAnalyticsSkeleton />
      <Bone className="h-64 w-full" />
    </div>
  );
}
