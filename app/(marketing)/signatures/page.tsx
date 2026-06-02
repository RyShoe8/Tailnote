import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

const signaturesPage = marketingPageByKey('signatures');

export const metadata = createPageMetadata({
  title: signaturesPage.title,
  description: signaturesPage.description,
  path: signaturesPage.path,
});

export default function SignaturesLandingPage() {
  return (
    <div className="container py-14 sm:py-20">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Powered by Tailnote</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Professional email signatures, built for teams
          </h1>
          <p className="text-pretty text-base text-muted-foreground sm:text-lg">
            You are seeing this page because an email signature was created with Tailnote. Tailnote
            helps teams ship clean, consistent signatures with promotional content and optional
            engagement tracking.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Why this signature includes Tailnote</h2>
          <p className="text-sm text-muted-foreground">
            Free Tailnote plans include a subtle Powered by Tailnote attribution. Paid plans remove
            attribution and unlock analytics.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">What you can do with Tailnote</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>- Create polished signatures that work in Gmail and Outlook</li>
            <li>- Add promotional blocks for offers, CTAs, and announcements</li>
            <li>- Track engagement on paid plans with click and open analytics</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/signup">Create your signature</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">View pricing</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/templates">See examples</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
