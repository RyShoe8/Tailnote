import { redirect } from 'next/navigation';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';

export default function UpgradePage() {
  redirect(DASHBOARD_UPGRADE_HREF);
}
