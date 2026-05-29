import { Clock } from 'lucide-react';

type ReadingTimeBadgeProps = {
  readingTime: string;
  className?: string;
};

export function ReadingTimeBadge({ readingTime, className }: ReadingTimeBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground ${className ?? ''}`}>
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {readingTime}
    </span>
  );
}
