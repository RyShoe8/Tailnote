import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { BillingNotificationModel } from '@/models/BillingNotification';
import { sendEmail } from '@/lib/email/mail';
import { getAppBaseUrl } from '@/lib/email/appUrl';
import { buildSubscriptionPaymentFailedEmail } from '@/lib/email/templates/subscriptionPaymentFailedEmail';
import { buildSubscriptionCanceledEmail } from '@/lib/email/templates/subscriptionCanceledEmail';

export type BillingNotificationType = 'payment_failed' | 'subscription_canceled';

async function resolveOwnerEmail(organizationId: mongoose.Types.ObjectId): Promise<string | null> {
  const owner = await getMongoDb().collection('user').findOne<{ email?: string }>({
    organizationId: organizationId.toString(),
    role: 'owner',
  });
  const email = owner?.email?.trim();
  return email || null;
}

async function recordNotificationIfNew(
  stripeEventId: string,
  organizationId: mongoose.Types.ObjectId,
  type: BillingNotificationType
): Promise<boolean> {
  try {
    await BillingNotificationModel.create({ stripeEventId, organizationId, type });
    return true;
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: number }).code === 11000) {
      return false;
    }
    throw e;
  }
}

export async function notifyOrganizationBilling(
  organizationId: string | mongoose.Types.ObjectId,
  type: BillingNotificationType,
  stripeEventId: string
): Promise<void> {
  await connectMongoose();
  const orgObjId =
    typeof organizationId === 'string' ? new mongoose.Types.ObjectId(organizationId) : organizationId;

  const shouldSend = await recordNotificationIfNew(stripeEventId, orgObjId, type);
  if (!shouldSend) return;

  const org = await OrganizationModel.findById(orgObjId).select('name companyName').lean<{
    name?: string;
    companyName?: string;
  }>();
  if (!org) return;

  const ownerEmail = await resolveOwnerEmail(orgObjId);
  if (!ownerEmail) {
    console.warn('[billing notify] No owner email for org', orgObjId.toString());
    return;
  }

  const orgName = (org.companyName || org.name || 'your organization').trim();
  const billingUrl = `${getAppBaseUrl()}/dashboard/billing`;

  const content =
    type === 'payment_failed'
      ? buildSubscriptionPaymentFailedEmail({ orgName, billingUrl })
      : buildSubscriptionCanceledEmail({ orgName, billingUrl });

  const result = await sendEmail({
    to: ownerEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (!result.ok) {
    console.error('[billing notify] send failed', type, orgObjId.toString(), result.error);
  }
}
