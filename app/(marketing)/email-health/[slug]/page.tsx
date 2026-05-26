import { notFound } from 'next/navigation';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { CategoryBreakdown } from '@/components/email-health/CategoryBreakdown';
import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';
import { EmailHealthRescanButton } from '@/components/email-health/EmailHealthRescanButton';
import { EmailHealthScoreRing } from '@/components/email-health/EmailHealthScoreRing';
import { EmailHealthTailnoteCta } from '@/components/email-health/EmailHealthTailnoteCta';
import { IssueCard } from '@/components/email-health/IssueCard';
import { ScoreGuide } from '@/components/email-health/ScoreGuide';
import { buildStepsByCategory, getCategoryGuide } from '@/lib/email-health/categoryGuide';
import { aggregateDnsRecords } from '@/lib/email-health/scoring';
import { loadOrCreateScanBySlug } from '@/lib/email-health/loadScan';
import type { DomainIssue, EmailHealthCategory } from '@/lib/email-health/types';
import { breadcrumbJsonLd, faqPageJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
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

function problemsByCategory(issues: DomainIssue[]) {
  const map = new Map<EmailHealthCategory, DomainIssue[]>();
  for (const issue of problemIssues(issues)) {
    const list = map.get(issue.category) ?? [];
    list.push(issue);
    map.set(issue.category, list);
  }
  return map;
}

export default async function EmailHealthResultPage({ params }: Props) {
  const { slug } = await params;
  const scan = await loadOrCreateScanBySlug(slug);
  if (!scan) notFound();

  const problems = problemIssues(scan.issues);
  const stepsByCategory = buildStepsByCategory(scan.issues);
  const groupedProblems = problemsByCategory(scan.issues);
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
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/email-health" className="transition-colors hover:text-foreground">
                Email Health
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-foreground">{scan.domain}</li>
          </ol>
        </nav>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
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
            <ScoreGuide statusLabel={scan.statusLabel} />

            <section>
              <h2 className="text-lg font-semibold tracking-tight">Category breakdown</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each row shows what we measured, your points, and how to earn full credit when not passing.
              </p>
              <div className="mt-4">
                <CategoryBreakdown categories={scan.categories} stepsByCategory={stepsByCategory} />
              </div>
            </section>

            {problems.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold tracking-tight">Problems detected</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Follow the numbered steps on each card to move from warn or fail to pass.
                </p>
                <div className="mt-6 space-y-8">
                  {Array.from(groupedProblems.entries()).map(([category, categoryIssues]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {getCategoryGuide(category).label}
                      </h3>
                      <div className="mt-3 space-y-4">
                        {categoryIssues.map((issue, i) => (
                          <IssueCard key={`${issue.category}-${issue.title}-${i}`} issue={issue} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {dnsRecords.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold tracking-tight">DNS records to add</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Copy these into your DNS provider. Values may need customization for your host.
                </p>
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
