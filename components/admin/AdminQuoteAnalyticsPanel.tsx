'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TopQuote = {
  quoteId: string;
  quoteText: string;
  attribution: string;
  usageCount: number;
  clickCount: number;
};

type AnalyticsResponse = {
  topQuotes?: TopQuote[];
  totalLibraryUsage?: number;
  totalCustomUsage?: number;
};

export function AdminQuoteAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/quotes/analytics', { credentials: 'include' });
        const j = (await res.json()) as AnalyticsResponse;
        if (res.ok) setData(j);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most used quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading analytics…</p>
        </CardContent>
      </Card>
    );
  }

  const topQuotes = data?.topQuotes ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Most used quotes</CardTitle>
        <p className="text-sm text-muted-foreground">
          Library: {data?.totalLibraryUsage ?? 0} signatures · Custom: {data?.totalCustomUsage ?? 0}{' '}
          signatures
        </p>
      </CardHeader>
      <CardContent>
        {topQuotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quote usage yet.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {topQuotes.map((q, i) => (
              <li key={q.quoteId} className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium text-muted-foreground">{i + 1}.</span>
                <span className="flex-1 italic text-foreground">
                  &ldquo;{q.quoteText.length > 60 ? `${q.quoteText.slice(0, 59)}…` : q.quoteText}&rdquo;
                </span>
                {q.attribution ? (
                  <span className="text-muted-foreground">— {q.attribution}</span>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {q.usageCount} sig{q.usageCount !== 1 ? 's' : ''}
                  {q.clickCount > 0 ? ` · ${q.clickCount} click${q.clickCount !== 1 ? 's' : ''}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
