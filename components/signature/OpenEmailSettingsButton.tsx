'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openGmailSettingsMobileAware } from '@/lib/install/resolveGmailSettingsHref';

type Props = {
  href: string;
  label: string;
  disabled?: boolean;
  size?: 'default' | 'sm';
  onOpen?: () => void;
  /** Use Gmail app + mobile web fallback instead of a plain link. */
  gmailMobileAware?: boolean;
};

export function OpenEmailSettingsButton({
  href,
  label,
  disabled,
  size = 'default',
  onOpen,
  gmailMobileAware = false,
}: Props) {
  if (gmailMobileAware) {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={disabled}
        onClick={() => {
          onOpen?.();
          openGmailSettingsMobileAware();
        }}
      >
        {label}
        <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size={size} asChild disabled={disabled}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onOpen?.()}
      >
        {label}
        <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
      </a>
    </Button>
  );
}
