import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { SecureImageUploadError, uploadSecureImage } from '@/lib/uploads/secureImageUpload';

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_WIDTH = 600;

type SessionUser = {
  id?: string;
  organizationId?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId || !user.id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

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

  await connectMongoose();

  try {
    const { url } = await uploadSecureImage(file, {
      pathnamePrefix: `tailnote/users/${user.id}/images`,
      maxBytes: MAX_BYTES,
      maxWidth: MAX_WIDTH,
      outputFormat: 'jpeg',
    });
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof SecureImageUploadError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Image upload failed:', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
