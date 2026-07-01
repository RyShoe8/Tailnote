import { sanitizeInternalRedirect } from '@/lib/auth/sanitizeInternalRedirect';

export function buildPostSignupPath(args: {
  searchParams: URLSearchParams;
  inviteToken: string | null;
  joinToken: string | null;
}): string {
  const { searchParams, inviteToken, joinToken } = args;

  if (joinToken) {
    return `/join/${encodeURIComponent(joinToken)}?accept=1`;
  }
  if (inviteToken) {
    return `/invite/${encodeURIComponent(inviteToken)}?accept=1`;
  }

  const safeRedirect = sanitizeInternalRedirect(searchParams.get('redirect'));
  if (safeRedirect) {
    const onboarding = new URLSearchParams();
    onboarding.set('redirect', safeRedirect);
    return `/onboarding?${onboarding.toString()}`;
  }

  const qs = new URLSearchParams();
  const subscriptionPlanId = searchParams.get('subscriptionPlanId');
  const plan = searchParams.get('plan');
  if (subscriptionPlanId) qs.set('subscriptionPlanId', subscriptionPlanId);
  if (plan) qs.set('plan', plan);
  const query = qs.toString();
  return query ? `/onboarding?${query}` : '/onboarding';
}
