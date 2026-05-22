import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth/server';
import { getMongoDb } from '@/lib/mongoose';

export async function linkUserToOrganization(
  userId: string,
  organizationId: string,
  role: 'owner' | 'member' = 'owner'
): Promise<void> {
  const userUpdate = { organizationId, role };

  try {
    const auth = await getAuth();
    await auth.api.updateUser({
      body: userUpdate as never,
      headers: await headers(),
    });
    return;
  } catch (err) {
    console.error('[onboarding] updateUser failed, trying Mongo fallback', err);
  }

  const db = getMongoDb();
  const result = await db.collection('user').updateOne(
    { id: userId } as Record<string, unknown>,
    { $set: userUpdate }
  );
  if (result.matchedCount === 0) {
    throw new Error('Could not link organization to your account');
  }
}
