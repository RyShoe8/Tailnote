'use client';

import { useState } from 'react';
import type { SignatureProfile } from 'emailsignature-engine';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

type Props = {
  value: SignatureProfile;
  onChange: (next: SignatureProfile) => void;
  disabled?: boolean;
};

export function SignatureForm({ value, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);

  const set =
    (key: keyof SignatureProfile) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [key]: e.target.value });
    };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/dashboard/me/image', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok && json.url) {
        onChange({ ...value, avatarUrl: json.url });
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <fieldset disabled={disabled || uploading} className="space-y-4">
      <div className="space-y-2">
        <Label>Profile Picture (optional)</Label>
        <div className="flex items-center gap-4">
          {value.avatarUrl ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-full border border-dashed bg-slate-50" />
          )}
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" disabled={uploading}>
              <label className="cursor-pointer">
                {uploading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Upload image
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </Button>
            {value.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => onChange({ ...value, avatarUrl: '' })}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fn">First name</Label>
        <Input id="fn" value={value.firstName} onChange={set('firstName')} autoComplete="given-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ln">Last name</Label>
        <Input id="ln" value={value.lastName} onChange={set('lastName')} autoComplete="family-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={value.title} onChange={set('title')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={value.email} onChange={set('email')} autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="office">Office phone (optional)</Label>
        <Input id="office" type="tel" value={value.officePhone ?? ''} onChange={set('officePhone')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile phone (optional)</Label>
        <Input id="mobile" type="tel" value={value.mobilePhone ?? ''} onChange={set('mobilePhone')} />
      </div>
    </fieldset>
  );
}
