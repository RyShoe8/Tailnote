import net from 'node:net';
import tls from 'node:tls';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

const PROBE_TIMEOUT_MS = 6000;

function probeStartTls(
  host: string,
  port: number
): Promise<'tls-ok' | 'plain-only' | 'unreachable'> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: PROBE_TIMEOUT_MS });
    let settled = false;

    const finish = (result: 'tls-ok' | 'plain-only' | 'unreachable') => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(PROBE_TIMEOUT_MS);

    socket.on('timeout', () => finish('unreachable'));
    socket.on('error', () => finish('unreachable'));

    socket.on('connect', () => {
      socket.write('EHLO tailnote-health.local\r\n');
    });

    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      if (!buffer.includes('250')) return;

      if (buffer.toLowerCase().includes('starttls')) {
        const secure = tls.connect(
          { socket, servername: host, rejectUnauthorized: false },
          () => finish('tls-ok')
        );
        secure.on('error', () => finish('plain-only'));
      } else {
        finish('plain-only');
      }
    });
  });
}

export type SmtpTlsScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
};

export async function scanSmtpTls(mxHost: string | undefined): Promise<SmtpTlsScanResult> {
  const issues: DomainIssue[] = [];

  if (!mxHost) {
    return {
      category: buildCategoryResult('tls', 'warn', 'No MX host to test TLS'),
      issues: [
        {
          category: 'tls',
          severity: 'warn',
          title: 'Could not test mail server encryption',
          explanation: 'TLS checks require at least one MX record.',
          recommendation: 'Configure MX records first, then rescan.',
        },
      ],
    };
  }

  const host = mxHost.replace(/\.$/, '');
  let result: 'tls-ok' | 'plain-only' | 'unreachable' = 'unreachable';

  for (const port of [587, 25]) {
    result = await probeStartTls(host, port);
    if (result !== 'unreachable') break;
  }

  if (result === 'tls-ok') {
    issues.push({
      category: 'tls',
      severity: 'info',
      title: 'Mail server supports encrypted delivery (STARTTLS)',
      explanation: 'Messages can be protected in transit between servers when peers use TLS.',
      recommendation: 'Keep TLS enabled and use strong certificates on your mail host.',
      technicalDetail: `STARTTLS probe succeeded for ${host}`,
    });
    return {
      category: buildCategoryResult('tls', 'pass', 'STARTTLS supported'),
      issues,
    };
  }

  if (result === 'plain-only') {
    issues.push({
      category: 'tls',
      severity: 'warn',
      title: 'Mail server may not advertise STARTTLS',
      explanation:
        'Without TLS, messages may travel unencrypted between mail servers — a deliverability and privacy concern.',
      recommendation: 'Enable STARTTLS on your mail host or confirm with your email provider.',
      technicalDetail: `MX host ${host} did not complete STARTTLS handshake in our probe.`,
    });
    return {
      category: buildCategoryResult('tls', 'warn', 'STARTTLS not confirmed'),
      issues,
    };
  }

  issues.push({
    category: 'tls',
    severity: 'warn',
    title: 'Could not verify mail server encryption from our servers',
    explanation:
      'Some cloud networks block outbound SMTP ports. This does not necessarily mean your mail is insecure.',
    recommendation:
      'Confirm STARTTLS is enabled with your email provider (Google, Microsoft, etc.).',
    technicalDetail: `Unable to connect to ${host} on ports 587/25 within ${PROBE_TIMEOUT_MS}ms.`,
  });

  return {
    category: buildCategoryResult('tls', 'warn', 'TLS check inconclusive'),
    issues,
  };
}
