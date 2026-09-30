import mongoose from 'mongoose';
import type Stripe from 'stripe';
import { getMongoDb } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { PendingOrganizationCheckoutModel } from '@/models/PendingOrganizationCheckout';
import { ensureOrgPresetTemplates } from '@/lib/seedOrgTemplates';
import { ensureOwnerEmployee } from '@/lib/employees/ensureOwnerEmployee';
import { getStripe } from 'billing-engine';

/** Called only by the signature-verified, payable Checkout webhook. */
export async function completePendingOrganizationCheckout(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  const pendingId = session.metadata?.pendingOrganizationCheckoutId;
  if (!pendingId || !mongoose.isValidObjectId(pendingId)) return null;
  const pending = await PendingOrganizationCheckoutModel.findById(pendingId);
  if (!pending || pending.checkoutSessionId !== session.id) return null;
  if (String(pending.subscriptionPlanId) !== session.metadata?.subscriptionPlanId) return null;

  // A deterministic id makes a Stripe retry resume the same organization.
  const orgId = pending._id as mongoose.Types.ObjectId;
  const users = getMongoDb().collection('user');
  const owner = await users.findOne<{ organizationId?: string; email?: string }>({ id: pending.userId });
  if (!owner || (owner.organizationId && owner.organizationId !== String(orgId))) {
    throw new Error('Checkout owner is missing or belongs to another organization');
  }

  await OrganizationModel.updateOne(
    { _id: orgId },
    { $setOnInsert: {
      _id: orgId,
      name: pending.organizationName,
      companyName: pending.organizationName,
      plan: 'none',
      subscriptionStatus: 'incomplete',
    } },
    { upsert: true }
  );
  await ensureOrgPresetTemplates(orgId);
  const linked = await users.updateOne(
    { id: pending.userId, $or: [{ organizationId: { $exists: false } }, { organizationId: null }, { organizationId: String(orgId) }] },
    { $set: { organizationId: String(orgId), role: 'owner' } }
  );
  if (linked.matchedCount !== 1) throw new Error('Could not link checkout owner');
  if (pending.userEmail) {
    await ensureOwnerEmployee(orgId, {
      id: pending.userId,
      email: pending.userEmail,
      name: pending.userName,
    });
  }
  if (session.subscription) {
    await getStripe().subscriptions.update(String(session.subscription), {
      metadata: { organizationId: String(orgId), subscriptionPlanId: String(pending.subscriptionPlanId) },
    });
  }
  return String(orgId);
}
