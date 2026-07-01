import type { SignatureLayout } from './types';
import {
  getLayoutReorderRules,
  resolveFieldOrder,
} from './layoutReorderRules';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildOrderedFieldHtml(
  order: readonly string[],
  renderers: Record<string, () => string | undefined>,
): string {
  const parts: string[] = [];
  for (const field of order) {
    const html = renderers[field]?.();
    if (html) parts.push(html);
  }
  return parts.join('');
}

export type OrderedContactBuildInput = {
  layout: SignatureLayout;
  contactDisplayOrder?: string[];
  fullName: string;
  title: string;
  email: string;
  officePhone: string;
  mobilePhone: string;
  officePhoneTelHref: string;
  mobilePhoneTelHref: string;
  website: string;
  websiteDisplay: string;
  companyName: string;
  primaryColor: string;
  hasName: boolean;
  hasTitle: boolean;
  hasLogo: boolean;
  hasLogoSizedHeight: boolean;
  hasLogoAutoHeight: boolean;
  logoUrl: string;
  logoLink: string;
  logoWidthStr: string;
  logoDisplayHeightStr: string;
  logoImgBorderRadius: string;
  pHidden: string[];
  bHidden: string[];
  addressBlockHtml?: string;
  showAddressBlock?: boolean;
  creatorAccentColor?: string;
  portfolioPanelColor?: string;
  portfolioBorderColor?: string;
  portfolioAccentColor?: string;
  portfolioCardTextColor?: string;
  formatPortfolioPhoneDisplay?: (phone: string) => string;
};

function logoBlock(input: OrderedContactBuildInput): string | undefined {
  if (!input.hasLogo || input.bHidden.includes('logoUrl')) return undefined;
  const sizedImg = input.hasLogoSizedHeight
    ? `<img src="${escapeHtml(input.logoUrl)}" width="${escapeHtml(input.logoWidthStr)}" height="${escapeHtml(input.logoDisplayHeightStr)}" border="0" alt="" style="display:block;max-width:${escapeHtml(input.logoWidthStr)}px;width:${escapeHtml(input.logoWidthStr)}px;height:${escapeHtml(input.logoDisplayHeightStr)}px;border:0;outline:none;text-decoration:none;border-radius:${escapeHtml(input.logoImgBorderRadius)};" />`
    : '';
  const autoImg = input.hasLogoAutoHeight
    ? `<img src="${escapeHtml(input.logoUrl)}" width="${escapeHtml(input.logoWidthStr)}" border="0" alt="" style="display:block;max-width:${escapeHtml(input.logoWidthStr)}px;width:${escapeHtml(input.logoWidthStr)}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:${escapeHtml(input.logoImgBorderRadius)};" />`
    : '';
  return `<div data-sig-field="logo" style="margin-bottom:8px;"><a href="${escapeHtml(input.logoLink)}" style="text-decoration:none;border:0;outline:none;display:block;">${sizedImg}${autoImg}</a></div>`;
}

function nameBlock(input: OrderedContactBuildInput, style: string): string | undefined {
  if (!input.hasName) return undefined;
  return `<div data-sig-field="name" style="${style}">${escapeHtml(input.fullName)}</div>`;
}

function titleBlock(input: OrderedContactBuildInput, style: string): string | undefined {
  if (!input.hasTitle) return undefined;
  return `<div data-sig-field="title" style="${style}">${escapeHtml(input.title)}</div>`;
}

function companyBlock(input: OrderedContactBuildInput, style: string): string | undefined {
  if (!input.companyName.trim() || input.bHidden.includes('companyName')) return undefined;
  return `<div data-sig-field="companyName" style="${style}">${escapeHtml(input.companyName)}</div>`;
}

function addressBlock(input: OrderedContactBuildInput): string | undefined {
  if (!input.showAddressBlock || !input.addressBlockHtml) return undefined;
  return `<div data-sig-field="address" style="font-size:12px;color:#555;line-height:1.35;margin-bottom:8px;">${input.addressBlockHtml}</div>`;
}

function standardContactTableRows(input: OrderedContactBuildInput, order: readonly string[]): string {
  const rows: string[] = [];
  for (const field of order) {
    if (field === 'officePhone' && input.officePhone) {
      rows.push(`<tr><td width="1%" valign="top" style="width:1%;white-space:nowrap;padding:0 8px 4px 0;color:#000;font-weight:700;">Office:</td><td valign="top" style="padding:0 0 4px 0;"><span data-sig-field="officePhone"><a href="${escapeHtml(input.officePhoneTelHref)}" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(input.officePhone)}</a></span></td></tr>`);
    } else if (field === 'mobilePhone' && input.mobilePhone) {
      rows.push(`<tr><td width="1%" valign="top" style="width:1%;white-space:nowrap;padding:0 8px 4px 0;color:#000;font-weight:700;">Mobile:</td><td valign="top" style="padding:0 0 4px 0;"><span data-sig-field="mobilePhone"><a href="${escapeHtml(input.mobilePhoneTelHref)}" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(input.mobilePhone)}</a></span></td></tr>`);
    } else if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      rows.push(`<tr><td colspan="2" valign="top" style="padding:0;"><span data-sig-field="email"><a href="mailto:${escapeHtml(input.email)}" style="color:${escapeHtml(input.primaryColor)};text-decoration:none;">${escapeHtml(input.email)}</a></span></td></tr>`);
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      rows.push(`<tr><td colspan="2" valign="top" style="padding:0;"><span data-sig-field="website"><a href="${escapeHtml(input.website)}" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(input.websiteDisplay)}</a></span></td></tr>`);
    }
  }
  if (!rows.length) return '';
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows.join('')}</table>`;
}

function corporateContactTableRows(input: OrderedContactBuildInput, order: readonly string[]): string {
  const rows: string[] = [];
  for (const field of order) {
    if (field === 'officePhone' && input.officePhone) {
      rows.push(`<tr><td colspan="2" valign="top" style="padding:0 0 5px 0;"><span data-sig-field="officePhone"><a href="${escapeHtml(input.officePhoneTelHref)}" style="color:#333;text-decoration:none;">${escapeHtml(input.officePhone)}</a></span></td></tr>`);
    } else if (field === 'mobilePhone' && input.mobilePhone) {
      rows.push(`<tr><td width="1%" valign="top" style="width:1%;white-space:nowrap;padding:0 8px 5px 0;color:${escapeHtml(input.primaryColor)};font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;">Mobile</td><td valign="top" style="padding:0 0 5px 0;"><span data-sig-field="mobilePhone"><a href="${escapeHtml(input.mobilePhoneTelHref)}" style="color:#333;text-decoration:none;">${escapeHtml(input.mobilePhone)}</a></span></td></tr>`);
    } else if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      rows.push(`<tr><td colspan="2" valign="top" style="padding:0 0 5px 0;"><span data-sig-field="email"><a href="mailto:${escapeHtml(input.email)}" style="color:${escapeHtml(input.primaryColor)};text-decoration:none;font-weight:500;">${escapeHtml(input.email)}</a></span></td></tr>`);
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      rows.push(`<tr><td colspan="2" valign="top" style="padding:0 0 2px 0;"><span data-sig-field="website"><a href="${escapeHtml(input.website)}" style="color:#333;text-decoration:none;">${escapeHtml(input.websiteDisplay)}</a></span></td></tr>`);
    }
  }
  if (!rows.length) return '';
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:13px;">${rows.join('')}</table>`;
}

function professionalContactTableRows(input: OrderedContactBuildInput, order: readonly string[]): string {
  const rows: string[] = [];
  for (const field of order) {
    if (field === 'officePhone' && input.officePhone) {
      rows.push(`<tr><td colspan="2" valign="top" style="padding:0 0 4px 0;"><span data-sig-field="officePhone"><a href="${escapeHtml(input.officePhoneTelHref)}" style="color:#444;text-decoration:none;">${escapeHtml(input.officePhone)}</a></span></td></tr>`);
    } else if (field === 'mobilePhone' && input.mobilePhone) {
      rows.push(`<tr><td width="1%" valign="top" style="width:1%;white-space:nowrap;padding:0 6px 4px 0;color:${escapeHtml(input.primaryColor)};font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;">Mobile</td><td valign="top" style="padding:0 0 4px 0;"><span data-sig-field="mobilePhone"><a href="${escapeHtml(input.mobilePhoneTelHref)}" style="color:#444;text-decoration:none;">${escapeHtml(input.mobilePhone)}</a></span></td></tr>`);
    } else if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      rows.push(`<tr><td colspan="2" valign="top" style="padding:0 0 4px 0;"><span data-sig-field="email"><a href="mailto:${escapeHtml(input.email)}" style="color:${escapeHtml(input.primaryColor)};text-decoration:none;font-weight:600;">${escapeHtml(input.email)}</a></span></td></tr>`);
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      rows.push(`<tr><td colspan="2" valign="top" style="padding:0;"><span data-sig-field="website"><a href="${escapeHtml(input.website)}" style="color:#444;text-decoration:none;">${escapeHtml(input.websiteDisplay)}</a></span></td></tr>`);
    }
  }
  if (!rows.length) return '';
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;"><tr><td bgcolor="#f0f4ff" style="background-color:#f0f4ff;border-radius:10px;padding:10px 12px;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:12px;">${rows.join('')}</table></td></tr></table>`;
}

function defaultContactRowOrdered(input: OrderedContactBuildInput, order: readonly string[]): string {
  const parts: string[] = [];
  for (const field of order) {
    if (field === 'officePhone' && input.officePhone) {
      parts.push(`<span data-sig-field="officePhone"><span style="font-weight:600;color:#111111;">P:&nbsp;</span><a href="${escapeHtml(input.officePhoneTelHref)}" style="color:#555555;text-decoration:none;">${escapeHtml(input.officePhone)}</a></span>`);
    } else if (field === 'mobilePhone' && input.mobilePhone) {
      parts.push(`<span data-sig-field="mobilePhone"><span style="font-weight:600;color:#111111;">P:&nbsp;</span><a href="${escapeHtml(input.mobilePhoneTelHref)}" style="color:#555555;text-decoration:none;">${escapeHtml(input.mobilePhone)}</a></span>`);
    } else if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      parts.push(`<span data-sig-field="email"><span style="font-weight:600;color:#111111;">E:&nbsp;</span><a href="mailto:${escapeHtml(input.email)}" style="color:#555555;text-decoration:none;">${escapeHtml(input.email)}</a></span>`);
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      parts.push(`<span data-sig-field="website"><span style="font-weight:600;color:#111111;">W:&nbsp;</span><a href="${escapeHtml(input.website)}" style="color:#555555;text-decoration:none;">${escapeHtml(input.websiteDisplay)}</a></span>`);
    }
  }
  return parts.join(' &nbsp;|&nbsp; ');
}

export function buildMpMiddleColumnHtml(input: OrderedContactBuildInput): string {
  const rules = getLayoutReorderRules('modern_professional');
  const order = resolveFieldOrder(rules, input.contactDisplayOrder);
  const mpSecondary = 'font-family:inherit;font-size:14px;line-height:1.35;color:#374151;';
  let contactRowsHtml = '';
  let html = '';

  const flushContactRows = () => {
    if (contactRowsHtml) {
      html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;${mpSecondary}">${contactRowsHtml}</table>`;
      contactRowsHtml = '';
    }
  };

  for (const field of order) {
    if (field === 'logo') {
      flushContactRows();
      const block = logoBlock({ ...input, hasLogo: input.hasLogo });
      if (block) html += block.replace('margin-bottom:8px', 'margin-bottom:2px');
    } else if (field === 'name') {
      flushContactRows();
      const block = nameBlock(input, 'font-size:16px;font-weight:700;color:#111827;line-height:1.3;margin-bottom:2px;letter-spacing:-0.2px;');
      if (block) html += block;
    } else if (field === 'title') {
      flushContactRows();
      const block = titleBlock(input, `${mpSecondary}margin-bottom:2px;`);
      if (block) html += block;
    } else if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      contactRowsHtml += `<tr><td style="padding-bottom:2px;${mpSecondary}white-space:normal;"><div data-sig-field="email" style="display:inline-block;"><a href="mailto:${escapeHtml(input.email)}" style="${mpSecondary}text-decoration:none;">${escapeHtml(input.email)}</a></div></td></tr>`;
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      contactRowsHtml += `<tr><td style="padding-bottom:2px;${mpSecondary}white-space:normal;"><div data-sig-field="website" style="display:inline-block;"><a href="${escapeHtml(input.website)}" style="${mpSecondary}text-decoration:none;">${escapeHtml(input.websiteDisplay)}</a></div></td></tr>`;
    }
  }
  flushContactRows();
  return html;
}

export function buildOrderedMainStackHtml(input: OrderedContactBuildInput): string {
  const rules = getLayoutReorderRules(input.layout);
  const order = resolveFieldOrder(rules, input.contactDisplayOrder);
  const contactFields = new Set(['email', 'officePhone', 'mobilePhone', 'website']);
  const contactOrder = order.filter((f) => contactFields.has(f));

  if (input.layout === 'default') {
    const blocks: Record<string, () => string | undefined> = {
      name: () => nameBlock(input, 'font-size:18px;font-weight:700;color:#111111;margin-bottom:2px;'),
      title: () => titleBlock(input, `font-size:12px;font-weight:600;color:${escapeHtml(input.primaryColor)};letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;`),
      email: () => undefined,
      officePhone: () => undefined,
      mobilePhone: () => undefined,
      website: () => undefined,
    };
    let html = buildOrderedFieldHtml(order.filter((f) => !contactFields.has(f)), blocks);
    const row = defaultContactRowOrdered(input, contactOrder);
    if (row) {
      html += `<div data-sig-field="contactRow" style="font-size:13px;color:#555555;margin-bottom:12px;">${row}</div>`;
    }
    return html;
  }

  if (input.layout === 'stacked') {
    const blocks: Record<string, () => string | undefined> = {
      name: () => nameBlock(input, 'font-size:16px;font-weight:600;color:#000;'),
      title: () => titleBlock(input, 'font-size:13px;color:#666;margin-top:2px;'),
      address: () => addressBlock(input),
    };
    let html = buildOrderedFieldHtml(order.filter((f) => !contactFields.has(f)), blocks);
    const table = standardContactTableRows(input, contactOrder);
    if (table) {
      html += `<div style="height:10px;"></div>${table}`;
    }
    return html;
  }

  if (input.layout === 'corporate') {
    const blocks: Record<string, () => string | undefined> = {
      name: () =>
        nameBlock(
          input,
          `font-size:18px;font-weight:700;color:${escapeHtml(input.primaryColor)};letter-spacing:-0.2px;`,
        ),
      title: () =>
        titleBlock(
          input,
          'font-size:13px;color:#555;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;',
        ),
      companyName: () => companyBlock(input, 'font-size:13px;color:#444;margin-top:2px;'),
    };
    let html = buildOrderedFieldHtml(order.filter((f) => !contactFields.has(f)), blocks);
    const table = corporateContactTableRows(input, contactOrder);
    if (table) {
      html += `<div style="height:12px;"></div>${table}`;
    }
    return html;
  }

  if (input.layout === 'professional') {
    const nameTitle = buildOrderedFieldHtml(
      order.filter((f) => f === 'name' || f === 'title' || f === 'companyName'),
      {
        name: () =>
          nameBlock(
            input,
            `font-size:18px;font-weight:700;color:${escapeHtml(input.primaryColor)};letter-spacing:-0.2px;line-height:1.2;`,
          ),
        title: () =>
          titleBlock(
            input,
            'font-size:11px;color:#5c6370;margin-top:2px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;line-height:1.3;',
          ),
        companyName: () => companyBlock(input, 'font-size:11px;color:#5c6370;margin-top:2px;'),
      },
    );
    const wrappedNameTitle = nameTitle
      ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;"><tr><td bgcolor="#f0f4ff" style="background-color:#f0f4ff;border-radius:10px;padding:10px 12px 8px 12px;">${nameTitle}</td></tr></table>`
      : '';
    const table = professionalContactTableRows(input, contactOrder);
    return `${wrappedNameTitle}${table ? `<div style="height:6px;line-height:6px;font-size:0;">&nbsp;</div>${table}` : ''}`;
  }

  const blocks: Record<string, () => string | undefined> = {
    name: () => nameBlock(input, 'font-size:16px;font-weight:600;color:#000;'),
    title: () => titleBlock(input, 'font-size:13px;color:#666;margin-top:2px;'),
    companyName: () => companyBlock(input, 'font-size:13px;color:#444;margin-top:2px;'),
  };
  let html = buildOrderedFieldHtml(order.filter((f) => !contactFields.has(f)), blocks);
  const table = standardContactTableRows(input, contactOrder);
  if (table) {
    html += `<div style="height:10px;"></div>${table}`;
  }
  return html;
}

export function buildCreatorContactTableHtmlOrdered(input: OrderedContactBuildInput): string {
  const rules = getLayoutReorderRules('creator');
  const order = resolveFieldOrder(rules, input.contactDisplayOrder);
  const accent = escapeHtml(input.creatorAccentColor || '#5865f2');
  const rows: string[] = [];
  const phone = input.officePhone || input.mobilePhone;
  const phoneHref = input.officePhone ? input.officePhoneTelHref : input.mobilePhoneTelHref;

  for (const field of order) {
    if (field === 'officePhone' && phone) {
      rows.push(`<tr><td style="padding-bottom:4px;padding-right:10px;font-family:'Courier New',Courier,monospace;color:#80848e;">tel:</td><td style="padding-bottom:4px;"><span data-sig-field="officePhone"><a href="${escapeHtml(phoneHref)}" style="color:#dbdee1;text-decoration:none;">${escapeHtml(phone)}</a></span></td></tr>`);
    } else if (field === 'mobilePhone' && input.mobilePhone && !input.officePhone) {
      rows.push(`<tr><td style="padding-bottom:4px;padding-right:10px;font-family:'Courier New',Courier,monospace;color:#80848e;">tel:</td><td style="padding-bottom:4px;"><span data-sig-field="mobilePhone"><a href="${escapeHtml(input.mobilePhoneTelHref)}" style="color:#dbdee1;text-decoration:none;">${escapeHtml(input.mobilePhone)}</a></span></td></tr>`);
    } else if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      rows.push(`<tr><td style="padding-bottom:4px;padding-right:10px;font-family:'Courier New',Courier,monospace;color:#80848e;">eml:</td><td style="padding-bottom:4px;"><span data-sig-field="email"><a href="mailto:${escapeHtml(input.email)}" style="color:#dbdee1;text-decoration:none;">${escapeHtml(input.email)}</a></span></td></tr>`);
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      rows.push(`<tr><td style="padding-bottom:4px;padding-right:10px;font-family:'Courier New',Courier,monospace;color:#80848e;">web:</td><td style="padding-bottom:4px;"><span data-sig-field="website"><a href="${escapeHtml(input.website)}" style="color:${accent};text-decoration:none;">${escapeHtml(input.websiteDisplay)}</a></span></td></tr>`);
    }
  }
  return rows.join('');
}

export function buildExecutiveContactLineHtmlOrdered(input: OrderedContactBuildInput): string {
  const rules = getLayoutReorderRules('executive_minimalist');
  const order = resolveFieldOrder(rules, input.contactDisplayOrder);
  const parts: string[] = [];
  const phone = input.officePhone || input.mobilePhone;
  const phoneHref = input.officePhone ? input.officePhoneTelHref : input.mobilePhoneTelHref;

  for (const field of order) {
    if ((field === 'officePhone' || field === 'mobilePhone') && phone) {
      if (parts.some((p) => p.includes('data-sig-field="officePhone"') || p.includes('data-sig-field="mobilePhone"'))) continue;
      const fid = input.officePhone ? 'officePhone' : 'mobilePhone';
      parts.push(`<span data-sig-field="${fid}"><a href="${escapeHtml(phoneHref)}" style="color:#444444;text-decoration:none;">${escapeHtml(phone.replace(/-/g, '.'))}</a></span>`);
    } else if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      parts.push(`<span data-sig-field="email"><a href="mailto:${escapeHtml(input.email)}" style="color:#444444;text-decoration:none;">${escapeHtml(input.email)}</a></span>`);
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      parts.push(`<span data-sig-field="website"><a href="${escapeHtml(input.website)}" style="color:${escapeHtml(input.primaryColor)};text-decoration:none;font-weight:bold;">${escapeHtml(input.websiteDisplay)}</a></span>`);
    }
  }
  return parts.join(' &nbsp;&bull;&nbsp; ');
}

export function buildPortfolioContactPillsHtmlOrdered(input: OrderedContactBuildInput): string {
  const rules = getLayoutReorderRules('portfolio');
  const order = resolveFieldOrder(rules, input.contactDisplayOrder);
  const accent = escapeHtml(input.portfolioAccentColor || input.primaryColor);
  const panel = escapeHtml(input.portfolioPanelColor || '#1a2e2b');
  const border = escapeHtml(input.portfolioBorderColor || '#2d4a46');
  const cardText = escapeHtml(input.portfolioCardTextColor || '#F4F7F6');
  const phone = input.officePhone || input.mobilePhone;
  const phoneHref = input.officePhone ? input.officePhoneTelHref : input.mobilePhoneTelHref;
  const formatPhone = input.formatPortfolioPhoneDisplay ?? ((p: string) => p);
  const rows: string[] = [];

  for (const field of order) {
    if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      rows.push(`<tr><td style="padding-bottom:10px;"><span data-sig-field="email"><a href="mailto:${escapeHtml(input.email)}" style="display:block;background-color:${panel};color:#FFFFFF;text-decoration:none;padding:11px 16px;border-radius:30px;font-size:13px;font-weight:500;border:1px solid ${border};text-align:center;letter-spacing:0.2px;">&#9993; Email Me</a></span></td></tr>`);
    } else if ((field === 'officePhone' || field === 'mobilePhone') && phone && phoneHref) {
      if (rows.some((r) => r.includes('data-sig-field="officePhone"') || r.includes('data-sig-field="mobilePhone"'))) continue;
      const fid = input.officePhone ? 'officePhone' : 'mobilePhone';
      const label = escapeHtml(formatPhone(phone));
      rows.push(`<tr><td style="padding-bottom:10px;"><span data-sig-field="${fid}"><a href="${escapeHtml(phoneHref)}" style="display:block;background-color:${panel};color:#FFFFFF;text-decoration:none;padding:11px 16px;border-radius:30px;font-size:13px;font-weight:500;border:1px solid ${border};text-align:center;letter-spacing:0.2px;">&#128222; ${label}</a></span></td></tr>`);
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      const visitLabel = escapeHtml(`Visit ${input.websiteDisplay}`);
      rows.push(`<tr><td style="padding-bottom:20px;"><span data-sig-field="website"><a href="${escapeHtml(input.website)}" style="display:block;background-color:${accent};color:${cardText};text-decoration:none;padding:12px 16px;border-radius:30px;font-size:13px;font-weight:700;text-align:center;letter-spacing:0.3px;">&#127760; ${visitLabel}</a></span></td></tr>`);
    }
  }
  if (rows.length > 0 && !order.includes('website')) {
    rows[rows.length - 1] = rows[rows.length - 1]!.replace('padding-bottom:10px', 'padding-bottom:20px');
  }
  return rows.join('');
}

export function buildEcardContactTableHtmlOrdered(input: OrderedContactBuildInput): string {
  const rules = getLayoutReorderRules('ecard');
  const order = resolveFieldOrder(rules, input.contactDisplayOrder);
  const accent = escapeHtml(input.primaryColor);
  const phone = input.officePhone || input.mobilePhone;
  const phoneHref = input.officePhone ? input.officePhoneTelHref : input.mobilePhoneTelHref;
  const formatPhone = input.formatPortfolioPhoneDisplay ?? ((p: string) => p);
  const rows: string[] = [];

  for (const field of order) {
    if ((field === 'officePhone' || field === 'mobilePhone') && phone && phoneHref) {
      if (rows.some((r) => r.includes('data-sig-field="officePhone"') || r.includes('data-sig-field="mobilePhone"'))) continue;
      const fid = input.officePhone ? 'officePhone' : 'mobilePhone';
      const label = escapeHtml(formatPhone(phone));
      rows.push(`<tr><td style="padding-bottom:6px;font-weight:bold;color:#111827;width:24px;">P:</td><td style="padding-bottom:6px;"><span data-sig-field="${fid}"><a href="${escapeHtml(phoneHref)}" style="color:#4B5563;text-decoration:none;">${label}</a></span></td></tr>`);
    } else if (field === 'email' && input.email && !input.pHidden.includes('email')) {
      rows.push(`<tr><td style="padding-bottom:6px;font-weight:bold;color:#111827;">E:</td><td style="padding-bottom:6px;"><span data-sig-field="email"><a href="mailto:${escapeHtml(input.email)}" style="color:#4B5563;text-decoration:none;">${escapeHtml(input.email)}</a></span></td></tr>`);
    } else if (field === 'website' && input.website && !input.bHidden.includes('website')) {
      rows.push(`<tr><td style="padding-bottom:14px;font-weight:bold;color:#111827;">W:&nbsp;</td><td style="padding-bottom:14px;"><span data-sig-field="website"><a href="${escapeHtml(input.website)}" style="color:${accent};text-decoration:none;font-weight:600;">${escapeHtml(input.websiteDisplay)}</a></span></td></tr>`);
    }
  }
  return rows.join('');
}

export function buildOrderedNameTitleHtml(
  input: OrderedContactBuildInput,
  nameStyle: string,
  titleStyle: string,
): string {
  const rules = getLayoutReorderRules(input.layout);
  const order = resolveFieldOrder(rules, input.contactDisplayOrder).filter((f) => f === 'name' || f === 'title');
  return buildOrderedFieldHtml(order, {
    name: () => nameBlock(input, nameStyle),
    title: () => titleBlock(input, titleStyle),
  });
}
