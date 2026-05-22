import type { OrganizationDoc } from '@/models/Organization';

export type OrgPermissionFlags = {
  employeesCanEditBrand: boolean;
  employeesCanEditPromoBlocks: boolean;
};

export function orgPermissionFlags(
  org: Pick<OrganizationDoc, 'employeesCanEditBrand' | 'employeesCanEditPromoBlocks'> | Record<string, unknown>
): OrgPermissionFlags {
  const o = org as { employeesCanEditBrand?: boolean; employeesCanEditPromoBlocks?: boolean };
  return {
    employeesCanEditBrand: o.employeesCanEditBrand === true,
    employeesCanEditPromoBlocks: o.employeesCanEditPromoBlocks === true,
  };
}

export function isOrgAdminRole(role: string | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function memberCanEditOrgBrand(role: string | undefined, flags: OrgPermissionFlags): boolean {
  if (isOrgAdminRole(role)) return true;
  return role === 'member' && flags.employeesCanEditBrand;
}

export function memberCanEditPromoBlocks(role: string | undefined, flags: OrgPermissionFlags): boolean {
  if (isOrgAdminRole(role)) return true;
  return role === 'member' && flags.employeesCanEditPromoBlocks;
}
