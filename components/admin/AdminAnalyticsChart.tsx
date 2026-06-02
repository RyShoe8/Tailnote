'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Metric = 'organizations' | 'users' | 'mrr' | 'arr' | 'copies' | 'clicks' | 'opens';
type GroupBy = 'day' | 'week' | 'month';
type Point = { date: string; value: number };

const METRICS: Array<{ id: Metric; label: string }> = [
  { id: 'organizations', label: 'Organizations' },
  { id: 'users', label: 'Users' },
  { id: 'mrr', label: 'MRR' },
  { id: 'arr', label: 'ARR' },
  { id: 'copies', label: 'Signature copies' },
  { id: 'clicks', label: 'Signature clicks' },
  { id: 'opens', label: 'Signature opens' },
];

function formatValue(metric: Metric, value: number): string {
  if (metric === 'mrr' || metric === 'arr') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function isoDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function AdminAnalyticsChart() {
  const now = new Date();
  const [metric, setMetric] = useState<Metric>('organizations');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [presetDays, setPresetDays] = useState<7 | 30 | 90>(30);
  const [from, setFrom] = useState<string>(isoDateInput(new Date(now.getTime() - 30 * 864e5)));
  const [to, setTo] = useState<string>(isoDateInput(now));
  const [series, setSeries] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(args?: { useCustom?: boolean }) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ metric, groupBy });
      if (args?.useCustom) {
        params.set('from', from);
        params.set('to', to);
      } else {
        params.set('presetDays', String(presetDays));
      }
      const res = await fetch(`/api/admin/analytics?${params.toString()}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not load analytics');
        return;
      }
      setSeries(Array.isArray(data.series) ? data.series : []);
    } catch {
      setError('Could not load analytics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, groupBy, presetDays]);

  const { pathD, yMax, total, latest } = useMemo(() => {
    const values = series.map((p) => p.value);
    const max = Math.max(1, ...values);
    const width = 720;
    const height = 260;
    const points = series.map((p, i) => {
      const x = series.length <= 1 ? 0 : (i / (series.length - 1)) * width;
      const y = height - (p.value / max) * height;
      return `${x},${y}`;
    });
    const d = points.length > 0 ? `M ${points.join(' L ')}` : '';
    const sum = values.reduce((acc, v) => acc + v, 0);
    const last = values.length > 0 ? values[values.length - 1] : 0;
    return { pathD: d, yMax: max, total: sum, latest: last };
  }, [series]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Metric</p>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
          >
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Group by</p>
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as GroupBy[]).map((g) => (
              <Button key={g} type="button" variant={groupBy === g ? 'default' : 'outline'} onClick={() => setGroupBy(g)}>
                {g}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Quick range</p>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                type="button"
                variant={presetDays === d ? 'default' : 'outline'}
                onClick={() => setPresetDays(d as 7 | 30 | 90)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">From</p>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">To</p>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="button" variant="outline" onClick={() => void load({ useCustom: true })}>
          Apply custom range
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total in range</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatValue(metric, total)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Latest bucket</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatValue(metric, latest)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!loading && !error && series.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for selected range.</p>
          ) : null}
          {!loading && !error && series.length > 0 ? (
            <div className="space-y-2">
              <svg viewBox="0 0 720 260" className="h-64 w-full overflow-visible">
                <line x1="0" y1="260" x2="720" y2="260" stroke="currentColor" className="text-border" />
                <line x1="0" y1="0" x2="0" y2="260" stroke="currentColor" className="text-border" />
                <path d={pathD} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
              </svg>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{series[0]?.date}</span>
                <span>Max: {formatValue(metric, yMax)}</span>
                <span>{series[series.length - 1]?.date}</span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
