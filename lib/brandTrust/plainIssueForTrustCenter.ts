import type { DomainIssue, EmailHealthCategory } from '@/lib/email-health/types';

export type PlainIssueCopy = {
  summary: string;
  nextStep: string;
};

export type PlainIssueOptions = {
  domain?: string;
};

function lowerFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function stripAcronymsFromCard(text: string): string {
  return text
    .replace(/\bSPF\b/gi, 'sender policy')
    .replace(/\bDKIM\b/gi, 'message signing')
    .replace(/\bDMARC\b/gi, 'impersonation policy')
    .replace(/\bBIMI\b/gi, 'inbox logo setup')
    .replace(/\bMX\b/g, 'mail routing')
    .replace(/\bTLS\b/gi, 'encrypted delivery')
    .replace(/\bHTTPS\b/gi, 'secure website')
    .replace(/\bCMC\b/g, 'Common Mark Certificate')
    .replace(/\bVMC\b/g, 'Verified Mark Certificate');
}

function defaultForCategory(category: EmailHealthCategory): PlainIssueCopy {
  switch (category) {
    case 'spf':
      return {
        summary: 'Your domain does not clearly list which servers may send email as you.',
        nextStep: 'Add or update your sender policy record at your DNS provider, then rescan.',
      };
    case 'dkim':
      return {
        summary: 'Outgoing messages are not signed so receivers can verify they came from you.',
        nextStep: 'Turn on message signing in your email provider and add the record they give you.',
      };
    case 'dmarc':
      return {
        summary: 'You do not have a policy telling providers how to handle fake email from your domain.',
        nextStep: 'Add an impersonation policy record at your DNS provider, then rescan.',
      };
    case 'mx':
      return {
        summary: 'Mail routing for your domain needs attention.',
        nextStep: 'Check your MX records in DNS match your email host’s instructions.',
      };
    case 'tls':
      return {
        summary: 'Encrypted delivery for your mail servers could be improved.',
        nextStep: 'Confirm with your email host that encrypted delivery is enabled.',
      };
    case 'https':
      return {
        summary: 'Your website is not loading securely over HTTPS.',
        nextStep: 'Install a valid certificate and redirect HTTP traffic to HTTPS.',
      };
    case 'bimi':
      return {
        summary: 'Your inbox logo setup is not complete yet.',
        nextStep: 'Upload your logo, add the DNS record we provide, and rescan.',
      };
    default:
      return {
        summary: 'This area needs a small fix.',
        nextStep: 'Follow the steps below, then rescan.',
      };
  }
}

function spfPlain(issue: DomainIssue): PlainIssueCopy | null {
  const t = `${issue.title} ${issue.explanation}`.toLowerCase();
  if (t.includes('missing') || t.includes('no spf') || t.includes('not found')) {
    return {
      summary: 'Your domain does not list which servers are allowed to send email as you.',
      nextStep: 'Add a sender policy record at your DNS provider using the record below.',
    };
  }
  if (t.includes('+all') || t.includes('anyone may send')) {
    return {
      summary: 'Your sender policy is too permissive — it allows anyone to send as your domain.',
      nextStep: 'Tighten the policy so only your real mail servers are listed, then rescan.',
    };
  }
  if (t.includes('~all') || t.includes('?all') || t.includes('neutral')) {
    return {
      summary: 'Your sender policy does not strongly tell providers to reject unauthorized senders.',
      nextStep: 'Update the policy to clearly soft-fail or reject unknown senders.',
    };
  }
  if (t.includes('lookup') || t.includes('include')) {
    return {
      summary: 'Your sender policy has too many lookups or includes, which can cause random failures.',
      nextStep: 'Simplify the record with your email provider’s help, then rescan.',
    };
  }
  return null;
}

function dkimPlain(issue: DomainIssue): PlainIssueCopy | null {
  const t = `${issue.title} ${issue.explanation}`.toLowerCase();
  if (t.includes('no dkim') || t.includes('not found') || t.includes('missing')) {
    return {
      summary: 'Message signing is not set up, so providers cannot verify your mail is authentic.',
      nextStep: 'Enable signing in your email provider admin and publish the TXT record they provide.',
    };
  }
  if (t.includes('1024') || t.includes('shorter') || t.includes('key')) {
    return {
      summary: 'Your signing key is shorter than what many providers prefer today.',
      nextStep: 'Ask your email provider to rotate to a stronger key and update DNS.',
    };
  }
  return null;
}

function dmarcPlain(issue: DomainIssue): PlainIssueCopy | null {
  const t = `${issue.title} ${issue.explanation}`.toLowerCase();
  if (t.includes('no dmarc') || t.includes('not found') || t.includes('missing')) {
    return {
      summary: 'You do not have an impersonation policy published for your domain.',
      nextStep: 'Add a policy record at _dmarc in DNS — start with monitoring, then tighten over time.',
    };
  }
  if (t.includes('p=none') || t.includes('monitor')) {
    return {
      summary: 'Your policy is in monitoring-only mode and does not yet block impersonators.',
      nextStep: 'After reviewing reports, move to quarantine or reject for stronger protection.',
    };
  }
  if (t.includes('pct=')) {
    return {
      summary: 'Your policy only applies to a fraction of failing messages.',
      nextStep: 'Raise the percentage to 100 when you are confident legitimate mail passes.',
    };
  }
  return null;
}

function dnsAwareNextStep(issue: DomainIssue, domain: string | undefined, fallback: string): string {
  const records = (issue.dnsRecords ?? []).filter((r) => !r.exampleOnly);
  if (!records.length || !domain) return fallback;
  const host = records[0]!.host;
  if (host === '@') {
    return `Edit the TXT record at @ for ${domain} and replace it with the value below.`;
  }
  if (host === '_dmarc') {
    return `Edit the TXT record at _dmarc.${domain} and replace it with the value below.`;
  }
  return `Edit the ${records[0]!.type} record for ${domain} and replace it with the value below.`;
}

function finalizePlainCopy(
  issue: DomainIssue,
  copy: PlainIssueCopy,
  options?: PlainIssueOptions,
): PlainIssueCopy {
  return {
    summary: copy.summary,
    nextStep: dnsAwareNextStep(issue, options?.domain, copy.nextStep),
  };
}

export function plainIssueForTrustCenter(issue: DomainIssue, options?: PlainIssueOptions): PlainIssueCopy {
  const specialized =
    issue.category === 'spf'
      ? spfPlain(issue)
      : issue.category === 'dkim'
        ? dkimPlain(issue)
        : issue.category === 'dmarc'
          ? dmarcPlain(issue)
          : null;

  if (specialized) return finalizePlainCopy(issue, specialized, options);

  const defaults = defaultForCategory(issue.category);
  const hasCustomExplanation =
    issue.explanation &&
    !issue.explanation.toLowerCase().includes('spf') &&
    !issue.explanation.toLowerCase().includes('dkim') &&
    !issue.explanation.toLowerCase().includes('dmarc');

  if (hasCustomExplanation) {
    return finalizePlainCopy(
      issue,
      {
        summary: stripAcronymsFromCard(issue.explanation),
        nextStep: issue.recommendation
          ? stripAcronymsFromCard(issue.recommendation)
          : defaults.nextStep,
      },
      options,
    );
  }

  return finalizePlainCopy(issue, defaults, options);
}

/** Short phrase for pillar card body (no period). */
export function plainFixPhrase(issue: DomainIssue | undefined, fallback: string): string {
  if (!issue) return lowerFirst(fallback);
  return lowerFirst(plainIssueForTrustCenter(issue).summary.replace(/\.$/, ''));
}
