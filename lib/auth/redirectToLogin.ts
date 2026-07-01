import { sanitizeInternalRedirect } from '@/lib/auth/sanitizeInternalRedirect';

/** Build a safe login URL that returns the user to an internal path after sign-in. */
export function loginRedirectPath(pathname: string | null | undefined): string {
  const safe = sanitizeInternalRedirect(pathname);
  return safe ? `/login?next=${encodeURIComponent(safe)}` : '/login';
}
