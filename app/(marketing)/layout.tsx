import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { getServerSession } from '@/lib/auth/session';
import { organizationJsonLd } from '@/lib/seo/jsonLd';

export const dynamic = 'force-dynamic';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const isLoggedIn = Boolean(session?.user);

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={organizationJsonLd()} />
      <SiteHeader isLoggedIn={isLoggedIn} />
      <main className="min-w-0 flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
