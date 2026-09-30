import type Stripe from 'stripe';
import { brevoFetch } from '@/lib/email/brevo';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';

function abandonedCheckoutListId(): number | null {
  const raw = process.env.BREVO_ABANDONED_CHECKOUT_LIST_ID?.trim();
  if (!raw) return null;
  const id = Number(raw.replace(/^#/, ''));
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('BREVO_ABANDONED_CHECKOUT_LIST_ID must be a positive integer');
  }
  return id;
}

function checkoutEmail(session: Stripe.Checkout.Session): string {
  return (session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
}

export async function addAbandonedCheckoutToBrevo(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== 'unpaid' || session.status !== 'expired') return;
  const listId = abandonedCheckoutListId();
  if (!listId) return;
  const email = checkoutEmail(session);
  if (!email) return;

  await connectMongoose();
  const user = await getMongoDb().collection('user').findOne<{ organizationId?: string }>({ email });
  if (user?.organizationId) {
    const org = await OrganizationModel.findById(user.organizationId)
      .select('subscriptionStatus')
      .lean<{ subscriptionStatus?: string }>();
    if (org?.subscriptionStatus === 'active' || org?.subscriptionStatus === 'trialing') return;
  }

  const result = await brevoFetch('/contacts', {
    method: 'POST',
    json: { email, listIds: [listId], updateEnabled: true },
  });
  if (!result.ok) throw new Error(`Brevo abandoned checkout sync failed: ${result.error}`);
}

export async function removeCompletedCheckoutFromBrevo(session: Stripe.Checkout.Session): Promise<void> {
  const listId = abandonedCheckoutListId();
  if (!listId) return;
  const email = checkoutEmail(session);
  if (!email) return;

  const result = await brevoFetch(`/contacts/lists/${listId}/contacts/remove`, {
    method: 'POST',
    json: { emails: [email] },
  });
  if (!result.ok) throw new Error(`Brevo abandoned checkout removal failed: ${result.error}`);
}
