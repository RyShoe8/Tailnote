import { CATEGORY_GUIDE } from '@/lib/email-health/categoryGuide';

export const EMAIL_HEALTH_PAGE_TITLE =
  'SPF, DKIM & DMARC Checker — Domain Email Health & Trust Score';

export const EMAIL_HEALTH_PAGE_DESCRIPTION =
  'Free email deliverability audit: SPF checker, DKIM checker, DMARC checker, BIMI checker, and a 0–100 email trust score. See why emails go to spam and fix DNS in plain English.';

/** Tooltip for nav/footer links to Email Health */
export const EMAIL_HEALTH_NAV_TITLE = EMAIL_HEALTH_PAGE_DESCRIPTION;

export const EMAIL_HEALTH_HERO = {
  eyebrow: 'Free email deliverability audit',
  h1: 'SPF, DKIM & DMARC checker for domain email health',
  h1Highlight: 'email trust score',
  subcopy:
    'Run a free email deliverability audit on any domain. Get an instant 0–100 trust score plus SPF, DKIM, DMARC, and BIMI results in plain English — no sysadmin jargon.',
} as const;

export const EMAIL_HEALTH_FEATURE_CARDS = [
  {
    title: 'Email trust score',
    body: 'A single 0–100 score with clear status levels so you know where your domain email health stands.',
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
    'Every scan is a full email deliverability audit: we test SPF, DKIM, DMARC, BIMI, mail routing (MX), SMTP TLS, and HTTPS — then roll results into one domain email health score. Enter your domain above to start.',
  scoreSectionHeading: 'What’s in your domain email health score?',
  scoreSectionIntro:
    'Your email trust score adds up to 100 points across seven checks. Pass earns full credit; warn earns partial; fail earns none. Every warn includes step-by-step instructions to reach a pass.',
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
