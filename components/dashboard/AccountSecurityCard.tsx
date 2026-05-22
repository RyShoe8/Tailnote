'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AuthMethods = {
  email?: string;
  hasGoogle?: boolean;
  hasPassword?: boolean;
  googleOAuthConfigured?: boolean;
};

export function AccountSecurityCard() {
  const [methods, setMethods] = useState<AuthMethods | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/me/auth-methods', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMethods(data as AuthMethods);
      else setMethods(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function linkGoogle() {
    setLinkError(null);
    setLinking(true);
    try {
      const { error } = await authClient.linkSocial({
        provider: 'google',
        callbackURL: '/dashboard/billing?account=linked',
      });
      if (error) {
        setLinkError(error.message || 'Could not connect Google');
        setLinking(false);
      }
    } catch {
      setLinkError('Could not connect Google');
      setLinking(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign-in methods</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (!methods) {
    return null;
  }

  const googleReady = methods.googleOAuthConfigured !== false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign-in methods</CardTitle>
        <CardDescription>
          Use email and password, Google, or both on the same account ({methods.email || 'your email'}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="text-sm space-y-2">
          <li>
            <span className="font-medium">Email & password:</span>{' '}
            {methods.hasPassword ? (
              <span className="text-muted-foreground">Connected</span>
            ) : (
              <span className="text-muted-foreground">
                Not set —{' '}
                <Link href="/forgot-password" className="underline underline-offset-4">
                  set a password via email reset
                </Link>
              </span>
            )}
          </li>
          <li>
            <span className="font-medium">Google:</span>{' '}
            {methods.hasGoogle ? (
              <span className="text-muted-foreground">Connected</span>
            ) : (
              <span className="text-muted-foreground">Not connected</span>
            )}
          </li>
        </ul>

        {!methods.hasGoogle && googleReady ? (
          <div className="space-y-2">
            <Button type="button" variant="outline" disabled={linking} onClick={() => void linkGoogle()}>
              {linking ? 'Redirecting…' : 'Connect Google'}
            </Button>
            {linkError ? <p className="text-sm text-destructive">{linkError}</p> : null}
          </div>
        ) : null}

        {!methods.hasGoogle && !googleReady ? (
          <p className="text-xs text-muted-foreground">Google sign-in is not configured on this deployment.</p>
        ) : null}

        {!methods.hasPassword ? (
          <p className="text-xs text-muted-foreground">
            If you originally signed up with Google, use Forgot password with the same email to create a password
            you can use on the login page.
          </p>
        ) : null}

      </CardContent>
    </Card>
  );
}
