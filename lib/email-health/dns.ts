import { promises as dns } from 'node:dns';

// Use a custom resolver pointing to public DNS servers to bypass 
// aggressive local OS/ISP caching, making rescans much more responsive.
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);

export async function resolveTxtRecords(name: string): Promise<string[][]> {
  try {
    return await resolver.resolveTxt(name);
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
    return await resolver.resolveMx(domain);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENODATA' || code === 'ENOTFOUND') return [];
    throw err;
  }
}
