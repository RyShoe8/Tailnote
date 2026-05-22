import type { Types } from 'mongoose';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';

/** Idempotent: normalize legacy display names for the Stacked preset. */
export async function renameModernTemplatesToStacked(organizationId: Types.ObjectId | string) {
  await SignatureTemplateModel.updateMany(
    {
      organizationId,
      presetId: 'stacked',
      name: { $in: ['Modern', 'modern'] },
    },
    { $set: { name: 'Stacked' } }
  );
}
