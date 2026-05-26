'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { RecaptchaNotice } from '@/components/recaptcha/RecaptchaNotice';
import { formatLoginError, formatOAuthCallbackError } from '@/lib/auth/formatAuthError';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { authCaptchaFetchOptions, useRecaptcha } from '@/lib/recaptcha/client';

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
  const oauthError = searchParams.get('error');
  const [error, setError] = useState<string | null>(
    oauthError ? formatOAuthCallbackError(oauthError) : null
  );
  const [loading, setLoading] = useState(false);
  const { getToken, enabled: recaptchaEnabled } = useRecaptcha(RECAPTCHA_ACTIONS.login);
  const { data: session, isPending: sessionPending } = authClient.useSession();

  useEffect(() => {
    if (sessionPending || !session?.user) return;
    router.replace(next);
  }, [sessionPending, session?.user, router, next]);

  useEffect(() => {
    if (!oauthError) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('error');
    const next = url.searchParams.toString();
    window.history.replaceState({}, '', next ? `${url.pathname}?${next}` : url.pathname);
  }, [oauthError]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const captchaToken = await getToken();
      if (recaptchaEnabled && !captchaToken) {
        setError('Security check failed. Please try again.');
        return;
      }
      const { error: err } = await authClient.signIn.email({
        email,
        password,
        fetchOptions: authCaptchaFetchOptions(captchaToken),
      });
      if (err) {
        setError(formatLoginError(err.message || 'Sign in failed'));
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Continue'}
          </Button>
          <RecaptchaNotice />
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
    <>
      <AuthBrandHeader heightClass="h-28 sm:h-32" />
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
