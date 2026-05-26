import net from 'node:net';
import tls from 'node:tls';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';
import type { MailProvider } from '@/lib/email-health/scanners/mx';

const PROBE_TIMEOUT_MS = 4000;
const OVERALL_CAP_MS = 8000;

type ProbeResult = 'tls-ok' | 'plain-only' | 'unreachable';

function pickBestProbeResult(results: ProbeResult[]): ProbeResult {
  if (results.includes('tls-ok')) return 'tls-ok';
  if (results.includes('plain-only')) return 'plain-only';
  return 'unreachable';
}

function probeStartTls(host: string, port: number): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: PROBE_TIMEOUT_MS });
    let settled = false;
    let phase: 'banner' | 'ehlo' = 'banner';
    let buffer = '';

    const finish = (result: ProbeResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(PROBE_TIMEOUT_MS);
    socket.on('timeout', () => finish('unreachable'));
    socket.on('error', () => finish('unreachable'));

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');

      if (phase === 'banner') {
        if (!/220[\s-]/.test(buffer)) return;
        phase = 'ehlo';
        buffer = '';
        socket.write('EHLO tailnote-health.local\r\n');
        return;
      }

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

export function smtpTlsInconclusiveResult(reason?: string): SmtpTlsScanResult {
  const technicalDetail =
    reason ??
    `Unable to connect on ports 587/25 within ${PROBE_TIMEOUT_MS}ms from our servers.`;

  return {
    category: buildCategoryResult('tls', 'warn', 'TLS check inconclusive'),
    issues: [
      {
        category: 'tls',
        severity: 'warn',
        title: 'Could not verify mail server encryption from our servers',
        explanation:
          'Some cloud networks block outbound SMTP ports. This does not necessarily mean your mail is insecure.',
        recommendation:
          'Confirm STARTTLS is enabled with your email provider (Google, Microsoft, etc.).',
        stepsToPass: [
          'Check your email provider’s documentation — Google Workspace and Microsoft 365 enforce TLS by default.',
          'If you self-host mail, enable STARTTLS on ports 587 and 25 in your MTA settings.',
          'Ask your provider to confirm TLS is active if you cannot verify from DNS alone.',
          'Rescan after any mail-server change; inconclusive results may persist on blocked networks.',
        ],
        technicalDetail,
      },
    ],
  };
}

function providerTlsPassResult(mailProvider: MailProvider): SmtpTlsScanResult {
  return {
    category: buildCategoryResult('tls', 'pass', 'TLS enforced by provider'),
    issues: [
      {
        category: 'tls',
        severity: 'info',
        title: 'Mail encryption handled by your email provider',
        explanation: `${mailProvider} enforces TLS for mail delivery in production.`,
        recommendation: 'No action needed if you host email on this provider.',
        technicalDetail: 'Skipped live SMTP probe; TLS enforced by provider.',
      },
    ],
  };
}

async function probeMxHost(host: string): Promise<SmtpTlsScanResult> {
  const normalized = host.replace(/\.$/, '');
  const probeResults = await Promise.all(
    [587, 25].map((port) => probeStartTls(normalized, port))
  );
  const result = pickBestProbeResult(probeResults);

  if (result === 'tls-ok') {
    return {
      category: buildCategoryResult('tls', 'pass', 'STARTTLS supported'),
      issues: [
        {
          category: 'tls',
          severity: 'info',
          title: 'Mail server supports encrypted delivery (STARTTLS)',
          explanation:
            'Messages can be protected in transit between servers when peers use TLS.',
          recommendation: 'Keep TLS enabled and use strong certificates on your mail host.',
          technicalDetail: `STARTTLS probe succeeded for ${normalized}`,
        },
      ],
    };
  }

  if (result === 'plain-only') {
    return {
      category: buildCategoryResult('tls', 'warn', 'STARTTLS not confirmed'),
      issues: [
        {
          category: 'tls',
          severity: 'warn',
          title: 'Mail server may not advertise STARTTLS',
          explanation:
            'Without TLS, messages may travel unencrypted between mail servers — a deliverability and privacy concern.',
          recommendation: 'Enable STARTTLS on your mail host or confirm with your email provider.',
          stepsToPass: [
            'If using a cloud email host, open a support ticket to confirm STARTTLS is enabled on the MX host.',
            'If self-hosting, enable STARTTLS in Postfix, Exim, or your MTA and restart the service.',
            'Install a valid TLS certificate on the mail server (same or separate from web SSL).',
            'Test with an external SMTP checker, then rescan.',
          ],
          technicalDetail: `MX host ${normalized} did not complete STARTTLS handshake in our probe.`,
        },
      ],
    };
  }

  return smtpTlsInconclusiveResult(
    `Unable to connect to ${normalized} on ports 587/25 within ${PROBE_TIMEOUT_MS}ms.`
  );
}

export async function scanSmtpTls(
  mxHost: string | undefined,
  mailProvider?: MailProvider
): Promise<SmtpTlsScanResult> {
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
          stepsToPass: [
            'Add MX records from your email provider in DNS (see Mail routing section).',
            'Wait for DNS propagation (up to 48 hours).',
            'Run a new scan once MX records resolve.',
          ],
        },
      ],
    };
  }

  if (mailProvider === 'Google Workspace' || mailProvider === 'Microsoft 365') {
    return providerTlsPassResult(mailProvider);
  }

  const capped = Promise.race([
    probeMxHost(mxHost),
    new Promise<SmtpTlsScanResult>((resolve) => {
      setTimeout(() => resolve(smtpTlsInconclusiveResult('SMTP TLS probe exceeded time limit')), OVERALL_CAP_MS);
    }),
  ]);

  return capped;
}
