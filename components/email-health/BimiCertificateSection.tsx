import Link from 'next/link';
import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import {
  BIMI_PROVIDER_MATRIX,
  BIMI_WHAT_IS,
  PAID_BIMI_HOSTING_CTA,
} from '@/lib/email-health/bimiCopy';
import { BimiCertificateGuide } from '@/components/email-health/BimiCertificateGuide';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CheckStatus } from '@/lib/email-health/types';

function providerLabel(status: CheckStatus | 'unknown'): string {
  switch (status) {
    case 'pass':
      return 'Likely ready';
    case 'warn':
      return 'May work with improvements';
    case 'fail':
      return 'Not ready yet';
    default:
      return 'Unknown';
  }
}

export type BimiCertificateSectionProps = {
  bimi: BIMIResult;
  showHostingCallout?: boolean;
};

export function BimiCertificateSection({
  bimi,
  showHostingCallout = true,
}: BimiCertificateSectionProps) {
  const { title, intro, footnote, columns, providers } = BIMI_PROVIDER_MATRIX;

  return (
    <section id="bimi-certificates">
      <h2 className="text-lg font-semibold tracking-tight">BIMI certificates and inbox support</h2>
      <p className="mt-1 text-sm text-muted-foreground">{BIMI_WHAT_IS.body}</p>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{intro}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Your domain right now: </span>
            Gmail {providerLabel(bimi.providerReadiness.gmail)} · Yahoo{' '}
            {providerLabel(bimi.providerReadiness.yahoo)} · Fastmail{' '}
            {providerLabel(bimi.providerReadiness.fastmail)}
          </p>

          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="px-3 py-2.5 font-medium text-foreground">Provider</th>
                  <th className="px-3 py-2.5 font-medium text-foreground">{columns.dnsOnly}</th>
                  <th className="px-3 py-2.5 font-medium text-foreground">{columns.cmc}</th>
                  <th className="px-3 py-2.5 font-medium text-foreground">{columns.vmc}</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((row) => (
                  <tr key={row.name} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2.5 font-medium text-foreground">{row.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{row.dnsOnly}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{row.cmc}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{row.vmc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">{footnote}</p>

          <BimiCertificateGuide />

          {showHostingCallout ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-muted-foreground">
              {PAID_BIMI_HOSTING_CTA}{' '}
              <Link href="/pricing" className="font-medium text-primary underline underline-offset-4">
                See paid plans
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
