'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BimiCertificateGuide } from '@/components/email-health/BimiCertificateGuide';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TRUST_CENTER_CERTIFICATE_PREAMBLE } from '@/lib/brandTrust/trustCenterCopy';
import type { TrustCenterLearnSection } from '@/lib/brandTrust/trustCenterCopy';

type Props = {
  sections: TrustCenterLearnSection[];
  showCertificateLearn?: boolean;
};

export function TrustCenterLearnMore({ sections, showCertificateLearn = false }: Props) {
  const [certOpen, setCertOpen] = useState(false);

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        Learn about this
        <ChevronDown className="h-4 w-4" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4 text-sm text-muted-foreground">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="font-medium text-foreground">{section.title}</p>
            <p className="mt-1">{section.body}</p>
          </div>
        ))}
        {showCertificateLearn ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">{TRUST_CENTER_CERTIFICATE_PREAMBLE}</p>
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
