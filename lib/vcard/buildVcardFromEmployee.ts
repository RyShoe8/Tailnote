import type { EmployeeDoc } from '@/models/Employee';
import type { OrganizationDoc } from '@/models/Organization';
import { buildVcard, vcardFilename, type VcardContact } from '@/lib/vcard/buildVcard';

function normalizeWebsiteUrl(website: string): string {
  const w = website.trim();
  if (!w) return '';
  if (/^https?:\/\//i.test(w)) return w;
  return `https://${w}`;
}

export function employeeAndOrgToVcardContact(
  emp: EmployeeDoc,
  org: OrganizationDoc
): VcardContact {
  const phones: string[] = [];
  const phone = (emp.phone as string | undefined)?.trim();
  if (phone) phones.push(phone);

  const orgWebsite = (org.website as string | undefined)?.trim() ?? '';
  const empWebsite = (emp.website as string | undefined)?.trim() ?? '';
  const website = normalizeWebsiteUrl(empWebsite || orgWebsite);

  const companyName =
    (org.companyName as string | undefined)?.trim() ||
    (org.name as string | undefined)?.trim() ||
    '';

  const street = (org.address as string | undefined)?.trim() ?? '';
  const city = (org.city as string | undefined)?.trim() ?? '';
  const region = (org.state as string | undefined)?.trim() ?? '';
  const postal = (org.zip as string | undefined)?.trim() ?? '';

  const logoUrl = (org.logoUrl as string | undefined)?.trim() ?? '';

  return {
    firstName: emp.firstName,
    lastName: emp.lastName ?? '',
    title: (emp.title as string | undefined)?.trim() || undefined,
    email: emp.email,
    phones: phones.length > 0 ? phones : undefined,
    companyName: companyName || undefined,
    website: website || undefined,
    street: street || undefined,
    city: city || undefined,
    region: region || undefined,
    postalCode: postal || undefined,
    photoUrl: logoUrl.startsWith('https://') ? logoUrl : undefined,
  };
}

export function buildVcardFromEmployee(emp: EmployeeDoc, org: OrganizationDoc): string {
  return buildVcard(employeeAndOrgToVcardContact(emp, org));
}

export function vcardFilenameForEmployee(emp: EmployeeDoc): string {
  return vcardFilename(emp.firstName, emp.lastName ?? '');
}
