'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { formatSignupError } from '@/lib/auth/formatAuthError';

function buildPostSignupPath(searchParams: URLSearchParams, inviteToken: string | null): string {
  if (inviteToken) {
    return `/invite/${encodeURIComponent(inviteToken)}?accept=1`;
  }
  const qs = new URLSearchParams();
  const subscriptionPlanId = searchParams.get('subscriptionPlanId');
  const plan = searchParams.get('plan');
  if (subscriptionPlanId) qs.set('subscriptionPlanId', subscriptionPlanId);
  if (plan) qs.set('plan', plan);
  const query = qs.toString();
  return query ? `/onboarding?${query}` : '/onboarding';
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const inviteEmail = searchParams.get('email');
  const googleCallback = buildPostSignupPath(searchParams, inviteToken);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (err) {
        setError(formatSignupError(err.message || 'Sign up failed'));
        return;
      }
      if (inviteToken) {
        window.location.href = `/invite/${encodeURIComponent(inviteToken)}?accept=1`;
        return;
      }
      router.push(buildPostSignupPath(searchParams, inviteToken));
      router.refresh();
    } catch {
      setError('Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          {inviteToken
            ? 'Create your account to accept your team invitation.'
            : 'Start with email and password.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton callbackURL={googleCallback} />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              readOnly={Boolean(inviteEmail)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4">
            Log in instead
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <>
      <AuthBrandHeader heightClass="h-14 sm:h-16" />
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <SignupForm />
      </Suspense>
    </>
  );
}
