import { parseDomainInput } from '@/lib/email-health/domain';
import { scanBimi } from '@/lib/email-health/scanners/bimi';
import { scanDkim } from '@/lib/email-health/scanners/dkim';
import { scanDmarc } from '@/lib/email-health/scanners/dmarc';
import { scanHttps } from '@/lib/email-health/scanners/https';
import { scanMx } from '@/lib/email-health/scanners/mx';
import { scanSpf } from '@/lib/email-health/scanners/spf';
import { scanSmtpTls, smtpTlsInconclusiveResult } from '@/lib/email-health/scanners/smtpTls';
import { scoreFromCategories, statusLabelFromScore } from '@/lib/email-health/scoring';
import type { EmailHealthReport } from '@/lib/email-health/types';

const SCANNER_TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), SCANNER_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function runEmailHealthScan(rawDomain: string): Promise<EmailHealthReport> {
  const { domain, domainSlug } = parseDomainInput(rawDomain);
  const scannedAt = new Date();

  const [spf, dkim, dmarc, mx, https] = await Promise.all([
    withTimeout(scanSpf(domain), 'SPF'),
    withTimeout(scanDkim(domain), 'DKIM'),
    withTimeout(scanDmarc(domain), 'DMARC'),
    withTimeout(scanMx(domain), 'MX'),
    withTimeout(scanHttps(domain), 'HTTPS'),
  ]);

  const bimi = await withTimeout(
    scanBimi(domain, { dmarcRecord: dmarc.record }),
    'BIMI'
  );

  let tls;
  try {
    tls = await scanSmtpTls(mx.primaryMx, mx.mailProvider);
  } catch {
    tls = smtpTlsInconclusiveResult();
  }

  const categories = [
    spf.category,
    dkim.category,
    dmarc.category,
    bimi.category,
    mx.category,
    tls.category,
    https.category,
  ];

  const issues = [
    ...spf.issues,
    ...dkim.issues,
    ...dmarc.issues,
    ...bimi.issues,
    ...mx.issues,
    ...tls.issues,
    ...https.issues,
  ];

  const score = scoreFromCategories(categories);

  return {
    domain,
    domainSlug,
    score,
    statusLabel: statusLabelFromScore(score),
    categories,
    issues,
    mailProvider: mx.mailProvider,
    scannedAt,
    bimiDetail: bimi.bimiDetail,
  };
}
