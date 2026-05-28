import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import sharp from 'sharp';

export const ALLOWED_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

const SHARP_FORMAT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

const MAX_DIMENSION = 8000;
const JPEG_QUALITY = 82;

export type SecureImageOutputFormat = 'webp' | 'png' | 'jpeg';

export type SecureImageUploadOptions = {
  /** Blob path prefix, e.g. `tailnote/orgs/{orgId}` — must not contain user-controlled segments */
  pathnamePrefix: string;
  maxBytes: number;
  maxWidth: number;
  /** Default `webp`. Use `png` or `jpeg` for email signatures (Outlook does not render WebP). */
  outputFormat?: SecureImageOutputFormat;
};

export type SecureImageUploadResult = {
  url: string;
  contentType: string;
  width: number;
  height: number;
};

export class SecureImageUploadError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message);
    this.name = 'SecureImageUploadError';
  }
}

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'webp';
}

function normalizeSharpFormat(format: string | undefined): string | null {
  if (!format) return null;
  const f = format.toLowerCase();
  if (f === 'jpg') return 'jpeg';
  return f;
}

function mimeFromSharpFormat(format: string): string | null {
  return SHARP_FORMAT_TO_MIME[format] ?? null;
}

async function encodeResizedImage(
  pipeline: sharp.Sharp,
  outputFormat: SecureImageOutputFormat
): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  if (outputFormat === 'png') {
    const buffer = await pipeline
      .png({ compressionLevel: 9, palette: true, effort: 10 })
      .toBuffer();
    return { buffer, mime: 'image/png', ext: 'png' };
  }
  if (outputFormat === 'jpeg') {
    const buffer = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    return { buffer, mime: 'image/jpeg', ext: 'jpg' };
  }
  const buffer = await pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
  return { buffer, mime: 'image/webp', ext: 'webp' };
}

export async function uploadSecureImage(
  file: Blob,
  opts: SecureImageUploadOptions
): Promise<SecureImageUploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new SecureImageUploadError('File uploads are not configured (BLOB_READ_WRITE_TOKEN)', 503);
  }

  const declaredMime = ((file as File).type || '').toLowerCase();
  if (!declaredMime || !ALLOWED_IMAGE_MIMES.has(declaredMime)) {
    throw new SecureImageUploadError('Only PNG, JPEG, WebP, and GIF images are allowed', 400);
  }
  if (file.size > opts.maxBytes) {
    const mb = Math.round(opts.maxBytes / (1024 * 1024));
    throw new SecureImageUploadError(`File too large (max ${mb} MB)`, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(buffer, { failOn: 'error' }).metadata();
  } catch {
    throw new SecureImageUploadError('Invalid or unreadable image file', 400);
  }

  const sharpFormat = normalizeSharpFormat(metadata.format);
  if (!sharpFormat) {
    throw new SecureImageUploadError('Invalid or unreadable image file', 400);
  }

  const detectedMime = mimeFromSharpFormat(sharpFormat);
  if (!detectedMime || !ALLOWED_IMAGE_MIMES.has(detectedMime)) {
    throw new SecureImageUploadError('Only PNG, JPEG, WebP, and GIF images are allowed', 400);
  }

  const w = metadata.width ?? 0;
  const h = metadata.height ?? 0;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    throw new SecureImageUploadError('Image dimensions are too large', 400);
  }

  const outputFormat = opts.outputFormat ?? 'webp';

  let processedBuffer: Buffer = buffer;
  let finalMime = detectedMime;
  let ext = extFromMime(detectedMime);
  let outWidth = w;
  let outHeight = h;

  try {
    const resized = sharp(buffer, { failOn: 'error', animated: false, page: 0 }).resize({
      width: opts.maxWidth,
      withoutEnlargement: true,
    });
    const encoded = await encodeResizedImage(resized, outputFormat);
    processedBuffer = encoded.buffer;
    finalMime = encoded.mime;
    ext = encoded.ext;
    const outMeta = await sharp(processedBuffer).metadata();
    outWidth = outMeta.width ?? w;
    outHeight = outMeta.height ?? h;
  } catch {
    throw new SecureImageUploadError('Failed to process image', 400);
  }

  const prefix = opts.pathnamePrefix.replace(/\/+$/, '');
  const pathname = `${prefix}/${randomUUID()}.${ext}`;

  const blob = await put(pathname, processedBuffer, {
    access: 'public',
    token,
    contentType: finalMime,
  });

  return {
    url: blob.url,
    contentType: finalMime,
    width: outWidth,
    height: outHeight,
  };
}

/** Display height (px) at 110px logo width — used when saving org.logoHeightPx after upload. */
export function logoHeightPxForEmailDisplay(
  intrinsicWidth: number,
  intrinsicHeight: number,
  displayLogoWidthPx = 110
): number {
  if (intrinsicWidth <= 0 || intrinsicHeight <= 0) return 48;
  const scaled = Math.round((intrinsicHeight / intrinsicWidth) * displayLogoWidthPx);
  return Math.min(400, Math.max(24, scaled));
}
