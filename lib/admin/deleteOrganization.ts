import '@/lib/billing-engine';
import mongoose from 'mongoose';
import { isValidObjectIdString, listUsersInOrganization } from '@/lib/admin/data';
import { purgeOrganizationUserAuth } from '@/lib/admin/purgeOrganizationUserAuth';
import { connectMongoose } from '@/lib/mongoose';
import { getStripe } from '@/lib/stripe/client';
import { stripeBillingEnabled } from 'billing-engine';
import { EmployeeModel } from '@/models/Employee';
import { FeedbackSubmissionModel } from '@/models/FeedbackSubmission';
import { OrganizationModel, type OrganizationDoc } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { OrganizationUserInviteModel } from '@/models/OrganizationUserInvite';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import { SignatureOpenEventModel } from '@/models/SignatureOpenEvent';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';

export class DeleteOrganizationError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'DeleteOrganizationError';
  }
}

async function cancelStripeSubscriptionBestEffort(stripeSubscriptionId: string): Promise<void> {
  const subId = stripeSubscriptionId.trim();
  if (!subId || !stripeBillingEnabled()) return;

  try {
    const stripe = getStripe();
    await stripe.subscriptions.cancel(subId);
  } catch (err) {
    console.error('[admin] cancel Stripe subscription during org delete', subId, err);
  }
}

export async function deleteOrganization(organizationId: string): Promise<void> {
  if (!isValidObjectIdString(organizationId)) {
    throw new DeleteOrganizationError('Invalid organization id', 400);
  }

  await connectMongoose();
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const org = await OrganizationModel.findById(orgId).lean<OrganizationDoc>();
  if (!org) {
    throw new DeleteOrganizationError('Organization not found', 404);
  }

  const users = await listUsersInOrganization(organizationId);
  if (users.some((u) => u.platformAdmin)) {
    throw new DeleteOrganizationError(
      'Cannot delete an organization that includes a platform admin user. Remove or reassign them first.',
      409
    );
  }

  const stripeSubId = String(org.stripeSubscriptionId ?? '').trim();
  if (stripeSubId) {
    await cancelStripeSubscriptionBestEffort(stripeSubId);
  }

  for (const user of users) {
    await purgeOrganizationUserAuth(user.id);
  }

  await EmployeeModel.deleteMany({ organizationId: orgId });
  await SignatureTemplateModel.deleteMany({ organizationId: orgId });
  await OrganizationSubscriptionModel.deleteMany({ organizationId: orgId });
  await OrganizationUserInviteModel.deleteMany({ organizationId: orgId });
  await SignatureClickEventModel.deleteMany({ organizationId: orgId });
  await SignatureOpenEventModel.deleteMany({ organizationId: orgId });
  await FeedbackSubmissionModel.deleteMany({ organizationId: organizationId });

  await OrganizationModel.findByIdAndDelete(orgId);
}
