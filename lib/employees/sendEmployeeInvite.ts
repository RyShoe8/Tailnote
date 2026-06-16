import type { Types } from 'mongoose';
import type { OrganizationDoc } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { getAppBaseUrl } from '@/lib/email/appUrl';
import { sendEmail } from '@/lib/email/mail';
import { buildEmployeeInviteEmail } from '@/lib/email/templates/employeeInviteEmail';
import { generateInviteToken, inviteExpiresAtFromNow } from '@/lib/employees/inviteToken';

export type SendEmployeeInviteResult =
  | { ok: true; inviteUrl: string; devLogged?: boolean }
  | { ok: false; error: string; code?: 'email_not_configured' | 'send_failed' };

type EmployeeInviteInput = {
  _id: Types.ObjectId;
  email: string;
  inviteToken?: string | null;
  inviteExpiresAt?: Date | null;
  inviteAcceptedAt?: Date | null;
};

export async function sendEmployeeInvite(
  employee: EmployeeInviteInput,
  org: Pick<OrganizationDoc, 'name' | 'companyName'>
): Promise<SendEmployeeInviteResult> {
  if (employee.inviteAcceptedAt) {
    return { ok: false, error: 'Invite already accepted' };
  }

  let inviteToken = employee.inviteToken;

  if (!inviteToken) {
    inviteToken = generateInviteToken();
  }

  const inviteExpiresAt = inviteExpiresAtFromNow();
  await EmployeeModel.updateOne(
    { _id: employee._id },
    { $set: { inviteToken, inviteExpiresAt } }
  );

  const baseUrl = getAppBaseUrl();
  const inviteUrl = `${baseUrl}/invite/${inviteToken}`;
  const orgName = org.companyName?.trim() || org.name?.trim() || 'your team';

  const { subject, html, text } = buildEmployeeInviteEmail({
    orgName,
    inviteUrl,
    employeeEmail: employee.email,
  });

  const result = await sendEmail({
    to: employee.email,
    subject,
    html,
    text,
  });

  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code };
  }

  const inviteSentAt = new Date();
  await EmployeeModel.updateOne({ _id: employee._id }, { $set: { inviteSentAt } });

  if (result.devLogged) {
    console.info('[Tailnote] Employee invite URL:', inviteUrl);
  }

  return { ok: true, inviteUrl, devLogged: result.devLogged };
}
