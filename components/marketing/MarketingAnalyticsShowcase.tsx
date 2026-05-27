'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MarketingBrowserFrame } from '@/components/marketing/MarketingBrowserFrame';
import { useRevealOnScrollReady } from '@/components/marketing/RevealOnScroll';
import {
  ANALYTICS_DEMO_BY_DAY,
  ANALYTICS_DEMO_BY_KIND,
  ANALYTICS_DEMO_TOTAL,
} from '@/lib/marketing/analyticsDemoData';

type Props = {
  variant?: 'full' | 'chartDetail';
};

function ChartPlaceholder({ className }: { className?: string }) {
  return <div className={className} aria-hidden />;
}

function DemoBarChart({ heightClass }: { heightClass: string }) {
  const chartsReady = useRevealOnScrollReady();

  return (
    <div className={`${heightClass} w-full min-w-0`}>
      {chartsReady ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={ANALYTICS_DEMO_BY_KIND} layout="vertical" margin={{ left: 4, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="kind" width={110} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ChartPlaceholder className="h-full w-full" />
      )}
    </div>
  );
}

function DemoLineChart() {
  const chartsReady = useRevealOnScrollReady();

  return (
    <div className="mt-3 h-44 w-full min-w-0">
      {chartsReady ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={ANALYTICS_DEMO_BY_DAY}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartPlaceholder className="h-full w-full" />
      )}
    </div>
  );
}

function DemoBarChartCompact() {
  const chartsReady = useRevealOnScrollReady();

  return (
    <div className="mt-3 h-48 w-full min-w-0">
      {chartsReady ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={ANALYTICS_DEMO_BY_KIND} layout="vertical" margin={{ left: 4, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="kind" width={100} tick={{ fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ChartPlaceholder className="h-full w-full" />
      )}
    </div>
  );
}

export function MarketingAnalyticsShowcase({ variant = 'full' }: Props) {
  if (variant === 'chartDetail') {
    return (
      <MarketingBrowserFrame url="app.tailnote.com/dashboard/analytics" contentClassName="p-4 sm:p-6">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5">
          <p className="text-sm font-semibold text-foreground">By link type</p>
          <p className="text-xs text-muted-foreground">Logo, website, social, and promo blocks</p>
          <div className="mt-4">
            <DemoBarChart heightClass="h-64" />
          </div>
        </div>
      </MarketingBrowserFrame>
    );
  }

  return (
    <MarketingBrowserFrame url="app.tailnote.com/dashboard/analytics">
      <div className="min-w-0 space-y-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-muted-foreground">Total clicks</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{ANALYTICS_DEMO_TOTAL}</p>
          <p className="mt-1 text-xs text-muted-foreground">Last 30 days · All team members</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-foreground">Clicks over time</p>
          <p className="text-xs text-muted-foreground">Daily tracked link clicks</p>
          <DemoLineChart />
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-foreground">By link type</p>
          <p className="text-xs text-muted-foreground">See which promos and links perform</p>
          <DemoBarChartCompact />
        </div>
      </div>
    </MarketingBrowserFrame>
  );
}
