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
import { formatOAuthCallbackError, formatSignupError } from '@/lib/auth/formatAuthError';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { authCaptchaFetchOptions, useRecaptcha } from '@/lib/recaptcha/client';
import { sessionMatchesInvitedEmail } from '@/lib/auth/inviteAccountSwitch';

function buildPostSignupPath(
  searchParams: URLSearchParams,
  inviteToken: string | null,
  joinToken: string | null
): string {
  if (joinToken) {
    return `/join/${encodeURIComponent(joinToken)}?accept=1`;
  }
  if (inviteToken) {
    return `/invite/${encodeURIComponent(inviteToken)}?accept=1`;
  }
  const redirect = searchParams.get('redirect');
  if (redirect && redirect.startsWith('/')) {
    return redirect;
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
  const joinToken = searchParams.get('join');
  const inviteEmail = searchParams.get('email');
  const googleCallback = buildPostSignupPath(searchParams, inviteToken, joinToken);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const oauthError = searchParams.get('error');
  const [error, setError] = useState<string | null>(
    oauthError ? formatOAuthCallbackError(oauthError) : null
  );
  const [loading, setLoading] = useState(false);
  const signupRecaptcha = useRecaptcha(RECAPTCHA_ACTIONS.signup);
  const loginRecaptcha = useRecaptcha(RECAPTCHA_ACTIONS.login);
  const recaptchaEnabled = signupRecaptcha.enabled;
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const postSignupPath = buildPostSignupPath(searchParams, inviteToken, joinToken);

  useEffect(() => {
    if (sessionPending || !session?.user) return;
    if (joinToken && inviteEmail) {
      if (!sessionMatchesInvitedEmail(session.user.email, inviteEmail)) {
        void authClient.signOut();
        return;
      }
    }
    router.replace(postSignupPath);
  }, [sessionPending, session?.user, router, postSignupPath, joinToken, inviteEmail]);

  useEffect(() => {
    if (!oauthError) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('error');
    const rest = url.searchParams.toString();
    window.history.replaceState({}, '', rest ? `${url.pathname}?${rest}` : url.pathname);
  }, [oauthError]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const signupToken = await signupRecaptcha.getToken();
      if (recaptchaEnabled && !signupToken) {
        setError('Security check failed. Please try again.');
        return;
      }

      const { error: err } = await authClient.signUp.email({
        email,
        password,
        name,
        fetchOptions: authCaptchaFetchOptions(signupToken),
      });
      if (err) {
        setError(formatSignupError(err.message || 'Sign up failed'));
        return;
      }
      const loginToken = await loginRecaptcha.getToken();
      if (recaptchaEnabled && !loginToken) {
        setError(
          'Account created, but sign-in failed. Try logging in with your email and password.'
        );
        return;
      }
      const { error: signInErr } = await authClient.signIn.email({
        email,
        password,
        fetchOptions: authCaptchaFetchOptions(loginToken),
      });
      if (signInErr) {
        setError(
          'Account created, but sign-in failed. Try logging in with your email and password.'
        );
        return;
      }
      try {
        await fetch('/api/auth/brevo-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, industry, subscribeNewsletter }),
        });
      } catch (err) {
        console.error('Brevo sync failed', err);
      }
      if (joinToken) {
        window.location.href = `/join/${encodeURIComponent(joinToken)}?accept=1`;
        return;
      }
      if (inviteToken) {
        window.location.href = `/invite/${encodeURIComponent(inviteToken)}?accept=1`;
        return;
      }
      router.push(buildPostSignupPath(searchParams, inviteToken, joinToken));
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
          {joinToken || inviteToken
            ? 'Create your account to accept your team invitation.'
            : 'Start with email and password.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select your industry...</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex items-start space-x-2 pt-2">
            <input
              type="checkbox"
              id="newsletter"
              checked={subscribeNewsletter}
              onChange={(e) => setSubscribeNewsletter(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded-sm border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Label htmlFor="newsletter" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Send me startup marketing tips, news, and updates.
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </Button>
          <RecaptchaNotice />
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
      <AuthBrandHeader heightClass="h-28 sm:h-32" />
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <SignupForm />
      </Suspense>
    </>
  );
}
