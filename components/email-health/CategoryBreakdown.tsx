import { Badge } from '@/components/ui/badge';
import type { CategoryResult } from '@/lib/email-health/types';

const LABELS: Record<CategoryResult['category'], string> = {
  spf: 'SPF',
  dkim: 'DKIM',
  dmarc: 'DMARC',
  bimi: 'BIMI',
  mx: 'Mail routing',
  tls: 'SMTP TLS',
  https: 'HTTPS',
};

function statusVariant(status: CategoryResult['status']) {
  if (status === 'pass') return 'accent' as const;
  if (status === 'warn') return 'outline' as const;
  return 'default' as const;
}

function statusLabel(status: CategoryResult['status']) {
  if (status === 'pass') return 'Pass';
  if (status === 'warn') return 'Warn';
  return 'Fail';
}

type Props = {
  categories: CategoryResult[];
};

export function CategoryBreakdown({ categories }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((cat) => (
        <div
          key={cat.category}
          className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{LABELS[cat.category]}</p>
            <Badge variant={statusVariant(cat.status)}>{statusLabel(cat.status)}</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{cat.summary}</p>
          <p className="mt-2 text-xs font-medium text-foreground">
            {cat.points}/{cat.maxPoints} pts
          </p>
        </div>
      ))}
    </div>
  );
}
