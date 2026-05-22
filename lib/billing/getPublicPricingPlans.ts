import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { ensureDefaultSubscriptionPlans } from '@/lib/billing/ensureDefaultPlans';
import { mapPlanDocToPublicPricing } from '@/lib/billing/mapPlanDocToPublicPricing';

/** Serializable plan row for marketing / pricing UI (latest version per slug). */
export type PublicPricingPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  badge: string;
  interval: SubscriptionPlanDoc['interval'];
  basePriceCents: number;
  additionalUserPriceCents: number;
  includedUsers: number;
  version: number;
  maxSubscriptionSlots: number;
  subscriptionCount: number;
  soldOut: boolean;
};

/**
 * Active, non-paused, non-archived plans for public pricing — one card per slug (highest version).
 */
export async function getPublicPricingPlans(): Promise<PublicPricingPlan[]> {
  await connectMongoose();
  await ensureDefaultSubscriptionPlans();

  const rows = await SubscriptionPlanModel.find({ active: true, paused: false, archived: false })
    .sort({ slug: 1, version: -1 })
    .lean<SubscriptionPlanDoc[]>();

  const seen = new Set<string>();
  const out: PublicPricingPlan[] = [];

  for (const r of rows) {
    const slug = String(r.slug ?? '');
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    out.push(await mapPlanDocToPublicPricing(r));
  }

  return out;
}
