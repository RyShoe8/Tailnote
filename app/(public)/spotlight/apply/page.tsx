'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function SpotlightApplyPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    logoUrl: '',
    founder: '',
    industry: '',
    companySize: '',
    quote: '',
    quoteAuthor: '',
    description: '',
    socialPlatforms: [] as string[],
    socialProfiles: { linkedin: '', twitter: '' },
  });

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        alert('Failed to submit application.');
      }
    } catch (err) {
      alert('Error submitting application.');
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); // Reusing loading state for upload
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await fetch('/api/dashboard/me/image', { method: 'POST', body: data });
      const json = await res.json();
      if (res.ok && json.url) {
        updateForm('logoUrl', json.url);
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (success) {
    return (
      <div className="container max-w-2xl mx-auto py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
        <p className="text-muted-foreground">Thank you for applying to Tailnote Spotlight. We will review your application and get back to you soon.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 md:py-24">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Apply for Spotlight</h1>
        <p className="text-muted-foreground">Step {step} of 6</p>
      </div>

      <div className="space-y-8 bg-card border rounded-lg p-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-semibold">Company Details</h2>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={formData.companyName} onChange={e => updateForm('companyName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={formData.website} onChange={e => updateForm('website', e.target.value)} placeholder="e.g. example.com" />
            </div>
            <div className="space-y-2">
              <Label>Company Logo</Label>
              {formData.logoUrl ? (
                <div className="flex items-center gap-4">
                  <img src={formData.logoUrl} alt="Logo preview" className="w-12 h-12 object-cover border rounded-md" />
                  <Button type="button" variant="outline" size="sm" onClick={() => updateForm('logoUrl', '')}>Change Logo</Button>
                </div>
              ) : (
                <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} disabled={loading} />
              )}
            </div>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-semibold">About the Founder</h2>
            <div className="space-y-2">
              <Label>Founder Name</Label>
              <Input value={formData.founder} onChange={e => updateForm('founder', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={formData.industry} onChange={e => updateForm('industry', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Company Size</Label>
              <Input value={formData.companySize} onChange={e => updateForm('companySize', e.target.value)} placeholder="e.g. 1-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-semibold">Spotlight Quote</h2>
            <p className="text-sm text-muted-foreground">Provide a short, punchy quote about your company or mission to be featured in the signature block.</p>
            <div className="space-y-2">
              <Label>Quote</Label>
              <Textarea value={formData.quote} onChange={e => updateForm('quote', e.target.value)} placeholder="The best marketing is helpful." />
            </div>
            <div className="space-y-2">
              <Label>Quote Author</Label>
              <Input value={formData.quoteAuthor} onChange={e => updateForm('quoteAuthor', e.target.value)} placeholder="Jane Doe, CEO" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Next</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-semibold">Description</h2>
            <div className="space-y-2">
              <Label>Company Description</Label>
              <Textarea value={formData.description} onChange={e => updateForm('description', e.target.value)} placeholder="Tell us what you do..." rows={5} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={() => setStep(5)}>Next</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-semibold">Social Profiles</h2>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input 
                value={formData.socialProfiles.linkedin} 
                onChange={e => updateForm('socialProfiles', { ...formData.socialProfiles, linkedin: e.target.value })} 
                placeholder="https://linkedin.com/company/..." 
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter / X URL</Label>
              <Input 
                value={formData.socialProfiles.twitter} 
                onChange={e => updateForm('socialProfiles', { ...formData.socialProfiles, twitter: e.target.value })} 
                placeholder="https://twitter.com/..." 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
              <Button onClick={() => setStep(6)}>Next</Button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-semibold">Review & Submit</h2>
            <p className="text-sm text-muted-foreground">By submitting this application, you agree to the Tailnote Spotlight Terms of Service and give us permission to use your brand assets.</p>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(5)}>Back</Button>
              <Button onClick={submitForm} disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
