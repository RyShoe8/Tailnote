import { Mail, Shield, Badge, Lock, Globe, FileKey, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { ScanCheckRow, type ScanCheckRowAccent } from '@/components/brand-trust/trust-center/ScanCheckRow';

const CHECK_ITEMS = {
  inboxDelivery: [
    {
      name: 'Sender policy (SPF)',
      solution: 'We read your current DNS record and give you the exact TXT value to copy and paste.',
      icon: <FileKey className="h-4 w-4" />,
    },
    {
      name: 'Mail routing (MX)',
      solution: 'We flag missing or misconfigured mail routing and explain what to set at your DNS provider.',
      icon: <Mail className="h-4 w-4" />,
    },
    {
      name: 'Encrypted delivery (TLS)',
      solution: 'We check whether your mail servers accept encrypted delivery and tell you what to fix.',
      icon: <Lock className="h-4 w-4" />,
    },
    {
      name: 'Secure website (HTTPS)',
      solution: 'We confirm your site loads over HTTPS and note certificate or redirect issues.',
      icon: <Globe className="h-4 w-4" />,
    },
  ],
  antiSpoofing: [
    {
      name: 'Message signing (DKIM)',
      solution: 'We show whether signing is set up and walk you through enabling it with your email provider.',
      icon: <FileKey className="h-4 w-4" />,
    },
    {
      name: 'Impersonation policy (DMARC)',
      solution: 'We generate the policy record you need and help you tighten it over time.',
      icon: <Shield className="h-4 w-4" />,
    },
  ],
  inboxLogo: [
    {
      name: 'Logo DNS record (BIMI)',
      solution: 'After you upload your logo, we give you the DNS record to publish at your provider.',
      icon: <Badge className="h-4 w-4" />,
    },
    {
      name: 'Hosted logo file',
      solution: 'Upload your logo on Tailnote — we convert it to the format inboxes expect.',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      name: 'Certificate readiness (optional)',
      solution: 'We explain when a certificate is optional and when Gmail may require one.',
      icon: <FileKey className="h-4 w-4" />,
    },
  ],
};

const PILLARS: Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  gradient: string;
  iconBg: string;
  accent: ScanCheckRowAccent;
  checks: (typeof CHECK_ITEMS)[keyof typeof CHECK_ITEMS];
}> = [
  {
    id: 'inboxDelivery',
    title: 'Inbox delivery',
    subtitle: 'Will your mail land in the inbox, not spam?',
    icon: <Mail className="h-6 w-6" />,
    gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-200/60',
    iconBg: 'text-blue-600 bg-blue-100',
    accent: 'blue',
    checks: CHECK_ITEMS.inboxDelivery,
  },
  {
    id: 'antiSpoofing',
    title: 'Anti-spoofing',
    subtitle: 'Can receivers spot fake email from your domain?',
    icon: <Shield className="h-6 w-6" />,
    gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/60',
    iconBg: 'text-emerald-600 bg-emerald-100',
    accent: 'emerald',
    checks: CHECK_ITEMS.antiSpoofing,
  },
  {
    id: 'inboxLogo',
    title: 'Inbox logo',
    subtitle: 'Can your logo show beside messages in Gmail and others?',
    icon: <Badge className="h-6 w-6" />,
    gradient: 'from-amber-500/10 to-orange-500/10 border-amber-200/60',
    iconBg: 'text-amber-600 bg-amber-100',
    accent: 'amber',
    checks: CHECK_ITEMS.inboxLogo,
  },
];

export function EmailHealthScoreBreakdown() {
  return (
    <div className="space-y-8">
      {PILLARS.map((pillar) => (
        <div
          key={pillar.id}
          className={`rounded-xl border bg-gradient-to-br p-6 shadow-card ${pillar.gradient}`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${pillar.iconBg}`}>
              {pillar.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">{pillar.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pillar.subtitle}</p>
            </div>
          </div>

          <div className="space-y-4">
            {pillar.checks.map((check) => (
              <ScanCheckRow
                key={check.name}
                label={check.name}
                solution={check.solution}
                accent={pillar.accent}
                icon={check.icon}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
