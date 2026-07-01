'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MarketingSignaturePreview } from '@/components/marketing/MarketingSignaturePreview';

export type VoteSubmission = {
  _id: string;
  companyName: string;
  founder?: string;
  industry?: string;
  logoUrl?: string;
  signatureHtml: string;
  votes?: number;
};

type VoteClientProps = {
  initialSubmissions: VoteSubmission[];
  readOnly?: boolean;
  paused?: boolean;
  previewLabel?: string;
};

export function VoteClient({
  initialSubmissions,
  readOnly = false,
  paused = false,
  previewLabel,
}: VoteClientProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  const handleVote = async (id: string) => {
    if (readOnly || paused) return;
    setVotingId(id);
    try {
      const res = await fetch('/api/campaigns/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id }),
      });
      const data = await res.json();

      if (res.ok) {
        setVoted(true);
        setSubmissions((prev) =>
          prev.map((sub) => (sub._id === id ? { ...sub, votes: data.votes } : sub)),
        );
        alert('Thanks for voting!');
      } else {
        alert(data.error || 'Failed to vote');
      }
    } catch {
      alert('An error occurred while voting.');
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {submissions.map((sub) => (
        <div
          key={sub._id}
          className={`bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col ${
            readOnly ? 'opacity-95' : ''
          }`}
        >
          {previewLabel ? (
            <div className="px-6 pt-4">
              <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                {previewLabel}
              </span>
            </div>
          ) : null}
          <div className="p-8 flex-grow">
            <div className="flex items-center space-x-4 mb-6">
              {sub.logoUrl ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border bg-white flex-shrink-0">
                  <Image src={sub.logoUrl} alt={sub.companyName} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold">{sub.companyName?.charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{sub.companyName}</h3>
                <p className="text-muted-foreground">{sub.industry}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border bg-card p-4 shadow-sm relative">
              <div className="absolute top-2 right-2 z-10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/80 px-1 rounded">
                Tailnote Signature
              </div>
              <div className="pt-2 min-w-[400px]">
                <MarketingSignaturePreview html={sub.signatureHtml} />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border-t p-6 flex items-center justify-between">
            <div className="text-sm">
              {!readOnly ? (
                <>
                  <span className="font-bold text-lg">{submissions.find((s) => s._id === sub._id)?.votes ?? sub.votes ?? 0}</span>{' '}
                  <span className="text-muted-foreground">Votes</span>
                </>
              ) : (
                <span className="text-muted-foreground">Voting opens soon</span>
              )}
            </div>
            {readOnly ? null : (
              <button
                onClick={() => handleVote(sub._id)}
                disabled={voted || votingId !== null || paused}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                {paused ? 'Voting paused' : votingId === sub._id ? 'Voting...' : voted ? 'Voted' : 'Vote'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
