/** Server-side logging helpers (API routes, server actions). Avoid logging secrets or tokens. */

function formatErr(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === 'string') return err.slice(0, 500);
  return 'unknown error';
}

export function logError(context: string, err?: unknown): void {
  const tag = context.startsWith('[') ? context : `[${context}]`;
  if (process.env.NODE_ENV === 'production') {
    if (err !== undefined) {
      console.error(tag, formatErr(err));
    } else {
      console.error(tag);
    }
    return;
  }
  if (err !== undefined) {
    console.error(tag, err);
  } else {
    console.error(tag);
  }
}

export function logWarn(context: string, message?: string): void {
  const tag = context.startsWith('[') ? context : `[${context}]`;
  if (message) console.warn(tag, message);
  else console.warn(tag);
}
