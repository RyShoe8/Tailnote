import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import { BIMI_REALITY_CHECK } from '@/lib/email-health/bimiCopy';
import { BimiEducationSection } from '@/components/email-health/BimiReadinessPanel';
import type { CheckStatus } from '@/lib/email-health/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function providerLabel(status: CheckStatus | 'unknown'): string {
  switch (status) {
    case 'pass':
      return 'Likely ready (not guaranteed)';
    case 'warn':
      return 'May work with improvements';
    case 'fail':
      return 'Not ready yet';
    default:
      return 'Unknown';
  }
}

export type BimiReportEducationProps = {
  bimi: BIMIResult;
};

export function BimiReportEducation({ bimi }: BimiReportEducationProps) {
  return (
    <section id="bimi">
      <h2 className="text-lg font-semibold tracking-tight">Brand logo (BIMI)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Learn how inbox brand logos work and what certificates you may need.
      </p>
      <div className="mt-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inbox provider notes</CardTitle>
            <CardDescription>{BIMI_REALITY_CHECK.body}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Gmail: {providerLabel(bimi.providerReadiness.gmail)}</li>
              <li>Yahoo: {providerLabel(bimi.providerReadiness.yahoo)}</li>
              <li>Fastmail: {providerLabel(bimi.providerReadiness.fastmail)}</li>
            </ul>
          </CardContent>
        </Card>
        <BimiEducationSection steps={bimi.implementationSteps} />
      </div>
    </section>
  );
}
