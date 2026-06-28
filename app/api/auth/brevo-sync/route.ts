import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { syncUserToBrevoList } from '@/lib/email/brevoContacts';
import { subscribeToBrevoNewsletter } from '@/lib/email/brevoNewsletter';

const BrevoSyncSchema = z.object({
  companyName: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  subscribeNewsletter: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = session;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = BrevoSyncSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { companyName, industry, subscribeNewsletter } = result.data;

  try {
    // 1. Sync custom attributes to the main contact list
    await syncUserToBrevoList({
      email: user.email,
      name: user.name,
      companyName,
      industry,
    });

    // 2. Subscribe to newsletter if requested
    if (subscribeNewsletter) {
      await subscribeToBrevoNewsletter({
        email: user.email,
        firstName: user.name?.split(' ')[0],
        source: 'signup_flow',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Tailnote] API brevo-sync error:', err);
    return NextResponse.json({ error: 'Failed to sync with Brevo' }, { status: 500 });
  }
}
