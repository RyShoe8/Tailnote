'use client';

import { useState } from 'react';
import { Check, Copy, Facebook, Linkedin } from 'lucide-react';
import { absoluteUrl } from '@/lib/seo/site';
import { Button } from '@/components/ui/button';

type ShareButtonsProps = {
  title: string;
  path: string;
};

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6.5 3.5C9.5 6.5 12 11 12 11s2.5-4.5 5.5-7.5C19.5 1.5 22 3 22 6c0 4-3.5 7.5-3.5 7.5S14 19 12 19s-6.5-5.5-6.5-5.5S2 10 2 6c0-3 2.5-4.5 3.5-2.5z" />
    </svg>
  );
}

export function ShareButtons({ title, path }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(path);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
    },
    {
      label: 'Bluesky',
      href: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
      icon: BlueskyIcon,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: null,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-muted-foreground">Share</span>
      {shareLinks.map((link) => (
        <Button key={link.label} asChild variant="outline" size="sm" className="h-8 gap-1.5 px-2.5">
          <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${link.label}`}>
            {link.icon ? (
              <link.icon className="h-3.5 w-3.5" />
            ) : (
              <span className="text-xs font-bold">𝕏</span>
            )}
            <span className="sr-only sm:not-sr-only sm:text-xs">{link.label}</span>
          </a>
        </Button>
      ))}
      <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5" onClick={copyLink}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  );
}
