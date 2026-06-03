import { SubscriptionPlanModel } from '@/models/SubscriptionPlan';
import { connectMongoose } from '@/lib/mongoose';

export type MigrateFreemiumPlanFlagResult = {
  freePlansMarked: number;
  complimentaryPlansCleared: number;
};

/** Idempotent: slug `free` is freemium; other $0 plans are not. */
export async function migrateFreemiumPlanFlag(): Promise<MigrateFreemiumPlanFlagResult> {
  await connectMongoose();
  const freePlansMarked = await SubscriptionPlanModel.updateMany(
    { slug: 'free' },
    { $set: { isFreemium: true } }
  );
  const complimentaryPlansCleared = await SubscriptionPlanModel.updateMany(
    { basePriceCents: 0, slug: { $ne: 'free' } },
    { $set: { isFreemium: false } }
  );
  return {
    freePlansMarked: freePlansMarked.modifiedCount ?? 0,
    complimentaryPlansCleared: complimentaryPlansCleared.modifiedCount ?? 0,
  };
}
