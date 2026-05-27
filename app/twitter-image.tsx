import { createOgImage } from '@/lib/seo/createOgImage';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, SITE_TITLE_DEFAULT } from '@/lib/seo/site';

export const runtime = 'nodejs';

export const alt = SITE_TITLE_DEFAULT;
export const size = { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT };
export const contentType = 'image/png';

export default async function Image() {
  return createOgImage();
}
