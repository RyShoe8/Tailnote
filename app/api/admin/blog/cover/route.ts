import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { logError } from '@/lib/logger';
import { SecureImageUploadError, uploadSecureImage } from '@/lib/uploads/secureImageUpload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_WIDTH = 2400;

export async function POST(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
  }

  try {
    const { url } = await uploadSecureImage(file, {
      pathnamePrefix: 'tailnote/blog/covers',
      maxBytes: MAX_BYTES,
      maxWidth: MAX_WIDTH,
    });
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof SecureImageUploadError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    logError('api/admin/blog/cover', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
