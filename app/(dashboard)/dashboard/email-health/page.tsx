import { DomainScanForm } from '@/components/email-health/DomainScanForm';
import { getDashboardSession } from '@/lib/dashboard/getDashboardContext';

export const dynamic = 'force-dynamic';

export default async function DashboardEmailHealthPage() {
  await getDashboardSession();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email health checker</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan any domain for SPF, DKIM, DMARC, BIMI, MX, TLS, and HTTPS signals that affect deliverability
          and trust. Results are saved so you can revisit or share the public report link.
        </p>
      </div>
      <DomainScanForm size="large" resultBasePath="/dashboard/email-health" />
    </div>
  );
}
