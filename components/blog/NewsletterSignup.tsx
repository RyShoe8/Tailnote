'use client';

import { useState } from 'react';
import { RecaptchaNotice } from '@/components/recaptcha/RecaptchaNotice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { useRecaptcha } from '@/lib/recaptcha/client';
import { cn } from '@/lib/utils';

const TOPIC_OPTIONS = [
  { id: 'email-signatures', label: 'Email signatures' },
  { id: 'deliverability', label: 'Deliverability' },
  { id: 'team-branding', label: 'Team branding' },
] as const;

type NewsletterSignupProps = {
  variant?: 'compact' | 'full';
  signupPage?: string;
  className?: string;
};

export function NewsletterSignup({
  variant = 'full',
  signupPage = '/blog',
  className,
}: NewsletterSignupProps) {
  const { getToken, enabled: recaptchaEnabled } = useRecaptcha(RECAPTCHA_ACTIONS.newsletter);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggleTopic(id: string) {
    setTopics((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setSubmitting(true);
    try {
      const recaptchaToken = await getToken();
      if (recaptchaEnabled && !recaptchaToken) {
        setError('Security check failed. Please try again.');
        return;
      }

      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          tags: topics,
          source: 'blog',
          signupPage,
          company: honeypot,
          recaptchaToken,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };

      if (res.status === 204 || data.ok) {
        setSuccess(true);
        setEmail('');
        setFirstName('');
        setTopics([]);
        return;
      }

      setError(data.error ?? 'Something went wrong. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-[#4fd6b2]/40 bg-[#4fd6b2]/10 p-6 text-center',
          className
        )}
      >
        <p className="font-semibold text-foreground">You&apos;re subscribed!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for joining — we&apos;ll send practical email branding and deliverability tips.
        </p>
      </div>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-6 shadow-card sm:p-8',
        className
      )}
    >
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Newsletter</p>
      <h2
        className={cn(
          'mt-2 font-semibold tracking-tight text-foreground',
          isCompact ? 'text-xl' : 'text-2xl'
        )}
      >
        Email branding tips for small teams
      </h2>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Signature best practices, deliverability guides, and product updates — no spam.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          name="company"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="absolute h-0 w-0 opacity-0"
          aria-hidden
        />

        <div className={cn('grid gap-4', !isCompact && 'sm:grid-cols-2')}>
          <div className="space-y-2">
            <Label htmlFor="newsletter-email">Email</Label>
            <Input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsletter-first-name">First name (optional)</Label>
            <Input
              id="newsletter-first-name"
              type="text"
              autoComplete="given-name"
              placeholder="Alex"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
        </div>

        {!isCompact ? (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">Topics of interest</legend>
            <div className="flex flex-wrap gap-3">
              {TOPIC_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                >
                  <input
                    type="checkbox"
                    checked={topics.includes(opt.id)}
                    onChange={() => toggleTopic(opt.id)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </form>

      <div className="mt-4">
        <RecaptchaNotice />
      </div>
    </section>
  );
}
