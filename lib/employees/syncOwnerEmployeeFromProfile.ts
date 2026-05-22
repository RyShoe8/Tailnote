import mongoose, { type Types } from 'mongoose';
import { EmployeeModel } from '@/models/Employee';
import { ensureOwnerEmployee, type OwnerUserRef } from '@/lib/employees/ensureOwnerEmployee';
import type { ContentBlockData } from 'emailsignature-engine';

export type OwnerProfileSyncInput = {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
  contentBlocks?: ContentBlockData[];
  templateId?: string;
};

/** Sync dashboard signature profile fields (and template) onto the org owner's Employee row. */
export async function syncOwnerEmployeeFromProfile(
  organizationId: Types.ObjectId | string,
  owner: OwnerUserRef,
  profile: OwnerProfileSyncInput
): Promise<void> {
  await ensureOwnerEmployee(organizationId, owner);

  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  const phone =
    profile.officePhone?.trim() || profile.mobilePhone?.trim() || '';

  const $set: Record<string, unknown> = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    title: profile.title,
    email: profile.email.trim().toLowerCase(),
    phone,
    userId: owner.id,
  };

  if (profile.contentBlocks !== undefined) {
    $set.contentBlocks = profile.contentBlocks;
  }

  if (profile.templateId) {
    $set.templateId = new mongoose.Types.ObjectId(profile.templateId);
  }

  await EmployeeModel.updateOne(
    { organizationId: orgId, userId: owner.id },
    { $set }
  );
}
