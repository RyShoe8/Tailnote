import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import type { PublicPricingPlan } from '../../billing/getPublicPricingPlans';
import {
  additionalUsersPricingLine,
  includedUsersSummary,
  isRecommendedPlan,
  planExcludedFeatureBullets,
  planFeatureBullets,
  primaryPriceLine,
  subscriptionCap,
  trialSummaryLine,
} from '../../billing/pricingPlanDisplay';
import { SubscriptionAvailabilityCallout } from './SubscriptionAvailabilityCallout';
import { cn } from '../../ui/cn';

type PricingPlanCardProps = {
  plan: PublicPricingPlan;
  variant?: 'current' | 'selectable' | 'marketing';
  compact?: boolean;
  footer?: ReactNode;
  className?: string;
};

export function PricingPlanCard({
  plan,
  variant = 'marketing',
  compact = false,
  footer,
  className,
}: PricingPlanCardProps) {
  const description = plan.description.trim();
  const features = planFeatureBullets(plan);
  const excludedFeatures = planExcludedFeatureBullets(plan);
  const hasCap = subscriptionCap(plan) !== null;
  const recommended = isRecommendedPlan(plan);
  const isCurrent = variant === 'current';
  const trialLine = trialSummaryLine(plan);
  const additionalUsersLine = additionalUsersPricingLine(plan);

  return (
    <Card
      className={cn(
        'relative flex w-full flex-col overflow-hidden',
        variant === 'marketing'
          ? 'border-slate-200/80 bg-white shadow-float ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-ring'
          : 'border-border bg-card shadow-sm',
        recommended && variant === 'marketing' ? 'ring-2 ring-primary/40' : '',
        isCurrent ? 'ring-2 ring-primary/30' : '',
        className
      )}
    >
      {recommended && variant === 'marketing' ? (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 tn-grad-bg" />
      ) : null}
      {isCurrent ? (
        <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-primary">
          Your current plan
        </div>
      ) : null}
      <CardHeader className={cn('space-y-3', compact ? 'pt-4 pb-2' : 'pt-6')}>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className={compact ? 'text-lg' : 'text-xl'}>{plan.name}</CardTitle>
          {plan.badge.trim() ? (
            <span className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
              {plan.badge.trim()}
            </span>
          ) : null}
          {plan.soldOut ? (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
              Sold out
            </span>
          ) : null}
        </div>
        {description && !compact ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {hasCap && !compact ? <SubscriptionAvailabilityCallout plan={plan} /> : null}
      </CardHeader>
      <CardContent className={cn('flex flex-1 flex-col gap-5', compact && 'gap-3')}>
        <div>
          <p className={cn('font-semibold tracking-tight', compact ? 'text-2xl' : 'text-4xl')}>
            {primaryPriceLine(plan)}
          </p>
          {trialLine ? (
            <p className="mt-1 text-sm font-medium text-primary">{trialLine}</p>
          ) : null}
          <p className="mt-2 text-base font-medium text-foreground">{includedUsersSummary(plan)}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Per subscription</p>
          {additionalUsersLine ? (
            <p className="mt-1 text-sm text-muted-foreground">{additionalUsersLine}</p>
          ) : null}
        </div>
        {!compact ? (
          <div className="space-y-4">
            <ul className="space-y-2.5">
              {features.map((line: string) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {excludedFeatures.length > 0 ? (
              <div className="space-y-2.5 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Not included
                </p>
                <ul className="space-y-2.5">
                  {excludedFeatures.map((line: string) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
      {footer ? <CardFooter className="mt-auto">{footer}</CardFooter> : null}
    </Card>
  );
}
