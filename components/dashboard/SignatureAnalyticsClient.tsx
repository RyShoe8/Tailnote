'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';
import { resolveSignatureClickKindLabel } from '@/lib/signatureClickKindLabels';

type AnalyticsPayload = {
  from: string;
  to: string;
  scope: string;
  employeeId?: string;
  byKind: Record<string, number>;
  byDay: { date: string; count: number }[];
  opensTotal: number;
  opensByDay: { date: string; count: number }[];
  activityByDay: { date: string; clicks: number; opens: number }[];
  employees: { id: string; name: string; email: string }[];
  canFilterByEmployee: boolean;
  gated?: boolean;
  upgradeUrl?: string;
  promoKindLabels?: Record<string, string>;
};

function defaultFromDate(): string {
  const d = new Date(Date.now() - 30 * 864e5);
  return d.toISOString().slice(0, 10);
}

function defaultToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function useIsSm(): boolean {
  const [isSm, setIsSm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsSm(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isSm;
}

export function SignatureAnalyticsClient() {
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(defaultToDate);
  const isSm = useIsSm();
  const [employeeId, setEmployeeId] = useState('');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` });
      if (employeeId) params.set('employeeId', employeeId);
      const res = await fetch(`/api/dashboard/analytics/signature-clicks?${params}`, {
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Could not load analytics');
        setData(null);
        return;
      }
      setData(json as AnalyticsPayload);
    } catch {
      setError('Could not load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, employeeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const kindChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.byKind)
      .map(([kind, count]) => ({
        kind: resolveSignatureClickKindLabel(kind, data.promoKindLabels),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const totalClicks = useMemo(
    () => kindChartData.reduce((sum, row) => sum + row.count, 0),
    [kindChartData]
  );

  const opensPerClick = useMemo(() => {
    if (!data || totalClicks === 0 || data.opensTotal === 0) return null;
    return (data.opensTotal / totalClicks).toFixed(1);
  }, [data, totalClicks]);

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Signature link clicks and opens over a date range
          {data?.scope === 'self' ? ' for your account' : data?.scope === 'employee' ? ' for one team member' : ''}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date range</CardTitle>
          <CardDescription>Up to 90 days. Adjust filters and apply.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {data?.canFilterByEmployee ? (
            <div className="space-y-2">
              <Label htmlFor="employee">Team member</Label>
              <select
                id="employee"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">All team members</option>
                {data.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? 'Loading…' : 'Apply'}
          </Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : data?.gated ? (
        <Card>
          <CardHeader>
            <CardTitle>Analytics on paid plans</CardTitle>
            <CardDescription>
              Upgrade to remove Tailnote branding and unlock click and campaign analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={data.upgradeUrl || DASHBOARD_UPGRADE_HREF}>Upgrade now</Link>
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total clicks</CardTitle>
                <CardDescription>
                  {new Date(data.from).toLocaleDateString()} – {new Date(data.to).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{totalClicks}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total opens</CardTitle>
                <CardDescription>Tracking pixel loads when images are enabled</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{data.opensTotal}</p>
                {opensPerClick ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    ~{opensPerClick} opens per click in this range
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Opens are approximate: many mail clients block images by default, and some privacy features
            preload images. Enable open tracking in Organization settings and re-copy signatures for new
            opens to count.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Activity over time</CardTitle>
              <CardDescription>Daily clicks and opens</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {data.activityByDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.activityByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="opens"
                      name="Opens"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clicks over time</CardTitle>
              <CardDescription>Daily tracked link clicks</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {data.byDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clicks in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.byDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opens over time</CardTitle>
              <CardDescription>Daily tracking pixel loads</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {data.opensByDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">No opens in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.opensByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By link type</CardTitle>
              <CardDescription>Logo, website, email, phone, social, and promo blocks</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {kindChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clicks in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kindChartData} layout="vertical" margin={{ left: 4, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="kind"
                      width={isSm ? 120 : 80}
                      tick={{ fontSize: isSm ? 11 : 10 }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
