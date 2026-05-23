'use client';

// TEMP: remove after slug_1 migration is run in production
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function AdminDropLegacySlugIndexButton() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMigration() {
    if (
      !window.confirm(
        'Drop the legacy organizations slug_1 index and clear slug fields? This is a one-time database fix.'
      )
    ) {
      return;
    }

    setRunning(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/migrate/org-slug-index', { method: 'POST' });
      const data = (await res.json()) as {
        ok?: boolean;
        droppedSlugIndex?: boolean;
        clearedSlugCount?: number;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Migration failed');
        return;
      }

      const parts: string[] = [];
      if (data.droppedSlugIndex) {
        parts.push('Dropped legacy slug_1 index.');
      } else {
        parts.push('slug_1 index was not present (already removed).');
      }
      parts.push(`Cleared slug on ${data.clearedSlugCount ?? 0} organization(s).`);
      parts.push('You can try Create organization again.');
      setMessage(parts.join(' '));
    } catch {
      setError('Request failed. Try again.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">One-time database fix</p>
        <p className="text-sm text-muted-foreground mt-1">
          Removes the legacy unique index on <code className="text-xs">organizations.slug</code> so
          multiple organizations can be created.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={runMigration}
        disabled={running}
      >
        {running ? 'Running…' : 'Run slug index migration'}
      </Button>
      {message ? <p className="text-sm text-green-700 dark:text-green-400">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
