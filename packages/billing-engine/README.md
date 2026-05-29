# billing-engine

Portable Stripe + Mongoose subscription management for Next.js apps.

## Setup

1. Add workspace dependency: `"billing-engine": "workspace:*"`
2. Initialize once at app startup (see `lib/billing-engine.ts` in Tailnote):

```ts
import { createBillingEngine } from 'billing-engine';

export const billing = createBillingEngine({
  connect: () => connectMongoose(),
  organization: { model: OrganizationModel },
  seats: { getSeatCount, beforeCountSeats },
  auth: { getSession, requirePlatformAdmin },
  billing: { getAppBaseUrl, notify, getOwnerEmailForOrganization },
});
```

3. Wire API routes as thin delegates:

```ts
import { billing } from '@/lib/billing-engine';
export const POST = billing.handlers.stripeWebhook;
export const dynamic = 'force-dynamic';
```

## Organization schema

Host `Organization` documents should include:

- `plan`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`

Canonical subscription data lives in `OrganizationSubscription` (package model), including optional `trialEndsAt`.

## Plan trials

Set `trialDays` (0–730) on `SubscriptionPlan` in admin. On **first** Stripe subscription checkout only:

- Checkout passes `subscription_data.trial_period_days` to Stripe
- Webhooks set org `subscriptionStatus` to `trialing` and persist `trialEndsAt`
- `trialing` counts as paid access via `isOrganizationPaid()`
- After trial, Stripe charges the card; failed payment sets `past_due` and locks dashboard access

Re-subscribe after cancel does not receive another trial. Lifetime plans ignore `trialDays`.

Trial length is configured on the plan document, not synced to Stripe Price objects (edit trial days without re-syncing prices).

## Environment variables

- `STRIPE_SECRET_KEY` — required for live billing (omit for dev “all paid” bypass)
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID` — legacy slug checkout fallback

## Exports

- `billing-engine` — core lib, models, `createBillingEngine`
- `billing-engine/next/handlers` — Next.js route handlers
- `billing-engine/next/components` — Admin plan UI, pricing cards
- `billing-engine/models` — Mongoose models
