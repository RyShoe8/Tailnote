'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const urlError = searchParams.get('error');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const invalidToken = urlError === 'INVALID_TOKEN';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Missing reset token. Open the link from your email.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (err) {
        setError(err.message || 'Reset failed');
        return;
      }
      router.replace('/login');
    } catch {
      setError('Reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (invalidToken) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Reset link invalid</CardTitle>
          <CardDescription>This link has expired or was already used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-x-3">
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
            <span aria-hidden className="hidden sm:inline">
              &middot;
            </span>
            <Link href="/login" className="underline underline-offset-4">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Use the link from your reset email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-x-3">
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
            <span aria-hidden className="hidden sm:inline">
              &middot;
            </span>
            <Link href="/login" className="underline underline-offset-4">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>New password</CardTitle>
        <CardDescription>Choose a password at least 8 characters long.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4">
            Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <AuthBrandHeader />
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
