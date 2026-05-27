import { NextResponse } from 'next/server';
import { getOrganizationUserInviteInfo } from '@/lib/admin/getOrganizationUserInviteInfo';

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const info = await getOrganizationUserInviteInfo(token);
  if (!info) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  return NextResponse.json(info);
}
