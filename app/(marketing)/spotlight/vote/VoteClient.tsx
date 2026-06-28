'use client';

import { useState } from 'react';
import Image from 'next/image';

export function VoteClient({ initialSubmissions }: { initialSubmissions: any[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voted, setVoted] = useState(false); // We could read cookie, but state is enough for session
  
  // Try to determine if they already voted based on cookie (can also just rely on API failure)
  // We'll rely on API returning 403.

  const handleVote = async (id: string) => {
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
          prev.map((sub) => 
            sub._id === id ? { ...sub, votes: data.votes } : sub
          )
        );
        alert('Thanks for voting!');
      } else {
        alert(data.error || 'Failed to vote');
      }
    } catch (err) {
      alert('An error occurred while voting.');
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {submissions.map((sub) => (
        <div key={sub._id} className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
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
            
            <div className="bg-muted/50 p-6 rounded-xl border relative mb-6">
              <span className="absolute -top-3 -left-2 text-4xl text-primary/30 font-serif">"</span>
              <p className="text-lg italic text-foreground mb-4 relative z-10">
                {sub.content?.quote || sub.content?.description || 'No quote provided.'}
              </p>
              <p className="font-semibold">— {sub.content?.quoteAuthor || sub.founder}</p>
            </div>
          </div>
          
          <div className="bg-muted/30 border-t p-6 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-bold text-lg">{sub.votes || 0}</span> <span className="text-muted-foreground">Votes</span>
            </div>
            <button
              onClick={() => handleVote(sub._id)}
              disabled={voted || votingId !== null}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              {votingId === sub._id ? 'Voting...' : (voted ? 'Voted' : 'Vote')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
