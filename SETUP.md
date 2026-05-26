# Tailnote — Vercel deployment

This Next.js app is built and run on **Vercel**. Connect your **Git** repository to a **Vercel Project**, then **push** to deploy **Production** or **Preview** deployments.

Configure secrets in the **Vercel Dashboard** — you do not need a local `.env.local` for normal work.

## Prerequisites

- A **Vercel** account and a **Project** linked to this repo (**Vercel Dashboard** → **Add New…** → **Project** → import the Git repository).
- **MongoDB Atlas** (or another MongoDB provider) — store the connection string in **Vercel** **Environment Variables**.
- **Stripe** — API keys and a webhook endpoint aimed at your **Vercel** deployment URL (see below).
- **Brevo** for transactional email (employee invites, password reset) and syncing new signups to your Brevo contact list.

## Environment variables (Vercel Dashboard)

**Vercel Dashboard** → your **Project** → **Settings** → **Environment Variables**.

Add each variable for **Production** (and **Preview** if you want previews fully working). Names match `.env.example`:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Mongo connection string |
| `MONGODB_DB_NAME` | Database name (default `emailsignature`) |
| `BETTER_AUTH_SECRET` | Strong random secret for Better Auth |
| `BETTER_AUTH_URL` | **Public origin** of this deployment (your **Vercel** URL or custom domain), e.g. `https://your-app.vercel.app` or `https://your-domain.com` |
| `NEXT_PUBLIC_APP_URL` | Same value as `BETTER_AUTH_URL` (exposed to the browser for the auth client) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe (see below) |
| `STRIPE_BASIC_PRICE_ID` | Optional fallback Basic Price id during migration (prefer seeded plans + admin sync) |
| `STRIPE_PRO_PRICE_ID` | Optional fallback Pro Price id during migration |
| `BLOB_READ_WRITE_TOKEN` | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) read/write token for dashboard logo uploads (`POST /api/dashboard/organization/logo`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id for **Sign in with Google** (Better Auth) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

Better Auth sessions last **30 days** by default (refreshed daily while active). Users stay signed in until they log out or the session expires.
| `BREVO_API_KEY` | Brevo API key (SMTP transactional + contacts API) |
| `BREVO_SENDER_EMAIL` | Verified sender email in Brevo (e.g. `invites@yourdomain.com`) |
| `BREVO_SENDER_NAME` | Optional. Display name in inboxes (default `Tailnote Team`) |
| `BREVO_LIST_ID` | Optional. Brevo list id for new signups (default `3`) |

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match the URL users open in the browser (**Vercel** default domain or your **Domains** entry), or sessions and redirects will break.

### Platform admin (`/admin`)

Users with `platformAdmin: true` on their Better Auth document in the **`user`** collection (app database from `MONGODB_DB_NAME`, default `emailsignature`) can open **`/admin`**. Set that field in MongoDB for the first operator, or have an existing platform admin use **Organizations → Manage → Users** and toggle **Platform admin** for another account.

### Google reCAPTCHA v3

Protects the **contact form** and **email** signup, login, and password-reset flows (not Google OAuth sign-in).

1. In [Google reCAPTCHA admin](https://www.google.com/recaptcha/admin), create a **v3** key pair.
2. Add your production domain and `localhost` (for local testing) to allowed domains.
3. In **Vercel** → **Environment Variables**, set:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — site key (public)
   - `RECAPTCHA_SECRET_KEY` — secret key
   - Optional `RECAPTCHA_MIN_SCORE` (default `0.5`)
4. Redeploy. If both keys are unset, captcha is disabled (useful for local dev).

### Sign in with Google

1. In **Google Cloud Console**, create an OAuth **Web application** client. Add **Authorized redirect URI**:
   - `https://<your-app>/api/auth/callback/google`
2. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in **Vercel** env vars and redeploy.

### Organization logos (Blob)

In **Vercel** → **Storage** → **Blob**, create a store and copy the **Read/Write** token into `BLOB_READ_WRITE_TOKEN`. Without it, logo upload returns **503** and the UI shows an error.

After changing variables, trigger a new **deployment** (**Deployments** tab → **Redeploy** on the latest deployment, or push an empty commit).

## Custom domains

**Vercel Dashboard** → **Project** → **Settings** → **Domains** — add your domain and follow DNS instructions. Use the resulting **https** URL for `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` in **Production**.

## Stripe webhooks

In the [Stripe Dashboard](https://dashboard.stripe.com/webhooks), create an endpoint whose URL is your live app on **Vercel**:

- **URL:** `https://<your-vercel-or-custom-domain>/api/webhooks/stripe`
- **Events (minimum):** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`

Copy the endpoint **Signing secret** into `STRIPE_WEBHOOK_SECRET` in **Vercel** **Environment Variables** (**Production**), then **Redeploy**.

Enable **Customer Portal** cancellation so `customer.subscription.updated` / `customer.subscription.deleted` fire when users cancel.

### Subscription lifecycle (app behavior)

- **Paid access** requires `Organization.subscriptionStatus` of `active` or `trialing` (see `lib/billing/subscriptionAccess.ts`). `past_due`, `canceled`, and `incomplete` lock out paid features immediately.
- **Webhooks** sync Stripe → MongoDB (`Organization` + `OrganizationSubscription`). `invoice.paid` restores access; `invoice.payment_failed` sets `past_due` and emails the org owner; subscription end/cancel emails the owner (one email per Stripe event id).
- **Signature serving (Tailnote-controlled):** public preview `/p/[token]`, tracked links `/api/track/signature`, and dashboard copy/export are blocked when unpaid.
- **Limitation:** HTML already pasted into Gmail or Outlook cannot be removed remotely. Direct image URLs (e.g. Vercel Blob) in old signatures may still load. Tracked links are the main enforcement lever for links in deployed signatures.

### Subscription plans (source of truth)

Pricing lives in MongoDB (`subscription_plans`), not only in Stripe env vars.

1. Sign in as a **platform admin** and open **`/admin/plans`**.
2. Default **Basic** and **Pro** rows are seeded on first load.
3. For each plan, click **Sync** to create Stripe Product + Price rows (prices are immutable; edit amounts by cloning a new version).
4. Dashboard checkout uses synced plans when available; `STRIPE_BASIC_PRICE_ID` / `STRIPE_PRO_PRICE_ID` remain a fallback until migration is complete.

**Plan caps (promo offers):** Set **Max subscriptions** on a plan in admin (`0` = unlimited). Each organization that signs up for that plan document consumes one slot permanently — **canceled and incomplete subscriptions still count**, so churn does not free slots for new customers. Checkout returns **409** when the cap is full.

**Archive:** Use **Archive** on **`/admin/plans`** to retire a plan from public **`/pricing`** and new checkout. Archived plans appear under **`/admin/plans/archived`** and can be unarchived. Existing org subscriptions stay on their pinned plan.

All paid plans include the same product features (templates, animation slots, etc.).

Optional add-ons: **`/admin/addons`** with the same sync pattern.

## Pre-launch verification (security and billing)

Run these checks before treating production as ready:

1. **Vercel env (Production):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MONGODB_URI`, `BETTER_AUTH_SECRET` set. Without `STRIPE_SECRET_KEY`, the app treats all orgs as paid (dev-only behavior).
2. **Stripe webhook:** Endpoint `https://<your-domain>/api/webhooks/stripe` with events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. Test delivery shows **200**; unsigned POSTs must get **400**.
3. **Client bundle:** After deploy, search built JS (View Source or `/_next/static/...`) for `sk_`, `AIza`, `mongodb+srv`, `xkeysib-`. None should appear.
4. **API auth:** Without a session cookie, `GET /api/dashboard/organization` and `POST /api/dashboard/me/signature-html` must return **401** JSON (not organization data).
5. **Test checkout:** Stripe test mode, card `4242 4242 4242 4242`. Confirm webhook success, **`/dashboard/billing`** shows `subscriptionStatus` `active` or `trialing`, and copy/export signatures works. Send test `invoice.payment_failed` and confirm access locks and owner email (if Brevo is configured).

Local bundle scan after `npm run build`:

```bash
# PowerShell — should print nothing
Select-String -Path ".next\static\**\*.js" -Pattern "sk_live|sk_test|AIza|mongodb\+srv|xkeysib-" -SimpleMatch
```

## Build on Vercel

**Vercel** installs dependencies and runs **`npm run build`** for this framework automatically on each push. Inspect logs under **Project** → **Deployments** → select a deployment → **Build Logs**.

## One-off scripts (optional)

`npm run seed` and `npm run migrate:legacy` are **not** run by **Vercel** during build by default. Run them only when you intend to change the database, from a context that uses the same `MONGODB_URI` as **Production** (for example your provider’s tooling, or a short workflow in the same Git repo with secrets aligned to **Vercel**). See `scripts/` for behavior; prefer a staging **Vercel Preview** + Preview env vars first.

## Email password reset

Password reset and employee invites use Brevo when `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` are set. New signups are synced to the Brevo list configured by `BREVO_LIST_ID` (default list `3`).

## Signature HTML engine

The package `packages/signature-engine` is **frozen** for HTML output. See `packages/signature-engine/FROZEN.md`. App code maps presets and org/employee data into the engine via `lib/email/` and `lib/renderEmployeeSignature.ts`.
