'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Link as LinkIcon } from 'lucide-react';
import {
  SocialPlatformEditorIcon,
  type SocialPlatform,
} from '@/components/signature/SocialPlatformEditorIcon';

export type SocialLinksValue = {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  reddit?: string;
  discord?: string;
  bluesky?: string;
  youtube?: string;
};

type Platform = keyof SocialLinksValue;

type Props = {
  value: SocialLinksValue | undefined;
  onChange: (next: SocialLinksValue) => void;
};

const PLATFORM_ORDER: Platform[] = [
  'linkedin',
  'facebook',
  'instagram',
  'reddit',
  'discord',
  'bluesky',
  'youtube',
];
const MAX_LINKS = PLATFORM_ORDER.length;

const PLATFORM_META: Record<Platform, { name: string; bg: string }> = {
  linkedin: { name: 'LinkedIn', bg: '#0A66C2' },
  facebook: { name: 'Facebook', bg: '#1877F2' },
  instagram: { name: 'Instagram', bg: '#E1306C' },
  reddit: { name: 'Reddit', bg: '#FF4500' },
  discord: { name: 'Discord', bg: '#5865F2' },
  bluesky: { name: 'Bluesky', bg: '#1185FE' },
  youtube: { name: 'YouTube', bg: '#FF0000' },
};

/** Best-effort URL → platform detection. Returns null for unrecognized hosts. */
export function detectPlatform(rawUrl: string): Platform | null {
  const u = rawUrl.trim().toLowerCase();
  if (!u) return null;
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.me')) return 'facebook';
  if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
  if (u.includes('reddit.com') || u.includes('redd.it')) return 'reddit';
  if (u.includes('discord.com') || u.includes('discord.gg')) return 'discord';
  if (u.includes('bsky.app') || u.includes('bsky.social')) return 'bluesky';
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('m.youtube.com')) {
    return 'youtube';
  }
  return null;
}

type Entry = { id: string; url: string };

function valueToEntries(value: SocialLinksValue | undefined): Entry[] {
  if (!value) return [];
  const out: Entry[] = [];
  for (const p of PLATFORM_ORDER) {
    const u = value[p]?.trim();
    if (u) out.push({ id: `init-${p}`, url: u });
  }
  return out;
}

function entriesToValue(entries: Entry[]): SocialLinksValue {
  const out: SocialLinksValue = {};
  for (const e of entries) {
    const url = e.url.trim();
    if (!url) continue;
    const p = detectPlatform(url);
    if (!p) continue;
    out[p] = url;
  }
  return out;
}

function newEntryId() {
  return `e-${Math.random().toString(36).slice(2, 10)}`;
}

export function SocialLinksEditor({ value, onChange }: Props) {
  const baseId = useId();
  const [entries, setEntries] = useState<Entry[]>(() => {
    const initial = valueToEntries(value);
    return initial.length > 0 ? initial : [{ id: newEntryId(), url: '' }];
  });

  const incomingKey = useMemo(() => {
    const v = value ?? {};
    return PLATFORM_ORDER.map((p) => `${p}:${(v[p] ?? '').trim()}`).join('|');
  }, [value]);
  const localKey = useMemo(() => {
    const v = entriesToValue(entries);
    return PLATFORM_ORDER.map((p) => `${p}:${(v[p] ?? '').trim()}`).join('|');
  }, [entries]);
  useEffect(() => {
    if (incomingKey !== localKey) {
      const next = valueToEntries(value);
      setEntries(next.length > 0 ? next : [{ id: newEntryId(), url: '' }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: react only when the incoming value's normalized shape differs from the editor state, not on every entries change
  }, [incomingKey]);

  const commit = (next: Entry[]) => {
    setEntries(next);
    onChange(entriesToValue(next));
  };

  const updateUrl = (id: string, url: string) => {
    commit(entries.map((e) => (e.id === id ? { ...e, url } : e)));
  };

  const removeEntry = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    commit(next.length > 0 ? next : [{ id: newEntryId(), url: '' }]);
  };

  const addEntry = () => {
    if (entries.length >= MAX_LINKS) return;
    setEntries((es) => [...es, { id: newEntryId(), url: '' }]);
  };

  const seen = new Map<Platform, number>();
  entries.forEach((e, idx) => {
    const p = detectPlatform(e.url);
    if (p && !seen.has(p)) seen.set(p, idx);
  });

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => {
        const platform = detectPlatform(entry.url);
        const trimmed = entry.url.trim();
        const isDuplicate = platform !== null && seen.get(platform) !== idx;
        const isUnknown = trimmed.length > 0 && platform === null;
        const meta = platform ? PLATFORM_META[platform] : null;
        return (
          <div key={entry.id} className="flex items-start gap-2">
            <div
              className={
                meta
                  ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-white overflow-hidden'
                  : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-muted overflow-hidden'
              }
              style={meta ? { backgroundColor: meta.bg, borderColor: meta.bg } : undefined}
              aria-label={meta?.name ?? 'Unknown social network'}
              title={
                meta?.name ??
                'Paste a LinkedIn, Facebook, Instagram, Reddit, Discord, Bluesky, or YouTube URL'
              }
            >
              {meta && platform ? (
                <SocialPlatformEditorIcon platform={platform as SocialPlatform} />
              ) : (
                <LinkIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <Input
                id={idx === 0 ? `${baseId}-first` : undefined}
                type="url"
                value={entry.url}
                onChange={(e) => updateUrl(entry.id, e.target.value)}
                placeholder="https://www.linkedin.com/in/…"
                aria-invalid={isUnknown || isDuplicate ? true : undefined}
              />
              {isUnknown ? (
                <p className="text-xs text-amber-600">
                  We don&apos;t recognize this network yet. Use a LinkedIn, Facebook, Instagram,
                  Reddit, Discord, Bluesky, or YouTube URL.
                </p>
              ) : null}
              {isDuplicate ? (
                <p className="text-xs text-amber-600">
                  You already added a {meta?.name} link — this one will replace it on save.
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 shrink-0 p-0"
              onClick={() => removeEntry(entry.id)}
              aria-label="Remove social link"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      {entries.length < MAX_LINKS && (
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="gap-1">
          <Plus className="h-4 w-4" />
          Add link
        </Button>
      )}
    </div>
  );
}
