import type { ContentBlockData } from 'emailsignature-engine';
import type { OrganizationDoc } from '@/models/Organization';
import type { EmployeeDoc } from '@/models/Employee';
import { employeeContentBlocks } from '@/lib/renderEmployeeSignature';
import { orgPermissionFlags } from '@/lib/org/permissions';
import { getOrgOwnerPromoBlocks } from '@/lib/org/getOrgOwnerPromoBlocks';

/**
 * Resolve which promotional blocks apply when rendering or loading the signature workspace.
 */
export async function resolveEmployeeContentBlocks(
  org: Pick<OrganizationDoc, '_id' | 'employeesCanEditPromoBlocks'>,
  employee: Pick<EmployeeDoc, 'contentBlocks' | 'promoBlocksCustomized'> | Record<string, unknown>
): Promise<ContentBlockData[]> {
  const flags = orgPermissionFlags(org);
  const ownerBlocks = await getOrgOwnerPromoBlocks(org._id);

  if (!flags.employeesCanEditPromoBlocks) {
    return ownerBlocks;
  }

  const emp = employee as EmployeeDoc;
  const customized = emp.promoBlocksCustomized === true;
  if (customized) {
    return employeeContentBlocks(emp);
  }

  const own = employeeContentBlocks(emp);
  return own.length > 0 ? own : ownerBlocks;
}
