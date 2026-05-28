import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { sendEmail } from '@/lib/email/mail';
import { buildSignatureInstallEmail } from '@/lib/email/templates/signatureInstallEmail';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  html: z.string().min(1).max(120_000),
  forwardNote: z.string().max(500).optional(),
});

type SessionUser = {
  email?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = (session.user as SessionUser).email?.trim();
  if (!email) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    const json = await request.json();
    body = BodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { subject, html, text } = buildSignatureInstallEmail({
    signatureHtml: body.html.trim(),
    forwardNote: body.forwardNote?.trim() || undefined,
  });

  const result = await sendEmail({ to: email, subject, html, text });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        code: result.code,
      },
      { status: result.code === 'email_not_configured' ? 503 : 500 }
    );
  }

  return NextResponse.json({ ok: true, devLogged: result.devLogged ?? false });
}
