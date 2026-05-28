'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export function DesktopInstallNotice({ className }: Props) {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-foreground dark:bg-amber-950/30',
        className
      )}
      role="status"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden />
        <div className="min-w-0 space-y-2">
          <p>
            <strong className="font-semibold">Use a desktop or laptop to install.</strong> Gmail and Outlook on
            phones and tablets only accept plain-text signatures—images, colors, and layout cannot be pasted on
            mobile. After you set up on a computer, your full signature will still show when you send email from
            your phone.
          </p>
          <Collapsible open={whyOpen} onOpenChange={setWhyOpen}>
            <CollapsibleTrigger className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-200">
              Why?
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', whyOpen && 'rotate-180')}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Gmail</strong> (app and mobile browser): signature fields are
                plain text only. HTML, images, and styling are stripped if you paste a Tailnote signature there.
              </p>
              <p>
                <strong className="text-foreground">After desktop setup:</strong> In the Gmail app, turn off{' '}
                <strong className="text-foreground">Mobile signature</strong> or leave it blank so new messages
                use your web signature (including images) from the computer setup.
              </p>
              <p>
                <strong className="text-foreground">Outlook</strong>: Install via Outlook on the web or Outlook
                desktop (Windows). Mobile Outlook apps cannot reliably paste full HTML signatures.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
