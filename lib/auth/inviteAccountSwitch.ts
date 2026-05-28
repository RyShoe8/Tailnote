'use client';

import { authClient } from '@/lib/auth/client';

export function buildInviteSignupUrl(token: string, email: string): string {
  return `/signup?join=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
}

export function buildInviteLoginUrl(token: string, email: string): string {
  return `/login?join=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
}

export function normalizeEmailForCompare(email: string): string {
  return email.trim().toLowerCase();
}

export function sessionMatchesInvitedEmail(
  sessionEmail: string | undefined | null,
  invitedEmail: string
): boolean {
  if (!sessionEmail?.trim()) return false;
  return normalizeEmailForCompare(sessionEmail) === normalizeEmailForCompare(invitedEmail);
}

export async function signOutForInviteContinuation(): Promise<void> {
  await authClient.signOut();
}

export async function redirectToInviteSignup(token: string, email: string): Promise<void> {
  await signOutForInviteContinuation();
  window.location.href = buildInviteSignupUrl(token, email);
}

export async function redirectToInviteLogin(token: string, email: string): Promise<void> {
  await signOutForInviteContinuation();
  window.location.href = buildInviteLoginUrl(token, email);
}
