'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const inviteEmail = searchParams.get('email');
  const next =
    inviteToken
      ? `/invite/${encodeURIComponent(inviteToken)}?accept=1`
      : searchParams.get('next') || '/dashboard';
  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.signIn.email({ email, password });
      if (err) {
        setError(err.message || 'Sign in failed');
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          {inviteToken
            ? 'Sign in with the email that received the invitation.'
            : 'Access your Tailnote workspace.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton callbackURL={next} />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={Boolean(inviteEmail)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Continue'}
          </Button>
        </form>
        <div className="mt-4 flex min-w-0 flex-col gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-1">
          <Link href="/forgot-password" className="underline underline-offset-4">
            Forgot password
          </Link>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <Link href="/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
