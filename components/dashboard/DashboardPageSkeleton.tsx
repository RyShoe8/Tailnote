import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export function DashboardPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto min-w-0 max-w-3xl space-y-8', className)}>
      <div className="space-y-2">
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-full max-w-md" />
      </div>
      <Bone className="h-48 w-full" />
    </div>
  );
}

export function OverviewAnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Bone className="h-6 w-56" />
        <Bone className="h-4 w-full max-w-lg" />
      </div>
      <Bone className="h-28 w-full max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
