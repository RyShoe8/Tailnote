import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

const conceptSchema = z.object({
  company: z.string().trim().min(1).max(200),
  imageUrl: z.string().url().regex(/^https:\/\/[\w.-]+\.public\.blob\.vercel-storage\.com\//),
});

type Props = { params: Promise<{ token: string }> };

/** Concepts are made and reviewed in Nucleas. This page only ever reads them from there, so nobody can create one here. */
async function loadConcept(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  try {
    const response = await fetch(`https://nucleas.app/api/public/signature-concept/${token}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const parsed = conceptSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error('[signature-example] could not load concept', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const concept = await loadConcept((await params).token);
  if (!concept) return { title: 'Signature example', robots: { index: false, follow: false } };
  const title = `An email signature concept for ${concept.company}`;
  const description = `See the signature Tailnote designed for ${concept.company}, and create your own.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, images: [{ url: concept.imageUrl, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [concept.imageUrl] },
  };
}

export default async function SignatureExamplePage({ params }: Props) {
  const concept = await loadConcept((await params).token);
  if (!concept) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">We made this email signature for {concept.company}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {concept.company} didn&apos;t ask for this and isn&apos;t a Tailnote customer. We built it from their public website to show what their email could look like.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- a screenshot stored by Nucleas */}
      <img src={concept.imageUrl} alt={`An email signature concept for ${concept.company}`} className="mt-8 w-full rounded-lg border bg-white" />
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link href="/signup">Create your signature</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/">See how Tailnote works</Link></Button>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Is this your company, and would you like this page removed? <Link href="/contact" className="underline">Let us know</Link>.
      </p>
    </main>
  );
}
