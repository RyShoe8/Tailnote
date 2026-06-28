import { CATEGORY_GUIDE } from '@/lib/email-health/categoryGuide';

export const EMAIL_HEALTH_PAGE_TITLE =
  'SPF, DKIM & DMARC Checker — Domain Email Health & Brand Trust';

export const EMAIL_HEALTH_PAGE_DESCRIPTION =
  'Free email deliverability audit: SPF checker, DKIM checker, DMARC checker, and BIMI checker. See why emails go to spam and fix DNS in plain English.';

/** Tooltip for nav/footer links to Email Health */
export const EMAIL_HEALTH_NAV_TITLE = EMAIL_HEALTH_PAGE_DESCRIPTION;

export const EMAIL_HEALTH_HERO = {
  eyebrow: 'Free email deliverability audit',
  h1: 'SPF, DKIM & DMARC checker for domain email health',
  h1Highlight: 'brand trust',
  subcopy:
    'Run a free email deliverability audit on any domain. Get an instant Brand Trust report plus SPF, DKIM, DMARC, and BIMI results in plain English — no sysadmin jargon.',
} as const;

export const EMAIL_HEALTH_FEATURE_CARDS = [
  {
    title: 'Brand trust report',
    body: 'A three-pillar evaluation of Inbox Delivery, Anti-Spoofing, and Inbox Logo readiness.',
  },
  {
    title: 'Deliverability audit',
    body: 'Seven checks across authentication, routing, and TLS — the same signals inbox providers weigh.',
  },
  {
    title: 'Plain-English fixes',
    body: 'Business-friendly explanations plus DNS records you can copy to your provider.',
  },
] as const;

export type EmailHealthCheckerSection = {
  id: string;
  title: string;
  body: string;
};

export const EMAIL_HEALTH_CHECKER_SECTIONS: EmailHealthCheckerSection[] = [
  {
    id: 'spf-checker',
    title: 'SPF checker',
    body: `${CATEGORY_GUIDE.spf.whatItChecks} ${CATEGORY_GUIDE.spf.whyItMatters}`,
  },
  {
    id: 'dkim-checker',
    title: 'DKIM checker',
    body: `${CATEGORY_GUIDE.dkim.whatItChecks} ${CATEGORY_GUIDE.dkim.whyItMatters}`,
  },
  {
    id: 'dmarc-checker',
    title: 'DMARC checker',
    body: `${CATEGORY_GUIDE.dmarc.whatItChecks} ${CATEGORY_GUIDE.dmarc.whyItMatters}`,
  },
  {
    id: 'bimi-checker',
    title: 'BIMI checker',
    body: `${CATEGORY_GUIDE.bimi.whatItChecks} ${CATEGORY_GUIDE.bimi.whyItMatters}`,
  },
];

export const EMAIL_HEALTH_DELIVERABILITY_AUDIT = {
  heading: 'Email deliverability audit',
  intro:
    'Every scan is a full email deliverability audit: we test SPF, DKIM, DMARC, BIMI, mail routing (MX), SMTP TLS, and HTTPS — then roll results into one domain email health report. Enter your domain above to start.',
  scoreSectionHeading: 'What’s in your domain brand trust report?',
  scoreSectionIntro:
    'Your report is broken down into three pillars: Inbox Delivery, Anti-Spoofing, and Inbox Logo. Each pillar aggregates multiple technical checks into a simple pass/fail status, with step-by-step instructions to fix any issues.',
} as const;

/** All checks for ItemList JSON-LD (includes supporting checks beyond primary keyword H2s). */
export const EMAIL_HEALTH_ITEM_LIST_CHECKS = [
  { id: 'spf-checker', name: 'SPF checker' },
  { id: 'dkim-checker', name: 'DKIM checker' },
  { id: 'dmarc-checker', name: 'DMARC checker' },
  { id: 'bimi-checker', name: 'BIMI checker' },
  { id: 'mx-check', name: 'Mail routing (MX)' },
  { id: 'tls-check', name: 'SMTP TLS' },
  { id: 'https-check', name: 'HTTPS' },
] as const;
