import Link from 'next/link';

export default async function SpotlightSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Mock data
  const submission = {
    id,
    companyName: 'Example Startup',
    website: 'https://example.com',
    industry: 'Software',
    status: 'pending',
    quote: 'We make things fast.',
    description: 'A great new startup.',
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <Link href="/spotlight" className="text-sm text-muted-foreground hover:underline">
          ← Back to Submissions
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{submission.companyName}</h1>
            <a href={submission.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{submission.website}</a>
          </div>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending Review</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Application Details</h2>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Industry</p>
              <p>{submission.industry}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Quote</p>
              <p className="italic">&quot;{submission.quote}&quot;</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Description</p>
              <p>{submission.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Admin Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium hover:bg-primary/90 transition">Approve & Generate Assets</button>
              <button className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md font-medium hover:bg-secondary/80 transition">Request Changes</button>
              <button className="w-full bg-destructive text-destructive-foreground py-2 px-4 rounded-md font-medium hover:bg-destructive/90 transition">Reject Submission</button>
            </div>
            <div className="pt-4 border-t border-destructive/20 mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Destructive actions:</p>
              <button className="w-full border border-destructive text-destructive py-2 px-4 rounded-md font-medium hover:bg-destructive/10 transition">Delete Submission</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
