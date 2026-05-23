# Tailnote

SaaS for **professional company email signatures**: organizations, employees, curated templates, Stripe billing, and hosted previews. Signature **HTML** is produced by the frozen workspace package `emailsignature-engine` (see `packages/signature-engine/FROZEN.md`).

## Deploy on Vercel

1. In the **Vercel Dashboard**, create a **Project** and import this **Git** repository.
2. Add **Environment Variables** under **Project** → **Settings** → **Environment Variables** (see **[SETUP.md](./SETUP.md)** for the full list and Stripe webhook URL).
3. **Push** to your connected branch; **Vercel** creates a **Production** or **Preview** **deployment** and runs **`npm run build`**.

To confirm a build before merging, open the **Pull Request** on GitHub and use the **Vercel** **Preview Deployment** link, or check **Build Logs** on the deployment.

If copied signatures must turn relative **`/images/...`** paths into absolute URLs, set **`NEXT_PUBLIC_SITE_URL`** on Vercel to the same public origin as the app (see `.env.example`).

Auth is **Better Auth** (`/api/auth/*`). Marketing routes: `/`, `/pricing`, `/templates`. App shell: `/dashboard/*`.

## Scripts (optional, DB maintenance)

- `npm run seed` — demo organization (`Demo organization`) + default templates  
- `npm run migrate:legacy` — import legacy `signatureSettings` into a new org (idempotent by name + companyName)  
- `npm run verify:signature` — workspace smoke script for the signature engine

These do not run on **Vercel** during deploy by default. Run only with a deliberate `MONGODB_URI` aligned with your **Vercel** **Production** (or staging **Preview**) secrets — see **SETUP.md**.
