const BREVO_API_BASE = 'https://api.brevo.com/v3';

export function getBrevoSenderEmail(): string {
  return process.env.BREVO_SENDER_EMAIL?.trim() ?? '';
}

export function getBrevoSenderName(): string {
  return process.env.BREVO_SENDER_NAME?.trim() || 'Tailnote Team';
}

export function getBrevoListId(): number {
  const raw = process.env.BREVO_LIST_ID?.trim();
  if (!raw) return 3;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 3;
}

export function getBrevoNewsletterListId(): number {
  const raw = process.env.BREVO_NEWSLETTER_LIST_ID?.trim();
  if (!raw) {
    throw new Error('BREVO_NEWSLETTER_LIST_ID is not configured');
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) {
    throw new Error('BREVO_NEWSLETTER_LIST_ID must be a number');
  }
  return n;
}

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim() && getBrevoSenderEmail());
}

export async function brevoFetch<T = unknown>(
  path: string,
  options: { method?: string; json?: unknown } = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: 'BREVO_API_KEY is not configured', status: 0 };
  }

  const headers: Record<string, string> = {
    'api-key': apiKey,
    Accept: 'application/json',
    ...(options.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
  };

  const res = await fetch(`${BREVO_API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
  });

  if (res.ok) {
    const text = await res.text();
    if (!text) return { ok: true, data: {} as T };
    try {
      return { ok: true, data: JSON.parse(text) as T };
    } catch {
      return { ok: true, data: {} as T };
    }
  }

  let message = `Brevo API error (${res.status})`;
  try {
    const errBody = (await res.json()) as { message?: string };
    if (errBody.message) message = errBody.message;
  } catch {
    // ignore parse errors
  }
  return { ok: false, error: message, status: res.status };
}
