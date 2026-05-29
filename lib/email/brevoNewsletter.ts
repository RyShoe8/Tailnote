import { brevoFetch, getBrevoNewsletterListId, isBrevoConfigured } from '@/lib/email/brevo';

export type SubscribeToBrevoNewsletterInput = {
  email: string;
  firstName?: string;
  tags?: string[];
  source?: string;
  signupPage?: string;
};

export type SubscribeToBrevoNewsletterResult =
  | { ok: true; alreadySubscribed?: boolean }
  | { ok: false; error: string; code: 'not_configured' | 'api_error' };

function parseDuplicateContact(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('already exist') || lower.includes('duplicate');
}

export async function subscribeToBrevoNewsletter(
  input: SubscribeToBrevoNewsletterInput
): Promise<SubscribeToBrevoNewsletterResult> {
  if (!isBrevoConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[Tailnote] Newsletter signup skipped (Brevo not configured):', input.email);
      return { ok: true };
    }
    return { ok: false, error: 'Email service is not configured', code: 'not_configured' };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: 'Email is required', code: 'api_error' };
  }

  let listId: number;
  try {
    listId = getBrevoNewsletterListId();
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.info('[Tailnote] Newsletter signup skipped (no BREVO_NEWSLETTER_LIST_ID):', email);
      return { ok: true };
    }
    return { ok: false, error: 'Newsletter is not configured', code: 'not_configured' };
  }

  const attributes: Record<string, string> = {
    SOURCE: input.source ?? 'blog',
  };

  if (input.firstName?.trim()) {
    attributes.FNAME = input.firstName.trim();
  }
  if (input.signupPage?.trim()) {
    attributes.SIGNUP_PAGE = input.signupPage.trim().slice(0, 500);
  }
  if (input.tags?.length) {
    attributes.INTERESTS = input.tags.join(',');
  }

  const result = await brevoFetch('/contacts', {
    method: 'POST',
    json: {
      email,
      attributes,
      listIds: [listId],
      updateEnabled: true,
    },
  });

  if (result.ok) {
    return { ok: true };
  }

  if (result.status === 400 && parseDuplicateContact(result.error)) {
    return { ok: true, alreadySubscribed: true };
  }

  return { ok: false, error: result.error, code: 'api_error' };
}
