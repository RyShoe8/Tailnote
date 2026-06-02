import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { SecureImageUploadError, uploadSecureImage } from '@/lib/uploads/secureImageUpload';
import { FeedbackSubmissionModel } from '@/models/FeedbackSubmission';
import { OrganizationModel } from '@/models/Organization';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const MAX_SUBJECT = 200;
const MAX_DETAILS = 5000;

type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  organizationId?: string;
};

function trimField(value: FormDataEntryValue | null, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as SessionUser;
  if (!user.id || !user.email) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const typeRaw = trimField(formData.get('type'), 20);
  if (typeRaw !== 'bug' && typeRaw !== 'feature') {
    return NextResponse.json({ error: 'Type must be bug or feature' }, { status: 400 });
  }

  const subject = trimField(formData.get('subject'), MAX_SUBJECT);
  if (!subject) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
  }

  const details = trimField(formData.get('details'), MAX_DETAILS);
  if (!details) {
    return NextResponse.json({ error: 'Details are required' }, { status: 400 });
  }

  let imageUrl = '';
  const file = formData.get('file');
  if (file && file instanceof Blob && file.size > 0) {
    try {
      const uploaded = await uploadSecureImage(file, {
        pathnamePrefix: `tailnote/feedback/${user.id}`,
        maxBytes: MAX_IMAGE_BYTES,
        maxWidth: MAX_IMAGE_WIDTH,
      });
      imageUrl = uploaded.url;
    } catch (e) {
      if (e instanceof SecureImageUploadError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      logError('api/dashboard/feedback', e);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  }

  await connectMongoose();

  let organizationName = '';
  if (user.organizationId) {
    const org = await OrganizationModel.findById(user.organizationId).select('name').lean<{ name?: string }>();
    organizationName = org?.name?.trim() ?? '';
  }

  const doc = await FeedbackSubmissionModel.create({
    type: typeRaw,
    subject,
    details,
    imageUrl,
    userId: user.id,
    userEmail: user.email.trim(),
    userName: (user.name ?? '').trim(),
    organizationId: user.organizationId ?? '',
    organizationName,
    status: 'new',
  });

  return NextResponse.json({ id: String(doc._id) }, { status: 201 });
}
