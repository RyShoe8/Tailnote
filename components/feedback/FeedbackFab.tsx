'use client';

import { useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type FeedbackType = 'bug' | 'feature';

export function FeedbackFab() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setType('bug');
    setSubject('');
    setDetails('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
    setSuccess(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (!picked) {
      setFile(null);
      return;
    }
    if (picked.size > MAX_IMAGE_BYTES) {
      setError('Image must be 2 MB or smaller');
      e.target.value = '';
      setFile(null);
      return;
    }
    setError(null);
    setFile(picked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedSubject = subject.trim();
    const trimmedDetails = details.trim();
    if (!trimmedSubject) {
      setError('Subject is required');
      return;
    }
    if (!trimmedDetails) {
      setError('Details are required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('type', type);
      formData.set('subject', trimmedSubject);
      formData.set('details', trimmedDetails);
      if (file) formData.set('file', file);

      const res = await fetch('/api/dashboard/feedback', { method: 'POST', body: formData });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit feedback');
        return;
      }
      setSuccess(true);
      setSubject('');
      setDetails('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1500);
    } catch {
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 h-auto gap-2 rounded-full px-4 py-2.5 shadow-lg"
          aria-label="Send feedback"
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Feedback</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(100%,24rem)] flex-col gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle>Send feedback</SheetTitle>
          <SheetDescription>
            Report a bug or request a feature. We may follow up at your account email.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 py-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Type</legend>
            <div className="flex gap-2">
              {(
                [
                  { value: 'bug' as const, label: 'Bug report' },
                  { value: 'feature' as const, label: 'Feature request' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex-1 rounded-md border px-3 py-2 text-sm transition-colors',
                    type === opt.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-input text-muted-foreground hover:bg-muted'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="feedback-subject">Subject</Label>
            <Input
              id="feedback-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="Brief summary"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-details">Details</Label>
            <Textarea
              id="feedback-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="What happened or what would you like to see?"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-file">Screenshot (optional)</Label>
            <Input
              id="feedback-file"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or GIF. Max 2 MB.</p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? (
            <p className="text-sm text-green-600 dark:text-green-400">Thank you — your feedback was sent.</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Submit'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
