import mongoose from 'mongoose';
import { isValidObjectIdString } from '@/lib/admin/data';
import { assignOrganizationPlan } from '@/lib/admin/assignOrganizationPlan';
import {
  legacyOrganizationSlugIndexMessage,
  mapLegacyOrganizationSlugIndexError,
} from '@/lib/admin/mongoErrors';
import { connectMongoose } from '@/lib/mongoose';
import { seedDefaultTemplates } from '@/lib/seedOrgTemplates';
import { OrganizationModel } from '@/models/Organization';
import type { OrganizationDoc } from '@/models/Organization';

export type ProvisionOrganizationInput = {
  name: string;
  subscriptionPlanId?: string | null;
  subscriptionStatus?: 'none' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
};

export class ProvisionOrganizationError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'ProvisionOrganizationError';
  }
}

export async function provisionOrganization(
  input: ProvisionOrganizationInput
): Promise<{ organizationId: string; organization: OrganizationDoc }> {
  await connectMongoose();

  const hasPlan = Boolean(input.subscriptionPlanId?.trim());
  const subscriptionStatus =
    input.subscriptionStatus ?? (hasPlan ? 'active' : 'none');

  let org;
  try {
    org = await OrganizationModel.create({
      name: input.name.trim(),
      companyName: input.name.trim(),
      subscriptionStatus,
      plan: hasPlan ? undefined : 'none',
    });
  } catch (err) {
    const legacySlug = mapLegacyOrganizationSlugIndexError(err);
    if (legacySlug) {
      throw new ProvisionOrganizationError(legacyOrganizationSlugIndexMessage(), 503);
    }
    throw err;
  }

  try {
    await seedDefaultTemplates(org._id);

    if (hasPlan) {
      const planId = input.subscriptionPlanId!.trim();
      if (!isValidObjectIdString(planId)) {
        throw new ProvisionOrganizationError('Invalid subscriptionPlanId', 400);
      }
      await assignOrganizationPlan(
        org._id,
        new mongoose.Types.ObjectId(planId),
        subscriptionStatus
      );
    }

    const refreshed = await OrganizationModel.findById(org._id).lean<OrganizationDoc>();
    if (!refreshed) {
      throw new ProvisionOrganizationError('Organization not found after create', 500);
    }

    return {
      organizationId: String(org._id),
      organization: refreshed,
    };
  } catch (err) {
    await OrganizationModel.findByIdAndDelete(org._id);
    if (err instanceof ProvisionOrganizationError) throw err;
    const legacySlug = mapLegacyOrganizationSlugIndexError(err);
    if (legacySlug) {
      throw new ProvisionOrganizationError(legacyOrganizationSlugIndexMessage(), 503);
    }
    const message = err instanceof Error ? err.message : 'Could not provision organization';
    throw new ProvisionOrganizationError(message, 400);
  }
}
