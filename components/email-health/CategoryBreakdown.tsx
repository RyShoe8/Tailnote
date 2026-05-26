import { Badge } from '@/components/ui/badge';
import { getCategoryGuide } from '@/lib/email-health/categoryGuide';
import type { CategoryResult, EmailHealthCategory } from '@/lib/email-health/types';

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
  stepsByCategory?: Partial<Record<EmailHealthCategory, string[]>>;
};

export function CategoryBreakdown({ categories, stepsByCategory }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((cat) => {
        const guide = getCategoryGuide(cat.category);
        const passSteps =
          cat.status !== 'pass'
            ? stepsByCategory?.[cat.category] ?? guide.defaultStepsToPass
            : undefined;

        return (
          <div
            key={cat.category}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{guide.label}</p>
              <Badge variant={statusVariant(cat.status)}>{statusLabel(cat.status)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{cat.summary}</p>
            <p className="mt-2 text-xs text-muted-foreground">{guide.whatItChecks}</p>
            <p className="mt-2 text-xs font-medium text-foreground">
              {cat.points}/{cat.maxPoints} pts
            </p>
            {passSteps && passSteps.length > 0 ? (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-foreground">
                  To earn full {cat.maxPoints} points:
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                  {passSteps.slice(0, 3).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                {passSteps.length > 3 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    +{passSteps.length - 3} more in problems below
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
