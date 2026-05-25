import { createBillingEngine } from 'billing-engine';
import type { BillingNotificationInput } from 'billing-engine';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { getServerSession } from '@/lib/auth/session';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { isValidObjectIdString } from '@/lib/admin/data';
import { getAppBaseUrl } from '@/lib/email/appUrl';
import { sendEmail } from '@/lib/email/mail';
import { buildSubscriptionPaymentFailedEmail } from '@/lib/email/templates/subscriptionPaymentFailedEmail';
import { buildSubscriptionCanceledEmail } from '@/lib/email/templates/subscriptionCanceledEmail';
import { ensureOwnerEmployeeForOrganization } from '@/lib/employees/ensureOwnerEmployee';
import { CORE_PRODUCT_FEATURE_BULLETS } from '@/lib/marketing/productFeatures';

export const billing = createBillingEngine({
  connect: async () => {
    await connectMongoose();
  },
  organization: {
    model: OrganizationModel,
  },
  seats: {
    async beforeCountSeats(organizationId) {
      await connectMongoose();
      await ensureOwnerEmployeeForOrganization(organizationId);
    },
    async getSeatCount(organizationId) {
      await connectMongoose();
      const orgObjId = organizationId;
      return EmployeeModel.countDocuments({ organizationId: orgObjId });
    },
  },
  auth: {
    getSession: getServerSession,
    requirePlatformAdmin: requirePlatformAdminApi,
  },
  billing: {
    getAppBaseUrl,
    planFeatureBullets: CORE_PRODUCT_FEATURE_BULLETS,
    async getOwnerEmailForOrganization(organizationId) {
      await connectMongoose();
      const owner = await getMongoDb().collection('user').findOne<{ email?: string }>({
        organizationId,
        role: 'owner',
      });
      return owner?.email?.trim() || null;
    },
    async notify(input: BillingNotificationInput) {
      const content =
        input.type === 'payment_failed'
          ? buildSubscriptionPaymentFailedEmail({
              orgName: input.orgName,
              billingUrl: input.billingUrl,
            })
          : buildSubscriptionCanceledEmail({
              orgName: input.orgName,
              billingUrl: input.billingUrl,
            });

      const result = await sendEmail({
        to: input.ownerEmail,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });

      if (!result.ok) {
        console.error(
          '[billing notify] send failed',
          input.type,
          input.organizationId,
          result.error
        );
      }
    },
  },
  isValidObjectId: isValidObjectIdString,
});
