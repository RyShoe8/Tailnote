import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminAnalyticsSummary } from '@/lib/admin/data';

type Props = {
  summary: AdminAnalyticsSummary;
};

function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function AdminAnalyticsPanel({ summary }: Props) {
  const metrics = [
    { label: 'Total organizations', value: formatCount(summary.totalOrganizations) },
    { label: 'Total users', value: formatCount(summary.totalUsers) },
    { label: 'MRR', value: formatUsdFromCents(summary.mrrCents) },
    { label: 'ARR', value: formatUsdFromCents(summary.arrCents) },
    { label: 'Total signature copies', value: formatCount(summary.totalSignatureCopies) },
    { label: 'Total signature clicks', value: formatCount(summary.totalSignatureClicks) },
    { label: 'Total signature opens', value: formatCount(summary.totalSignatureOpens) },
  ] as const;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide usage and recurring-revenue summary.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
