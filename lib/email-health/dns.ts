import { promises as dns } from 'node:dns';

export async function resolveTxtRecords(name: string): Promise<string[][]> {
  try {
    return await dns.resolveTxt(name);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENODATA' || code === 'ENOTFOUND') return [];
    throw err;
  }
}

export function flattenTxt(chunks: string[][]): string[] {
  return chunks.map((parts) => parts.join(''));
}

export async function resolveMxRecords(
  domain: string
): Promise<{ exchange: string; priority: number }[]> {
  try {
    return await dns.resolveMx(domain);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENODATA' || code === 'ENOTFOUND') return [];
    throw err;
  }
}
