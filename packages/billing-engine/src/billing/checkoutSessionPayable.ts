import type Stripe from 'stripe';

/** Whether checkout.session.completed should activate org access (paid or trialing subscription). */
export function isCheckoutSessionPayable(session: Pick<Stripe.Checkout.Session, 'mode' | 'payment_status'>): boolean {
  if (session.payment_status === 'paid') return true;
  return session.mode === 'subscription' && session.payment_status === 'no_payment_required';
}
