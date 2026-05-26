export const EMAIL_HEALTH_FAQS = [
  {
    q: 'What does the Tailnote Email Health check analyze?',
    a: 'We review SPF, DKIM, DMARC, BIMI, MX mail routing, SMTP TLS support, and HTTPS configuration — the core signals that affect whether your domain looks trustworthy in inboxes.',
  },
  {
    q: 'Why are my emails going to spam?',
    a: 'Spam placement often comes from weak authentication (missing SPF, DKIM, or DMARC), poor sender reputation, or content triggers — not a single DNS record. Run a free scan to see which trust signals fail on your domain, then fix SPF, DKIM, and DMARC first before changing email copy or volume.',
  },
  {
    q: 'How does the email trust score work?',
    a: 'Your email trust score is a 0–100 rollup of seven checks: SPF, DKIM, DMARC, BIMI, MX routing, SMTP TLS, and HTTPS. Each category earns full, partial, or no points based on pass, warn, or fail — giving you one number for domain email health.',
  },
  {
    q: 'Is this SPF, DKIM, and DMARC checker free?',
    a: 'Yes. The SPF checker, DKIM checker, DMARC checker, and BIMI checker are free for any public domain. Results cache for about 24 hours; use Rescan anytime for a fresh email deliverability audit.',
  },
  {
    q: 'What is an email deliverability audit?',
    a: 'An email deliverability audit reviews the DNS and server settings inbox providers use to trust your mail. Our audit checks authentication (SPF, DKIM, DMARC), optional branding (BIMI), routing (MX), encryption (TLS), and HTTPS — then explains fixes in plain English.',
  },
  {
    q: 'Do I need BIMI for deliverability?',
    a: 'No. BIMI is optional branding (logo display in some inboxes). Missing BIMI does not block delivery, but a BIMI checker helps you see whether a record and logo URL are configured correctly.',
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
