import type { CheckStatus } from '@/lib/email-health/types';

const FETCH_TIMEOUT_MS = 8000;

export type CertificateClassification =
  | 'none'
  | 'self_asserted'
  | 'cmc_likely'
  | 'vmc_likely'
  | 'unknown';

export type CertificateConfidence = 'high' | 'medium' | 'low';

export type CertificateAnalysis = {
  status: CheckStatus | 'unknown';
  classification: CertificateClassification;
  confidence: CertificateConfidence;
  url?: string;
  summary: string;
  issuerHint?: string;
};

const VMC_ISSUER_HINTS = ['digicert', 'entrust', 'vmc', 'verified mark'];
const CMC_ISSUER_HINTS = ['cmc', 'common mark', 'certified mark'];

function decodePemBody(pem: string): string {
  return pem
    .replace(/-----BEGIN[^-]+-----/g, '')
    .replace(/-----END[^-]+-----/g, '')
    .replace(/\s/g, '');
}

function extractIssuerFromPem(text: string): string | undefined {
  const issuerMatch = text.match(/Issuer:\s*([^\n]+)/i);
  if (issuerMatch) return issuerMatch[1].trim();
  const orgMatch = text.match(/O\s*=\s*([^,\n/]+)/i);
  return orgMatch?.[1]?.trim();
}

function classifyFromIssuer(issuer: string | undefined): {
  classification: CertificateClassification;
  confidence: CertificateConfidence;
} {
  if (!issuer) return { classification: 'unknown', confidence: 'low' };
  const lower = issuer.toLowerCase();
  if (VMC_ISSUER_HINTS.some((h) => lower.includes(h))) {
    return { classification: 'vmc_likely', confidence: 'medium' };
  }
  if (CMC_ISSUER_HINTS.some((h) => lower.includes(h))) {
    return { classification: 'cmc_likely', confidence: 'medium' };
  }
  if (lower.includes('self') || lower.includes('localhost')) {
    return { classification: 'self_asserted', confidence: 'high' };
  }
  return { classification: 'unknown', confidence: 'low' };
}

export async function analyzeBimiCertificate(certUrl: string | undefined): Promise<CertificateAnalysis> {
  if (!certUrl?.trim()) {
    return {
      status: 'warn',
      classification: 'none',
      confidence: 'high',
      summary:
        'No certificate is linked yet — some inboxes (including Gmail) may require one before showing your logo',
    };
  }

  const url = certUrl.trim();
  if (!/^https:\/\//i.test(url)) {
    return {
      status: 'fail',
      classification: 'unknown',
      confidence: 'high',
      url,
      summary: 'Certificate link must use HTTPS',
    };
  }

  let body: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);
    if (!res.ok) {
      return {
        status: 'fail',
        classification: 'unknown',
        confidence: 'medium',
        url,
        summary: 'We could not download your BIMI certificate file',
      };
    }
    body = await res.text();
  } catch {
    return {
      status: 'fail',
      classification: 'unknown',
      confidence: 'low',
      url,
      summary: 'We could not reach your certificate file — check the URL is public',
    };
  }

  const isPem = /-----BEGIN CERTIFICATE-----/i.test(body);
  if (!isPem) {
    const lower = body.toLowerCase();
    if (lower.includes('self-asserted') || lower.includes('self asserted')) {
      return {
        status: 'warn',
        classification: 'self_asserted',
        confidence: 'medium',
        url,
        summary: 'This looks like self-asserted BIMI — stronger certificate verification may be needed for Gmail',
      };
    }
    return {
      status: 'warn',
      classification: 'unknown',
      confidence: 'low',
      url,
      summary: 'Certificate file found, but we could not confirm whether it is a VMC or CMC',
    };
  }

  const issuerHint = extractIssuerFromPem(body);
  const { classification, confidence } = classifyFromIssuer(issuerHint);

  if (classification === 'vmc_likely') {
    return {
      status: 'pass',
      classification,
      confidence,
      url,
      issuerHint,
      summary: 'A verified mark certificate (VMC) appears to be configured — best effort detection',
    };
  }

  if (classification === 'cmc_likely') {
    return {
      status: 'pass',
      classification,
      confidence,
      url,
      issuerHint,
      summary: 'A common mark certificate (CMC) appears to be configured — best effort detection',
    };
  }

  if (classification === 'self_asserted') {
    return {
      status: 'warn',
      classification,
      confidence,
      url,
      issuerHint,
      summary: 'Self-asserted BIMI detected — Gmail often requires a purchased VMC for logo display',
    };
  }

  const decoded = decodePemBody(body);
  if (decoded.length > 0 && decoded.length < 500) {
    return {
      status: 'warn',
      classification: 'self_asserted',
      confidence: 'low',
      url,
      summary: 'Certificate present but type could not be verified automatically',
    };
  }

  return {
    status: 'warn',
    classification: 'unknown',
    confidence: 'low',
    url,
    issuerHint,
    summary: 'Certificate file found, but we could not confirm VMC vs CMC with high confidence',
  };
}
