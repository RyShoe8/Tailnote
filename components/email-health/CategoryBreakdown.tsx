import { BimiScoreBreakdown } from '@/components/email-health/BimiScoreBreakdown';
import { getCategoryGuide } from '@/lib/email-health/categoryGuide';
import { sortCategoriesForDisplay } from '@/lib/email-health/categoryDisplay';
import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import { Badge } from '@/components/ui/badge';
import type { CategoryResult, EmailHealthCategory } from '@/lib/email-health/types';
import { cn } from '@/lib/utils';

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
  bimiDetail?: BIMIResult;
};

function CategoryCard({
  cat,
  stepsByCategory,
  bimiDetail,
}: {
  cat: CategoryResult;
  stepsByCategory?: Partial<Record<EmailHealthCategory, string[]>>;
  bimiDetail?: BIMIResult;
}) {
  const guide = getCategoryGuide(cat.category);
  const passSteps =
    cat.status !== 'pass' ? stepsByCategory?.[cat.category] ?? guide.defaultStepsToPass : undefined;
  const isBimi = cat.category === 'bimi' && bimiDetail;

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white p-4 shadow-card',
        isBimi && 'sm:col-span-2 lg:col-span-4',
      )}
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

      {isBimi ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <BimiScoreBreakdown bimi={bimiDetail} compact showInboxPreview />
        </div>
      ) : null}

      {passSteps && passSteps.length > 0 && !isBimi ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-foreground">To earn full {cat.maxPoints} points:</p>
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

      {isBimi && passSteps && passSteps.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          See problems detected below for BIMI fix steps.
        </p>
      ) : null}
    </div>
  );
}

function CategoryGrid({
  items,
  stepsByCategory,
  bimiDetail,
}: {
  items: CategoryResult[];
  stepsByCategory?: Partial<Record<EmailHealthCategory, string[]>>;
  bimiDetail?: BIMIResult;
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((cat) => (
        <CategoryCard
          key={cat.category}
          cat={cat}
          stepsByCategory={stepsByCategory}
          bimiDetail={bimiDetail}
        />
      ))}
    </div>
  );
}

export function CategoryBreakdown({ categories, stepsByCategory, bimiDetail }: Props) {
  const { passing, needsAttention } = sortCategoriesForDisplay(categories);

  return (
    <div className="space-y-8">
      {passing.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Passing checks
          </h3>
          <div className="mt-3">
            <CategoryGrid items={passing} stepsByCategory={stepsByCategory} bimiDetail={bimiDetail} />
          </div>
        </div>
      ) : null}

      {needsAttention.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Needs attention
          </h3>
          <div className="mt-3">
            <CategoryGrid
              items={needsAttention}
              stepsByCategory={stepsByCategory}
              bimiDetail={bimiDetail}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
