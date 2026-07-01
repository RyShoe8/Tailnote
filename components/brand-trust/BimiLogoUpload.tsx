'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';
import { bimiLogoDisplayUrl } from '@/lib/brandTrust/bimiLogoSummary';
import { RASTER_SVG_HONESTY } from '@/lib/email-health/bimiCopy';
import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';

type Props = {
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl?: string;
  bimiLogoUploadedAt?: string | Date | null;
  bimiSuggestedRecord?: string;
  onUploaded?: (payload: { url: string; suggestedRecord: string; uploadedAt: string }) => void;
  onRescanRequested?: () => void;
  variant?: 'default' | 'embedded';
  upgradeHref?: string;
  hidePreview?: boolean;
  hideTitle?: boolean;
  dnsTitle?: string;
};

export function BimiLogoUpload({
  canUseBimiLogoHosting,
  bimiLogoUrl,
  bimiLogoUploadedAt,
  bimiSuggestedRecord,
  onUploaded,
  onRescanRequested,
  variant = 'default',
  upgradeHref = DASHBOARD_UPGRADE_HREF,
  hidePreview = false,
  hideTitle = false,
  dnsTitle = 'BIMI DNS record',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hostedUrl, setHostedUrl] = useState(bimiLogoUrl ?? '');
  const [uploadedAt, setUploadedAt] = useState<string | null>(
    bimiLogoUploadedAt
      ? bimiLogoUploadedAt instanceof Date
        ? bimiLogoUploadedAt.toISOString()
        : String(bimiLogoUploadedAt)
      : null,
  );
  const [record, setRecord] = useState(bimiSuggestedRecord ?? '');

  useEffect(() => {
    setHostedUrl(bimiLogoUrl ?? '');
  }, [bimiLogoUrl]);

  useEffect(() => {
    if (bimiLogoUploadedAt) {
      setUploadedAt(
        bimiLogoUploadedAt instanceof Date
          ? bimiLogoUploadedAt.toISOString()
          : String(bimiLogoUploadedAt),
      );
    }
  }, [bimiLogoUploadedAt]);

  useEffect(() => {
    setRecord(bimiSuggestedRecord ?? '');
  }, [bimiSuggestedRecord]);

  const embedded = variant === 'embedded';
  const hasLogo = Boolean(hostedUrl?.trim());

  if (!canUseBimiLogoHosting) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm">
        <p className="font-medium">
          {embedded ? 'Logo hosting for inboxes is a paid feature' : 'BIMI logo hosting is a paid feature'}
        </p>
        <p className="mt-1 text-muted-foreground">
          {embedded
            ? 'Upgrade to upload your logo, get a ready-to-copy DNS record, and show your brand in supporting inboxes.'
            : 'Upgrade to convert and host a BIMI-ready logo, then copy the DNS record we generate for you.'}
        </p>
        <Button asChild className="mt-3" size="sm">
          <Link href={upgradeHref}>Upgrade</Link>
        </Button>
      </div>
    );
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    setWarnings([]);
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await fetch('/api/dashboard/bimi/logo', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Upload failed');
        return;
      }
      setHostedUrl(String(json.url ?? ''));
      setRecord(String(json.suggestedRecord ?? ''));
      const nextUploadedAt =
        typeof json.bimiLogoUploadedAt === 'string'
          ? json.bimiLogoUploadedAt
          : new Date().toISOString();
      setUploadedAt(nextUploadedAt);
      setWarnings(Array.isArray(json.warnings) ? json.warnings : []);
      setSuccess(hasLogo ? 'Logo updated' : 'Logo uploaded');
      onUploaded?.({
        url: String(json.url ?? ''),
        suggestedRecord: String(json.suggestedRecord ?? ''),
        uploadedAt: nextUploadedAt,
      });
      onRescanRequested?.();
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div
      id={embedded ? undefined : 'bimi-logo-upload'}
      className={
        embedded
          ? 'space-y-3'
          : 'space-y-4 rounded-lg border border-border p-4'
      }
    >
      {!embedded && !hideTitle ? (
        <div>
          <p className="font-medium">{hasLogo ? 'Replace inbox logo' : 'Upload inbox logo'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{RASTER_SVG_HONESTY}</p>
        </div>
      ) : embedded ? (
        <p className="text-sm text-muted-foreground">
          Choose a square logo file. We&apos;ll prepare it and give you the DNS record to copy.
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="bimi-logo-file">Logo file (PNG, JPEG, WebP, or SVG)</Label>
        <Input
          id="bimi-logo-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          disabled={uploading}
          onChange={(e) => void handleFile(e)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-green-600 dark:text-green-400">{success}</p> : null}
      {warnings.length > 0 ? (
        <ul className="text-sm text-amber-800 dark:text-amber-200">
          {warnings.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      ) : null}
      {hostedUrl && !hidePreview ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Hosted BIMI Logo</p>
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-white shadow-sm dark:bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={uploadedAt ?? hostedUrl}
                src={bimiLogoDisplayUrl(hostedUrl, uploadedAt) ?? hostedUrl}
                alt="BIMI logo"
                className="h-20 w-20 object-contain"
              />
            </div>
          </div>
          <p className="text-sm break-all text-muted-foreground">
            URL:{' '}
            <a href={hostedUrl} className="text-primary underline" target="_blank" rel="noreferrer">
              {hostedUrl}
            </a>
          </p>
        </div>
      ) : null}
      {record ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{dnsTitle}</p>
          <DnsRecordCopy
            record={{
              type: 'TXT',
              host: 'default._bimi',
              value: record,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
