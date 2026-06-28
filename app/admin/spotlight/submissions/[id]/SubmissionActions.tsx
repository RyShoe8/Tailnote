'use client';

import { useRouter } from 'next/navigation';
import { deleteSubmissionAction } from './actions';

export function SubmissionActions({ submissionId }: { submissionId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) return;
    
    try {
      await deleteSubmissionAction(submissionId);
    } catch (err) {
      alert('Failed to delete submission');
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <h2 className="font-semibold text-lg border-b pb-2">Admin Actions</h2>
      <div className="space-y-3">
        <button disabled className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium opacity-50 cursor-not-allowed">Approve & Generate Assets</button>
        <button disabled className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md font-medium opacity-50 cursor-not-allowed">Request Changes</button>
        <button disabled className="w-full bg-destructive text-destructive-foreground py-2 px-4 rounded-md font-medium opacity-50 cursor-not-allowed">Reject Submission</button>
      </div>
      <div className="pt-4 border-t border-destructive/20 mt-4 space-y-3">
        <p className="text-xs text-muted-foreground">Destructive actions:</p>
        <button 
          onClick={handleDelete}
          className="w-full border border-destructive text-destructive py-2 px-4 rounded-md font-medium hover:bg-destructive/10 transition"
        >
          Delete Submission
        </button>
      </div>
    </div>
  );
}
