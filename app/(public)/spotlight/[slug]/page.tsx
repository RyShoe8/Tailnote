import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // In a real app, fetch data based on params.slug
  return {
    title: `${params.slug.replace('-', ' ').toUpperCase()} - Tailnote Spotlight`,
    description: `Learn more about ${params.slug} on Tailnote Spotlight.`,
  };
}

export default function SpotlightCompanyPage({ params }: Props) {
  // Mock data for now
  const companyName = params.slug.replace('-', ' ').toUpperCase();
  const quote = "The best marketing is helpful. We make your team 10x faster.";
  const description = "Acme Corp is a startup focused on building the best widgets for modern teams. Founded in 2023, they have grown rapidly and are now used by thousands of companies worldwide.";

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: companyName,
    description: description,
    url: `https://tailnote.com/spotlight/${params.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col min-h-screen pt-24 pb-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <Link href="/spotlight" className="text-sm text-muted-foreground hover:underline">
              ← Back to Spotlight
            </Link>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-lg bg-muted animate-pulse" />
                <h1 className="text-4xl font-bold tracking-tight">{companyName}</h1>
              </div>
              
              <blockquote className="border-l-4 border-primary pl-6 py-2 italic text-2xl text-muted-foreground">
                "{quote}"
              </blockquote>
            </div>

            <div className="prose prose-lg dark:prose-invert">
              <p>{description}</p>
            </div>

            <div className="border-t pt-8 space-y-4">
              <h3 className="font-semibold text-lg">Links & Socials</h3>
              <div className="flex gap-4">
                <a href="#" className="text-primary hover:underline">Website</a>
                <a href="#" className="text-primary hover:underline">Twitter</a>
                <a href="#" className="text-primary hover:underline">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
