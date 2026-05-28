export type JoinInvitePrecheck = {
  email: string;
  expired: boolean;
  alreadyAccepted: boolean;
};

export function buildJoinAcceptSignupRedirect(token: string, email: string): string {
  return `/signup?join=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
}

export function evaluateJoinInvitePrecheck(invite: JoinInvitePrecheck): {
  status: number;
  error: string;
} | null {
  if (invite.expired) {
    return { status: 410, error: 'This invitation has expired' };
  }
  if (invite.alreadyAccepted) {
    return { status: 400, error: 'This invitation has already been accepted' };
  }
  return null;
}
