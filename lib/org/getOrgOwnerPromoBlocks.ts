import mongoose from 'mongoose';
import type { ContentBlockData } from 'emailsignature-engine';
import { connectMongoose } from '@/lib/mongoose';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { EmployeeModel } from '@/models/Employee';
import { employeeContentBlocks } from '@/lib/renderEmployeeSignature';
import { getOrgOwnerUser } from '@/lib/org/getOrgOwnerUser';

function blocksFromUnknown(raw: unknown): ContentBlockData[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b): b is ContentBlockData => typeof b === 'object' && b !== null && 'type' in b)
    .slice(0, 2);
}

/** Canonical promotional blocks configured by the org owner. */
export async function getOrgOwnerPromoBlocks(
  organizationId: mongoose.Types.ObjectId | string
): Promise<ContentBlockData[]> {
  await connectMongoose();
  const owner = await getOrgOwnerUser(organizationId);
  if (!owner) return [];

  const profile = await UserSignatureProfileModel.findOne({ userId: owner.id })
    .select('contentBlocks')
    .lean();
  const fromProfile = blocksFromUnknown((profile as { contentBlocks?: unknown } | null)?.contentBlocks);
  if (fromProfile.length > 0) return fromProfile;

  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  const ownerEmp = await EmployeeModel.findOne({
    organizationId: orgId,
    userId: owner.id,
  })
    .select('contentBlocks')
    .lean();
  if (!ownerEmp) return [];
  return employeeContentBlocks(ownerEmp as never);
}
