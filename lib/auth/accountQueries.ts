import mongoose from 'mongoose';

/**
 * Better Auth may store account.userId as a string or ObjectId; session.user.id is a hex string.
 */
export function accountFilterBySessionUserId(
  sessionUserId: string
): { userId: string } | { $or: Array<{ userId: string } | { userId: mongoose.Types.ObjectId }> } {
  const trimmed = sessionUserId.trim();
  if (!trimmed) return { userId: '' };

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const oid = new mongoose.Types.ObjectId(trimmed);
    if (String(oid) === trimmed) {
      return { $or: [{ userId: trimmed }, { userId: oid }] };
    }
  }

  return { userId: trimmed };
}
