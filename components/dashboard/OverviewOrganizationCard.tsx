'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type OverviewOrganizationCardProps = {
  organizationId: string;
  initialName: string;
  initialSignatureClickTrackingEnabled: boolean;
  initialSignatureOpenTrackingEnabled: boolean;
  initialUtmEnabled: boolean;
  canEdit: boolean;
};

export function OverviewOrganizationCard({
  organizationId,
  initialName,
  initialSignatureClickTrackingEnabled,
  initialSignatureOpenTrackingEnabled,
  initialUtmEnabled,
  canEdit,
}: OverviewOrganizationCardProps) {
  const [name, setName] = useState(initialName);
  const [signatureClickTrackingEnabled, setSignatureClickTrackingEnabled] = useState(
    initialSignatureClickTrackingEnabled
  );
  const [signatureOpenTrackingEnabled, setSignatureOpenTrackingEnabled] = useState(
    initialSignatureOpenTrackingEnabled
  );
  const [utmEnabled, setUtmEnabled] = useState(initialUtmEnabled);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setMessage(null);
    const res = await fetch('/api/dashboard/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        signatureClickTrackingEnabled,
        signatureOpenTrackingEnabled,
        utmEnabled,
      }),
    });
    if (res.ok) setMessage('Saved');
    else {
      const j = await res.json().catch(() => ({}));
      setMessage(typeof j.error === 'string' ? j.error : 'Could not save');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Name, ID, and signature tracking settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-id">Organization ID</Label>
            <Input id="org-id" value={organizationId} disabled readOnly className="min-w-0 break-all font-mono text-xs" />
            <p className="text-xs text-muted-foreground">Internal reference for support and billing.</p>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <input
              id="signatureClickTrackingEnabled"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input disabled:opacity-50"
              checked={signatureClickTrackingEnabled}
              onChange={(e) => setSignatureClickTrackingEnabled(e.target.checked)}
              disabled={!canEdit}
            />
            <div className="space-y-1">
              <Label htmlFor="signatureClickTrackingEnabled" className="cursor-pointer font-normal leading-snug">
                Log signature link clicks (analytics)
              </Label>
              <p className="text-xs text-muted-foreground">
                On by default for new organizations. Uncheck to opt out. When enabled, links in rendered signatures use
                a signed redirect that records counts by link type (logo, website, email, phone, social). Signing uses
                the same app secret as authentication—no extra configuration.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <input
              id="signatureOpenTrackingEnabled"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input disabled:opacity-50"
              checked={signatureOpenTrackingEnabled}
              onChange={(e) => setSignatureOpenTrackingEnabled(e.target.checked)}
              disabled={!canEdit}
            />
            <div className="space-y-1">
              <Label htmlFor="signatureOpenTrackingEnabled" className="cursor-pointer font-normal leading-snug">
                Log signature opens (analytics)
              </Label>
              <p className="text-xs text-muted-foreground">
                Off by default. When enabled, a small tracking image is added to signatures you copy from
                Tailnote. Recipients must allow images in their mail client; counts are approximate. Re-copy
                your signature after enabling so the pixel is included.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <input
              id="utmEnabled"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input disabled:opacity-50"
              checked={utmEnabled}
              onChange={(e) => setUtmEnabled(e.target.checked)}
              disabled={!canEdit}
            />
            <div className="space-y-1">
              <Label htmlFor="utmEnabled" className="cursor-pointer font-normal leading-snug">
                Add UTM parameters to signature links
              </Label>
              <p className="text-xs text-muted-foreground">
                On by default. Appends <code className="text-[11px] bg-muted px-1 rounded break-all">utm_source=Tailnote&amp;utm_medium=Email&amp;utm_campaign=Footer</code> to
                all http/https links in rendered signatures (logo, website, social, content blocks). Does not affect
                mailto: or tel: links. Useful for tracking signature-driven traffic in Google Analytics.
              </p>
            </div>
          </div>
          {!canEdit ? (
            <p className="text-xs text-muted-foreground">Only owners and admins can change organization settings.</p>
          ) : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={!canEdit}>
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
