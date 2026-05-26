'use client';

import { useRef, useState } from 'react';
import { RecaptchaNotice } from '@/components/recaptcha/RecaptchaNotice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { useRecaptcha } from '@/lib/recaptcha/client';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function ContactForm() {
  const { getToken, enabled: recaptchaEnabled } = useRecaptcha(RECAPTCHA_ACTIONS.contact);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setSubject('');
    setDetails('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (!picked) {
      setFile(null);
      return;
    }
    if (picked.size > MAX_IMAGE_BYTES) {
      setError('Screenshot must be 2 MB or smaller');
      e.target.value = '';
      setFile(null);
      return;
    }
    setError(null);
    setFile(picked);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem('company') as HTMLInputElement | null)?.value ?? '';

    if (!name.trim() || !email.trim() || !subject.trim() || !details.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const recaptchaToken = await getToken();
      if (recaptchaEnabled && !recaptchaToken) {
        setError('Security check failed. Please try again.');
        return;
      }

      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('email', email.trim());
      formData.set('subject', subject.trim());
      formData.set('details', details.trim());
      formData.set('company', honeypot);
      if (recaptchaToken) formData.set('recaptchaToken', recaptchaToken);
      if (file) formData.set('file', file);

      const res = await fetch('/api/contact', { method: 'POST', body: formData });
      if (res.status === 204) {
        setSuccess(true);
        resetForm();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to send message');
        return;
      }
      setSuccess(true);
      resetForm();
    } catch {
      setError('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div
        aria-hidden
        style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        <label htmlFor="contact-company">Company (leave blank)</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            autoComplete="name"
            disabled={submitting}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            disabled={submitting}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          disabled={submitting}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-details">Message</Label>
        <Textarea
          id="contact-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={5000}
          rows={6}
          disabled={submitting}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-file">Screenshot (optional)</Label>
        <Input
          id="contact-file"
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or GIF. Max 2 MB.</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-600">
          Thanks &mdash; your message has been sent. We&apos;ll reply at the email you provided.
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full shadow-card" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send message'}
      </Button>
      <RecaptchaNotice />
    </form>
  );
}
