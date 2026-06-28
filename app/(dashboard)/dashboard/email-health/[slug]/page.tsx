import { notFound } from 'next/navigation';
import { EmailHealthReportView } from '@/components/email-health/EmailHealthReportView';
import { getDashboardSession } from '@/lib/dashboard/getDashboardContext';
import { loadOrCreateScanBySlug } from '@/lib/email-health/loadScan';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export default async function DashboardEmailHealthResultPage({ params }: Props) {
  await getDashboardSession();
  const { slug } = await params;
  const scan = await loadOrCreateScanBySlug(slug);
  if (!scan) notFound();

  return (
    <div className="space-y-6">
      <EmailHealthReportView
        scan={scan}
        indexHref="/dashboard/email-health"
        sharePathPrefix="/email-health"
        breadcrumbRoot={{ href: '/dashboard', label: 'Overview' }}
      />
    </div>
  );
}
