import mongoose from 'mongoose';
import { GmailIntegrationModel, type GmailIntegrationDoc } from '@/models/GmailIntegration';

/** Normalize Better Auth session user id (ObjectId hex string). */
export function canonicalSessionUserId(userId: string | undefined | null): string | null {
  const trimmed = userId?.trim();
  if (!trimmed) return null;
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const oid = new mongoose.Types.ObjectId(trimmed);
    if (String(oid) === trimmed) return trimmed;
  }
  return trimmed;
}

/** userId values that may exist on legacy GmailIntegration rows. */
export function gmailIntegrationUserIdCandidates(sessionUserId: string): string[] {
  const canonical = canonicalSessionUserId(sessionUserId);
  if (!canonical) return [];
  const set = new Set<string>([canonical]);
  return [...set];
}

export function gmailIntegrationFilterForSessionUser(sessionUserId: string): {
  userId: { $in: string[] };
} | null {
  const ids = gmailIntegrationUserIdCandidates(sessionUserId);
  if (ids.length === 0) return null;
  return { userId: { $in: ids } };
}

export async function findGmailIntegrationForSessionUser(
  sessionUserId: string
): Promise<GmailIntegrationDoc | null> {
  const filter = gmailIntegrationFilterForSessionUser(sessionUserId);
  if (!filter) return null;
  return GmailIntegrationModel.findOne(filter).lean<GmailIntegrationDoc>();
}

export async function deleteGmailIntegrationForSessionUser(sessionUserId: string): Promise<void> {
  const filter = gmailIntegrationFilterForSessionUser(sessionUserId);
  if (!filter) return;
  await GmailIntegrationModel.deleteMany(filter);
}

/** Row counts as connected only when a refresh token and linked Gmail email are stored. */
export function isGmailIntegrationConnected(
  row: Pick<GmailIntegrationDoc, 'encryptedRefreshToken' | 'googleEmail'> | null | undefined
): boolean {
  return Boolean(row?.encryptedRefreshToken?.trim() && row?.googleEmail?.trim());
}
