import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { EmailHealthReportView } from '@/components/email-health/EmailHealthReportView';
import { loadOrCreateScanBySlug } from '@/lib/email-health/loadScan';
import type { DomainIssue } from '@/lib/email-health/types';
import { breadcrumbJsonLd, faqPageJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const scan = await loadOrCreateScanBySlug(slug);
  if (!scan) {
    return { title: 'Email Health Report' };
  }

  const issueCount = scan.issues.filter((i) => i.severity === 'fail' || i.severity === 'warn').length;
  const title = `${scan.domain} Email Trust Score: ${scan.score}/100`;
  const description = `${scan.domain} email trust score: ${scan.score}/100 (${scan.statusLabel}). SPF, DKIM, DMARC, and BIMI checker results — ${issueCount} item${issueCount === 1 ? '' : 's'} need attention. Free domain email health report.`;

  return createPageMetadata({
    title,
    description,
    path: `/email-health/${scan.domainSlug}`,
  });
}

function problemIssues(issues: DomainIssue[]) {
  return issues.filter((i) => i.severity === 'fail' || i.severity === 'warn');
}

export default async function EmailHealthResultPage({ params }: Props) {
  const { slug } = await params;
  const scan = await loadOrCreateScanBySlug(slug);
  if (!scan) notFound();

  const problems = problemIssues(scan.issues);
  const seoFaqs = problems.slice(0, 5).map((issue) => ({
    q: issue.title,
    a: `${issue.explanation} ${issue.recommendation}`,
  }));

  return (
    <div className="relative isolate bg-white">
      <JsonLd
        data={[
          webPageJsonLd({
            path: `/email-health/${scan.domainSlug}`,
            name: `${scan.domain} Email Trust Score`,
            description: `Email trust score ${scan.score}/100 for ${scan.domain} — SPF, DKIM, DMARC, and BIMI checker results.`,
            dateModified: new Date(scan.scannedAt).toISOString().slice(0, 10),
          }),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Email Health', path: '/email-health' },
            { name: scan.domain, path: `/email-health/${scan.domainSlug}` },
          ]),
          ...(seoFaqs.length > 0 ? [faqPageJsonLd(seoFaqs)] : []),
        ]}
      />

      <div className="container py-12 sm:py-16">
        <EmailHealthReportView
          scan={scan}
          indexHref="/email-health"
          showSignupCta
          breadcrumbRoot={{ href: '/', label: 'Home' }}
        />
      </div>
    </div>
  );
}
