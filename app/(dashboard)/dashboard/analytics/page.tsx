import { SignatureAnalyticsClient } from '@/components/dashboard/SignatureAnalyticsClient';
import { getDashboardSession } from '@/lib/dashboard/getDashboardContext';

export default async function AnalyticsPage() {
  await getDashboardSession();

  return <SignatureAnalyticsClient />;
}
