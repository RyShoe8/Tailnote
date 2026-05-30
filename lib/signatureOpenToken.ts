import crypto from 'crypto';

const VERSION = 1;
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export type OpenTrackingPayload = {
  v: number;
  exp: number;
  oid: string;
  eid?: string;
};

export function createSignatureOpenToken(
  parts: { organizationId: string; employeeId?: string },
  secret: string
): string {
  if (!secret) throw new Error('Missing signature tracking secret');
  const payload: OpenTrackingPayload = {
    v: VERSION,
    exp: Date.now() + MAX_AGE_MS,
    oid: parts.organizationId,
    eid: parts.employeeId,
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySignatureOpenToken(token: string, secret: string): OpenTrackingPayload | null {
  if (!secret || !token) return null;
  const i = token.lastIndexOf('.');
  if (i <= 0) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let parsed: OpenTrackingPayload;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as OpenTrackingPayload;
  } catch {
    return null;
  }
  if (parsed.v !== VERSION || typeof parsed.exp !== 'number') return null;
  if (Date.now() > parsed.exp) return null;
  if (!parsed.oid) return null;
  return parsed;
}
