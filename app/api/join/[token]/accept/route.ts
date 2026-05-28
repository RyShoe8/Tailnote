import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { acceptOrganizationUserInvite } from '@/lib/admin/acceptOrganizationUserInvite';
import { getOrganizationUserInviteInfo } from '@/lib/admin/getOrganizationUserInviteInfo';
import {
  buildJoinAcceptLoginRedirect,
  evaluateJoinInvitePrecheck,
} from '@/lib/admin/joinInviteAccept';

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const invite = await getOrganizationUserInviteInfo(token);
  if (!invite) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }
  const precheck = evaluateJoinInvitePrecheck(invite);
  if (precheck) {
    return NextResponse.json({ error: precheck.error }, { status: precheck.status });
  }

  const session = await getServerSession();
  if (!session?.user?.id || !session.user.email) {
    const loginRedirect = buildJoinAcceptLoginRedirect(token, invite.email);
    return NextResponse.json(
      { error: 'Sign in required to accept this invitation', redirect: loginRedirect },
      { status: 401 }
    );
  }

  const user = session.user as {
    id: string;
    email: string;
    name?: string | null;
    organizationId?: string | null;
  };

  const result = await acceptOrganizationUserInvite(token, {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organizationId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, redirect: result.redirect });
}
