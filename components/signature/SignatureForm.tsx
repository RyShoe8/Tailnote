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

  const isHidden = (field: string) => value.hiddenFields?.includes(field);
  const toggleHidden = (field: string) => {
    const hidden = new Set(value.hiddenFields || []);
    if (hidden.has(field)) {
      hidden.delete(field);
    } else {
      hidden.add(field);
    }
    onChange({ ...value, hiddenFields: Array.from(hidden) });
  };

  return (
    <fieldset disabled={disabled || uploading} className="space-y-8">
      {/* Core Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Core Information</h3>
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
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
        </div>
      </div>

      {/* Optional Elements */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Optional Elements</h3>
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          
          {/* Profile Picture Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer" onClick={() => toggleHidden('avatarUrl')}>Profile Picture</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 px-2 text-xs font-medium ${isHidden('avatarUrl') ? 'text-muted-foreground' : 'text-primary'}`}
                onClick={() => toggleHidden('avatarUrl')}
              >
                {isHidden('avatarUrl') ? 'Show' : 'Hide'}
              </Button>
            </div>
            {!isHidden('avatarUrl') && (
              <div className="flex items-center gap-4 pl-1 animate-in fade-in zoom-in-95 duration-200">
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
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onChange({ ...value, avatarUrl: '' })}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-border my-2" />

          {/* Office Phone Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer" onClick={() => toggleHidden('officePhone')}>Office Phone</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 px-2 text-xs font-medium ${isHidden('officePhone') ? 'text-muted-foreground' : 'text-primary'}`}
                onClick={() => toggleHidden('officePhone')}
              >
                {isHidden('officePhone') ? 'Show' : 'Hide'}
              </Button>
            </div>
            {!isHidden('officePhone') && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Input id="office" type="tel" value={value.officePhone ?? ''} onChange={set('officePhone')} placeholder="e.g. +1 800 555 0199" />
              </div>
            )}
          </div>

          <div className="h-px bg-border my-2" />

          {/* Mobile Phone Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer" onClick={() => toggleHidden('mobilePhone')}>Mobile Phone</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 px-2 text-xs font-medium ${isHidden('mobilePhone') ? 'text-muted-foreground' : 'text-primary'}`}
                onClick={() => toggleHidden('mobilePhone')}
              >
                {isHidden('mobilePhone') ? 'Show' : 'Hide'}
              </Button>
            </div>
            {!isHidden('mobilePhone') && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Input id="mobile" type="tel" value={value.mobilePhone ?? ''} onChange={set('mobilePhone')} placeholder="e.g. +1 555 012 3456" />
              </div>
            )}
          </div>
          
        </div>
      </div>
    </fieldset>
  );
}
