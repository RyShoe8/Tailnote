export type VcardContact = {
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phones?: string[];
  companyName?: string;
  website?: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  photoUrl?: string;
};

/** Escape special characters per vCard 3.0 (RFC 6350). */
export function escapeVcardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, max));
  rest = rest.slice(max);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, max - 1)}`);
    rest = rest.slice(max - 1);
  }
  return parts.join('\r\n');
}

function property(name: string, value: string): string {
  if (!value.trim()) return '';
  return foldLine(`${name}:${escapeVcardValue(value.trim())}`);
}

/** Build vCard 3.0 text with CRLF line endings. */
export function buildVcard(contact: VcardContact): string {
  const first = contact.firstName.trim();
  const last = contact.lastName.trim();
  const fullName = [first, last].filter(Boolean).join(' ') || first || last || 'Contact';

  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const fn = property('FN', fullName);
  if (fn) lines.push(fn);

  const n = property('N', `${last};${first};;;`);
  if (n) lines.push(n);

  if (contact.title) {
    const t = property('TITLE', contact.title);
    if (t) lines.push(t);
  }

  if (contact.companyName) {
    const org = property('ORG', contact.companyName);
    if (org) lines.push(org);
  }

  if (contact.email) {
    const e = property('EMAIL;TYPE=INTERNET', contact.email);
    if (e) lines.push(e);
  }

  for (const phone of contact.phones ?? []) {
    const p = phone.trim();
    if (!p) continue;
    const tel = property('TEL;TYPE=CELL', p);
    if (tel) lines.push(tel);
  }

  if (contact.website) {
    const url = property('URL', contact.website);
    if (url) lines.push(url);
  }

  const street = contact.street?.trim() ?? '';
  const city = contact.city?.trim() ?? '';
  const region = contact.region?.trim() ?? '';
  const postal = contact.postalCode?.trim() ?? '';
  const country = contact.country?.trim() ?? '';
  if (street || city || region || postal || country) {
    const adr = property('ADR;TYPE=WORK', `;;${street};${city};${region};${postal};${country}`);
    if (adr) lines.push(adr);
  }

  const photo = contact.photoUrl?.trim() ?? '';
  if (photo.startsWith('https://')) {
    lines.push(foldLine(`PHOTO;VALUE=URI:${escapeVcardValue(photo)}`));
  }

  lines.push('END:VCARD');
  return `${lines.join('\r\n')}\r\n`;
}

/** Safe attachment filename, e.g. Morgan-Alex.vcf */
export function vcardFilename(firstName: string, lastName: string): string {
  const raw = [lastName.trim(), firstName.trim()].filter(Boolean).join('-') || 'contact';
  const safe = raw.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${safe || 'contact'}.vcf`;
}
