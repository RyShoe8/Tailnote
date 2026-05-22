import mongoose, { type Types } from 'mongoose';
import type { ContentBlockData } from 'emailsignature-engine';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { getOrgOwnerUser } from '@/lib/org/getOrgOwnerUser';

/** Copy owner promo blocks onto all non-owner employee rows when employees cannot edit blocks. */
export async function syncPromoBlocksToLockedMembers(
  organizationId: Types.ObjectId | string,
  contentBlocks: ContentBlockData[]
): Promise<void> {
  await connectMongoose();
  const owner = await getOrgOwnerUser(organizationId);
  if (!owner) return;

  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  const blocks = contentBlocks.slice(0, 2);

  await EmployeeModel.updateMany(
    { organizationId: orgId, userId: { $ne: owner.id } },
    { $set: { contentBlocks: blocks, promoBlocksCustomized: false } }
  );
}
