'use client';

import { useRouter } from 'next/navigation';
import { deleteSubmissionAction, updateSubmissionStatusAction, toggleHallOfFameAction } from './actions';

export function SubmissionActions({ submissionId, hallOfFame }: { submissionId: string; hallOfFame?: boolean }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) return;
    
    try {
      await deleteSubmissionAction(submissionId);
      router.push('/admin/spotlight');
    } catch (err) {
      alert('Failed to delete submission');
    }
  }

  async function handleStatusUpdate(status: string, votingStartDate?: Date) {
    try {
      await updateSubmissionStatusAction(submissionId, status, votingStartDate);
      router.refresh();
    } catch (err) {
      alert('Failed to update status');
    }
  }

  async function handleToggleHallOfFame() {
    try {
      await toggleHallOfFameAction(submissionId);
      router.refresh();
    } catch (err) {
      alert('Failed to toggle Hall of Fame status');
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <h2 className="font-semibold text-lg border-b pb-2">Admin Actions</h2>
      <div className="space-y-3">
        <div className="p-3 border rounded-md bg-muted/30 space-y-2">
          <label className="text-sm font-medium">Schedule Voting Start Date</label>
          <input 
            type="date" 
            id="votingStartDate"
            className="w-full border rounded px-2 py-1 text-sm" 
            defaultValue={new Date().toISOString().split('T')[0]} 
          />
          <button 
            onClick={() => {
              const dateVal = (document.getElementById('votingStartDate') as HTMLInputElement).value;
              handleStatusUpdate('voting', dateVal ? new Date(dateVal) : undefined);
            }}
            className="w-full bg-blue-600 text-white py-1.5 px-4 rounded-md font-medium text-sm hover:bg-blue-700 transition mt-2"
          >
            Add to Scheduled Vote
          </button>
        </div>
        <button 
          onClick={() => handleStatusUpdate('approved')}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium hover:bg-primary/90 transition"
        >
          Approve (Skip Vote)
        </button>
        <button 
          onClick={() => handleStatusUpdate('needs_changes')}
          className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md font-medium hover:bg-secondary/80 transition"
        >
          Request Changes
        </button>
        <button 
          onClick={() => handleStatusUpdate('rejected')}
          className="w-full bg-destructive text-destructive-foreground py-2 px-4 rounded-md font-medium hover:bg-destructive/90 transition"
        >
          Reject Submission
        </button>
      </div>
      <div className="pt-4 border-t mt-4 space-y-3">
        <h3 className="font-semibold text-sm">Hall of Fame</h3>
        <p className="text-xs text-muted-foreground">Feature this submission on the public Spotlight winners page.</p>
        <button 
          onClick={handleToggleHallOfFame}
          className={`w-full py-2 px-4 rounded-md font-medium transition ${
            hallOfFame 
              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' 
              : 'border border-input bg-background hover:bg-accent'
          }`}
        >
          {hallOfFame ? '★ Remove from Hall of Fame' : '☆ Add to Hall of Fame'}
        </button>
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
