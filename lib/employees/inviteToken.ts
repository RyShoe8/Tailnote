import { randomBytes } from 'crypto';

export const INVITE_EXPIRY_DAYS = 30;

export function generateInviteToken(): string {
  return randomBytes(24).toString('hex');
}

export function inviteExpiresAtFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d;
}

export function isInviteExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}
