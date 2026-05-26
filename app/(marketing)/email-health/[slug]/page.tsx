import { notFound } from 'next/navigation';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { CategoryBreakdown } from '@/components/email-health/CategoryBreakdown';
import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';
import { EmailHealthRescanButton } from '@/components/email-health/EmailHealthRescanButton';
import { EmailHealthScoreRing } from '@/components/email-health/EmailHealthScoreRing';
import { EmailHealthTailnoteCta } from '@/components/email-health/EmailHealthTailnoteCta';
import { IssueCard } from '@/components/email-health/IssueCard';
import { aggregateDnsRecords } from '@/lib/email-health/scoring';
import { loadOrCreateScanBySlug } from '@/lib/email-health/loadScan';
import type { DomainIssue } from '@/lib/email-health/types';
import { faqPageJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/site';

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
  const title = `${scan.domain} Email Health Score: ${scan.score}/100`;
  const description = `${scan.domain} scored ${scan.score}/100 (${scan.statusLabel}). ${issueCount} item${issueCount === 1 ? '' : 's'} need attention. Free SPF, DKIM, and DMARC check by Tailnote.`;

  return createPageMetadata({
    title,
    description,
    path: `/email-health/${scan.domainSlug}`,
  });
}

function problemIssues(issues: DomainIssue[]) {
  return issues.filter((i) => i.severity === 'fail' || i.severity === 'warn');
}

function uniqueRecommendations(issues: DomainIssue[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const issue of problemIssues(issues)) {
    if (seen.has(issue.recommendation)) continue;
    seen.add(issue.recommendation);
    out.push(issue.recommendation);
  }
  return out;
}

export default async function EmailHealthResultPage({ params }: Props) {
  const { slug } = await params;
  const scan = await loadOrCreateScanBySlug(slug);
  if (!scan) notFound();

  const problems = problemIssues(scan.issues);
  const recommendations = uniqueRecommendations(scan.issues);
  const dnsRecords = aggregateDnsRecords(scan.issues);
  const scannedLabel = new Date(scan.scannedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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
            name: `${scan.domain} Email Health`,
            description: `Email trust score ${scan.score}/100 for ${scan.domain}`,
            dateModified: new Date(scan.scannedAt).toISOString().slice(0, 10),
          }),
          ...(seoFaqs.length > 0 ? [faqPageJsonLd(seoFaqs)] : []),
        ]}
      />

      <div className="container py-12 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/email-health"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Email Health
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{scan.domain}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Last scanned {scannedLabel}
              {scan.mailProvider ? ` · Likely hosted on ${scan.mailProvider}` : ''}
            </p>
          </div>
          <EmailHealthRescanButton domain={scan.domain} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card lg:sticky lg:top-24">
            <EmailHealthScoreRing score={scan.score} statusLabel={scan.statusLabel} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {scan.statusLabel === 'Excellent' || scan.statusLabel === 'Good'
                ? 'Your domain has solid email authentication basics.'
                : 'Address the items below to improve trust and deliverability.'}
            </p>
          </div>

          <div className="space-y-10 min-w-0">
            <section>
              <h2 className="text-lg font-semibold tracking-tight">Category breakdown</h2>
              <div className="mt-4">
                <CategoryBreakdown categories={scan.categories} />
              </div>
            </section>

            {problems.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold tracking-tight">Problems detected</h2>
                <div className="mt-4 space-y-4">
                  {problems.map((issue, i) => (
                    <IssueCard key={`${issue.category}-${issue.title}-${i}`} issue={issue} />
                  ))}
                </div>
              </section>
            ) : null}

            {recommendations.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold tracking-tight">Recommended fixes</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {recommendations.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {dnsRecords.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold tracking-tight">DNS records to add</h2>
                <div className="mt-4 space-y-3">
                  {dnsRecords.map((rec) => (
                    <DnsRecordCopy key={`${rec.type}-${rec.host}-${rec.value}`} record={rec} />
                  ))}
                </div>
              </section>
            ) : null}

            <EmailHealthTailnoteCta />
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Share this report:{' '}
          <span className="font-mono">{absoluteUrl(`/email-health/${scan.domainSlug}`)}</span>
        </p>
      </div>
    </div>
  );
}
