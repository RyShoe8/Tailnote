'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEmployeePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canAddMore, setCanAddMore] = useState(true);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/employees', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const limits = d.limits as { canAddMore?: boolean; maxEmployees?: number | null } | undefined;
        if (limits && limits.canAddMore === false && limits.maxEmployees != null) {
          setCanAddMore(false);
          setLimitMessage(
            `Your plan includes ${limits.maxEmployees} user${limits.maxEmployees === 1 ? '' : 's'}. Choose a plan with additional users on Billing to add more.`
          );
        }
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not create employee');
        return;
      }
      const employeeId = data.employee?._id;
      if (!employeeId) {
        setError('Could not create employee');
        return;
      }
      const params = new URLSearchParams();
      if (data.inviteEmailSent === false) {
        params.set('inviteWarning', '1');
        if (typeof data.inviteErrorCode === 'string') {
          params.set('inviteErrorCode', data.inviteErrorCode);
        }
      }
      const qs = params.toString();
      router.push(`/dashboard/employees/${employeeId}${qs ? `?${qs}` : ''}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg min-w-0">
      <Link href="/dashboard/employees" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
        ← Back
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>New employee</CardTitle>
          <CardDescription>
            Enter their work email. They&apos;ll use your brand signature template; you can fill in their name and
            details after creating them. An invitation email is sent automatically when email is configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {limitMessage ? (
            <p className="mb-4 text-sm text-muted-foreground rounded-md border border-dashed p-3">
              {limitMessage}{' '}
              <Link href="/dashboard/upgrade" className="underline underline-offset-4">
                Upgrade now
              </Link>
              .
            </p>
          ) : null}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || !canAddMore}>
              {loading ? 'Saving…' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
