import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tailnote Spotlight - Hall of Fame',
  description: 'View past winners of the Tailnote Spotlight.',
};

export default function SpotlightWinnersPage() {
  return (
    <div className="flex flex-col min-h-screen py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-4 mb-16">
          <Trophy className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tighter">Spotlight Hall of Fame</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            These startups were voted by our community and featured across thousands of email signatures.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder for winners */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div>
                  <h3 className="font-semibold text-xl">Acme Corp</h3>
                  <p className="text-sm text-muted-foreground">Featured Oct 2023</p>
                </div>
              </div>
              <p className="text-sm">&quot;The best marketing is helpful. Acme widgets make your team 10x faster.&quot;</p>
              <Link href="/spotlight/acme-corp" className="inline-flex text-primary hover:underline text-sm font-medium">
                View Campaign →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
