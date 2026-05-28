'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecaptchaNotice } from '@/components/recaptcha/RecaptchaNotice';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { authCaptchaFetchOptions, useRecaptcha } from '@/lib/recaptcha/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { getToken, enabled: recaptchaEnabled } = useRecaptcha(RECAPTCHA_ACTIONS.forgot_password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const captchaToken = await getToken();
      if (recaptchaEnabled && !captchaToken) {
        setError('Security check failed. Please try again.');
        return;
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: err } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${origin}/reset-password`,
        fetchOptions: authCaptchaFetchOptions(captchaToken),
      });
      if (err) {
        const msg = String(err.message || '');
        if (/user not found/i.test(msg)) {
          setMessage('If an account exists for that email, a reset link has been sent.');
          return;
        }
        setError('Request failed');
        return;
      }
      setMessage('If an account exists for that email, a reset link has been sent.');
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthBrandHeader />
      <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>We will email you a reset link when configured.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
          <RecaptchaNotice />
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4">
            Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
    </>
  );
}
