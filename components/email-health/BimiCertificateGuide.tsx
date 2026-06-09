import { BIMI_CERTIFICATE_OPTIONS } from '@/lib/email-health/bimiCopy';
import { cn } from '@/lib/utils';

type CertificateCardProps = {
  shortName: string;
  name: string;
  requirement: string;
  gmailCheckmark: boolean;
  issuanceNote: string;
  priceLabel: string;
  purchaseUrl: string;
  purchaseLabel: string;
  compact?: boolean;
};

function CertificateCard({
  shortName,
  name,
  requirement,
  gmailCheckmark,
  issuanceNote,
  priceLabel,
  purchaseUrl,
  purchaseLabel,
  compact = false,
}: CertificateCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border/60 bg-background p-4">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{shortName}</p>
        <p className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>{name}</p>
      </div>

      <ul className={cn('flex-1 space-y-1.5 text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
        <li>{requirement}</li>
        <li>{issuanceNote}</li>
        <li>
          Gmail blue checkmark:{' '}
          <span className="font-medium text-foreground">{gmailCheckmark ? 'Yes' : 'No'}</span>
        </li>
      </ul>

      <div className="mt-4 border-t border-border/60 pt-3">
        <p className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>{priceLabel}</p>
        <a
          href={purchaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'mt-2 inline-flex items-center font-medium text-primary underline underline-offset-4 hover:text-primary/80',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {purchaseLabel}
        </a>
      </div>
    </div>
  );
}

export type BimiCertificateGuideProps = {
  compact?: boolean;
  className?: string;
};

export function BimiCertificateGuide({ compact = false, className }: BimiCertificateGuideProps) {
  const { title, intro, pricingDisclaimer, vmc, cmc } = BIMI_CERTIFICATE_OPTIONS;

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <p className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-base')}>{title}</p>
        <p className={cn('mt-1 text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>{intro}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CertificateCard {...cmc} compact={compact} />
        <CertificateCard {...vmc} compact={compact} />
      </div>

      <p className={cn('text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>{pricingDisclaimer}</p>
    </div>
  );
}
