export const EMAIL_HEALTH_FAQS = [
  {
    q: 'What does the Tailnote Email Health check analyze?',
    a: 'We review SPF, DKIM, DMARC, BIMI, MX mail routing, SMTP TLS support, and HTTPS configuration — the core signals that affect whether your domain looks trustworthy in inboxes.',
  },
  {
    q: 'Is this tool free?',
    a: 'Yes. You can scan any public domain for free. Results are cached for about 24 hours; use Rescan anytime for a fresh check.',
  },
  {
    q: 'How often should I rescan my domain?',
    a: 'After you change DNS or email providers, run a new scan. Otherwise a weekly check is enough for most small teams.',
  },
  {
    q: 'Does a low score mean my emails go to spam?',
    a: 'Not always — but missing DMARC or SPF often hurts trust. Use the recommended fixes below each issue to improve deliverability and reduce impersonation risk.',
  },
] as const;
