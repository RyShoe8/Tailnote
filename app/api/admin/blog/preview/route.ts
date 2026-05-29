import { NextResponse } from 'next/server';
import { z } from 'zod';
import { compilePostContent } from '@/lib/blog/compilePost';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PreviewSchema = z.object({
  body: z.string().max(200_000),
});

export async function POST(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = PreviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const compiled = await compilePostContent(parsed.data.body);
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      createElement('div', { className: 'blog-prose' }, compiled.content)
    );
    return NextResponse.json({ html, headings: compiled.headings });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Preview failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
