export type LegalSection = {
  title: string;
  paragraphs?: string[];
  listItems?: string[];
};

export const LEGAL_LAST_UPDATED = 'May 22, 2026';

const MEDIA_SHOP = 'The Media Shop (themediashop.co)';

export const aboutContent = {
  title: 'About Us',
  intro:
    'Tailnote helps organizations create, manage, and deploy professional email signatures for every team member—without wrestling with inconsistent HTML or one-off designs.',
  sections: [
    {
      title: 'What we do',
      paragraphs: [
        'Tailnote is a SaaS platform built for modern teams that need consistent branding in every email. You choose from curated signature templates, set brand colors and logos, manage employees, and publish signatures that work in real inboxes—including optional hosted preview pages and Gmail integration.',
      ],
    },
    {
      title: 'Who operates Tailnote',
      paragraphs: [
        `Tailnote is operated by ${MEDIA_SHOP}. The Media Shop builds digital products and services for businesses that care about presentation, reliability, and growth.`,
      ],
    },
    {
      title: 'Why teams choose Tailnote',
      listItems: [
        'Curated templates designed for email client compatibility—not drag-and-drop chaos.',
        'Organization-wide control over branding, employees, and templates.',
        'Subscription billing with flexible plans and seat-based pricing.',
        'Hosted signature previews and optional click analytics when you enable tracking.',
      ],
    },
    {
      title: 'Get in touch',
      paragraphs: [
        'For general inquiries about Tailnote or The Media Shop, visit themediashop.co.',
      ],
    },
  ] satisfies LegalSection[],
};

export const privacyContent = {
  title: 'Privacy Policy',
  intro:
    'This Privacy Policy describes how The Media Shop ("we," "us," or "our") collects, uses, and shares information when you use Tailnote (the "Service"). By using the Service, you agree to this policy.',
  sections: [
    {
      title: 'Who is responsible for your data',
      paragraphs: [
        'The data controller for Tailnote is The Media Shop. Tailnote is a product operated by The Media Shop. Contact us through themediashop.co for privacy-related requests.',
      ],
    },
    {
      title: 'Information we collect',
      paragraphs: ['We collect information you provide and information generated through your use of the Service:'],
      listItems: [
        'Account information: name, email address, and credentials managed through our authentication provider (Better Auth).',
        'Organization and employee data: company name, job titles, contact fields, social links, signature content, and template preferences you enter in the dashboard.',
        'Uploaded assets: logos and images you upload for signatures (stored via Vercel Blob).',
        'Billing information: subscription and payment details processed by Stripe. We do not store full payment card numbers on our servers.',
        'Gmail integration (optional): if you connect Gmail, we receive OAuth tokens to apply signatures on your behalf. Tokens are encrypted at rest.',
        'Signature analytics (optional): when your organization enables click tracking, we log clicks on tracked links in signatures (for example, link URL and timestamp).',
        'Usage and technical data: IP address, browser type, device information, and pages visited, including through analytics tools described below.',
      ],
    },
    {
      title: 'How we use information',
      listItems: [
        'Provide, maintain, and improve the Service.',
        'Authenticate users and secure accounts.',
        'Process subscriptions and send billing-related communications.',
        'Apply email signatures through connected integrations when you request it.',
        'Generate signature HTML, hosted previews, and optional analytics reports.',
        'Comply with legal obligations and enforce our Terms.',
      ],
    },
    {
      title: 'Service providers and infrastructure',
      paragraphs: [
        'We use trusted third parties to operate Tailnote, including:',
        'These providers process data on our behalf under their own terms and privacy policies. We share only what is necessary to provide the Service.',
      ],
      listItems: [
        'MongoDB (database hosting) for application data.',
        'Vercel (hosting and file storage) for the application and uploaded logos.',
        'Stripe (payments) for subscriptions and billing.',
        'Google (OAuth / Gmail API) when you connect Gmail.',
        'Google Analytics (measurement ID G-DBX0LXGNND) and Ahrefs Analytics for website usage insights.',
      ],
    },
    {
      title: 'Cookies and analytics',
      paragraphs: [
        'Our marketing site uses cookies and similar technologies through Google Analytics and Ahrefs to understand traffic and improve the product. You can control cookies through your browser settings; some features may not function if cookies are disabled.',
      ],
    },
    {
      title: 'Data retention and security',
      paragraphs: [
        'We retain your information for as long as your account is active or as needed to provide the Service, comply with law, resolve disputes, and enforce agreements. We use reasonable administrative, technical, and organizational measures to protect your data, but no method of transmission or storage is completely secure.',
      ],
    },
    {
      title: 'Your rights and choices',
      paragraphs: [
        'Depending on your location, you may have rights to access, correct, delete, or export personal data, or to object to certain processing. To make a request, contact us through themediashop.co. We may need to verify your identity before responding.',
      ],
    },
    {
      title: "Children's privacy",
      paragraphs: [
        'Tailnote is not directed to children under 16, and we do not knowingly collect personal information from children. If you believe a child has provided us data, contact us and we will delete it.',
      ],
    },
    {
      title: 'Changes to this policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the updated policy.',
      ],
    },
    {
      title: 'Contact',
      paragraphs: ['For privacy questions, visit themediashop.co.'],
    },
  ] satisfies LegalSection[],
};

export const termsContent = {
  title: 'Terms and Conditions',
  intro:
    'These Terms and Conditions ("Terms") govern your access to and use of Tailnote, operated by The Media Shop. Please read them carefully before using the Service.',
  sections: [
    {
      title: 'Acceptance of terms',
      paragraphs: [
        'By creating an account, accessing, or using Tailnote, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service.',
      ],
    },
    {
      title: 'Eligibility and accounts',
      listItems: [
        'You must be at least 18 years old and able to form a binding contract to use Tailnote.',
        'You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.',
        'You must provide accurate information and keep your account details up to date.',
        'If you use Tailnote on behalf of an organization, you represent that you have authority to bind that organization to these Terms.',
      ],
    },
    {
      title: 'Subscriptions and billing',
      paragraphs: [
        'Paid plans are billed through Stripe according to the pricing shown at checkout or in your dashboard. Fees are charged in advance for the billing period selected unless otherwise stated. Plan limits (such as included users or promotional caps) are enforced as described at purchase.',
        'You may cancel or change plans through the billing portal where available. Refunds are handled according to our published refund policy and applicable law. We may change pricing with reasonable notice for future billing periods.',
      ],
    },
    {
      title: 'Lifetime subscriptions',
      paragraphs: [
        'Lifetime plans are one-time purchases that grant access to Tailnote for as long as we continue to operate the Service. "Lifetime" means for the life of the platform, not for the life of the purchaser or any fixed calendar term beyond what is stated below.',
        'We guarantee that your Lifetime access will remain active for at least twelve (12) months from the date of purchase. If we discontinue the Service or end Lifetime access before that twelve-month period has elapsed, we will honor access through the end of that minimum period or provide a remedy consistent with applicable law (such as a pro-rata refund), at our discretion.',
        'Lifetime access does not constitute a promise that Tailnote will operate indefinitely, and does not entitle you to compensation beyond the minimum period described above if we wind down the Service in compliance with these Terms.',
      ],
    },
    {
      title: 'Acceptable use',
      paragraphs: ['You agree not to:'],
      listItems: [
        'Use the Service for unlawful, fraudulent, or harmful purposes.',
        'Upload content that infringes intellectual property or privacy rights of others.',
        'Attempt to gain unauthorized access to systems, accounts, or data.',
        'Interfere with or disrupt the Service, including through automated abuse or excessive load.',
        'Use Tailnote to send spam or misleading communications in violation of applicable law.',
      ],
    },
    {
      title: 'Your content and intellectual property',
      paragraphs: [
        'You retain ownership of logos, text, and other materials you upload ("Customer Content"). You grant us a limited license to host, process, and display Customer Content solely to provide the Service (for example, rendering signatures and hosted previews).',
        'Tailnote software, templates, documentation, and branding are owned by The Media Shop or its licensors. Except for the limited right to use the Service, no rights are granted to you in our intellectual property.',
      ],
    },
    {
      title: 'Disclaimer of warranties',
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT SIGNATURES WILL RENDER IDENTICALLY IN EVERY EMAIL CLIENT.',
      ],
    },
    {
      title: 'Limitation of liability',
      paragraphs: [
        'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE MEDIA SHOP AND ITS AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS LIMITED TO THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED U.S. DOLLARS ($100), WHICHEVER IS GREATER.',
      ],
    },
    {
      title: 'Termination',
      paragraphs: [
        'You may stop using Tailnote at any time. We may suspend or terminate access if you violate these Terms, fail to pay fees, or if we discontinue the Service with reasonable notice where practicable. Upon termination, your right to use the Service ends; provisions that by nature should survive will remain in effect.',
      ],
    },
    {
      title: 'Governing law',
      paragraphs: [
        'These Terms are governed by the laws of the United States and the State of Delaware, without regard to conflict-of-law principles, except where mandatory local law applies. Any disputes will be resolved in the courts located in Delaware, unless otherwise required by applicable law.',
      ],
    },
    {
      title: 'Changes and contact',
      paragraphs: [
        'We may modify these Terms by posting an updated version on this page. Material changes will be indicated by updating the "Last updated" date. Continued use after changes constitutes acceptance.',
        'Questions about these Terms: visit themediashop.co. For privacy practices, see our Privacy Policy.',
      ],
    },
  ] satisfies LegalSection[],
};
