import crypto from 'crypto';
import type { SignatureClickKind } from '@/models/SignatureClickEvent';

const VERSION = 1;
const MAX_DEST_LEN = 4000;
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export type TrackingPayload = {
  v: number;
  exp: number;
  oid: string;
  eid?: string;
  k: SignatureClickKind;
  d: string;
  qid?: string;
};

export function createSignatureTrackingToken(
  parts: {
    organizationId: string;
    employeeId?: string;
    kind: SignatureClickKind;
    destination: string;
    quoteId?: string;
  },
  secret: string
): string {
  if (!secret) throw new Error('Missing signature tracking secret');
  const d = parts.destination.trim();
  if (!d || d.length > MAX_DEST_LEN) throw new Error('Invalid destination');
  const payload: TrackingPayload = {
    v: VERSION,
    exp: Date.now() + MAX_AGE_MS,
    oid: parts.organizationId,
    eid: parts.employeeId,
    k: parts.kind,
    d,
    ...(parts.quoteId ? { qid: parts.quoteId } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySignatureTrackingToken(token: string, secret: string): TrackingPayload | null {
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
  let parsed: TrackingPayload;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TrackingPayload;
  } catch {
    return null;
  }
  if (parsed.v !== VERSION || typeof parsed.exp !== 'number' || typeof parsed.d !== 'string') return null;
  if (Date.now() > parsed.exp) return null;
  if (!parsed.oid || !parsed.k) return null;
  return parsed;
}

export function isAllowedTrackingDestination(url: string): boolean {
  const t = url.trim();
  const lower = t.toLowerCase();
  if (lower.startsWith('mailto:')) return true;
  if (lower.startsWith('tel:')) return true;
  if (lower.startsWith('https://')) return true;
  if (lower.startsWith('http://')) return true;
  return false;
}
