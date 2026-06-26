'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BimiCertificateGuide } from '@/components/email-health/BimiCertificateGuide';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BIMI_REALITY_CHECK } from '@/lib/email-health/bimiCopy';

type Props = {
  content: string;
  showCertificateLearn?: boolean;
};

export function TrustCenterLearnMore({ content, showCertificateLearn = false }: Props) {
  const [certOpen, setCertOpen] = useState(false);

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        Learn about this
        <ChevronDown className="h-4 w-4" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-3 text-sm text-muted-foreground">
        <p>{content}</p>
        {showCertificateLearn ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">{BIMI_REALITY_CHECK.body}</p>
            <button
              type="button"
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              onClick={() => setCertOpen((v) => !v)}
            >
              See certificate options
              <ChevronDown
                className={`h-4 w-4 transition-transform ${certOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {certOpen ? (
              <div className="mt-3">
                <BimiCertificateGuide compact />
              </div>
            ) : null}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
