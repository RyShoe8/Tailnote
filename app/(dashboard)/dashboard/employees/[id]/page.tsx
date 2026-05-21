'use client';

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { renderSignature } from 'emailsignature-engine';
import { buildRenderInput } from '@/lib/email/toRenderInput';
import { engineTemplateFromStoredConfig, type TemplatePresetId } from '@/lib/email/templatePresets';
import { mergeEmployeeSocialIntoOrgBrand } from '@/lib/renderEmployeeSignature';
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';
import { shouldIncludeSignatureAnimation } from '@/lib/billing/entitlements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SignaturePreviewFrame,
  mobileFrameWidthForLayout,
} from '@/components/signature/SignaturePreviewFrame';
import { LivePreviewStickyColumn } from '@/components/signature/LivePreviewStickyColumn';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { downloadHtml } from '@/lib/clipboard';
import {
  GMAIL_SIGNATURE_MAX_CHARS,
  prepareSignatureHtmlForGmailDetailed,
} from '@/lib/email/gmailSignatureHtml';
import type { SignatureProfile, ContentBlockData } from 'emailsignature-engine';
import { ContentBlocksEditor } from '@/components/signature/ContentBlocksEditor';
import { EmployeeInviteBadge } from '@/components/dashboard/EmployeeInviteBadge';
import { getEmployeeInviteStatus } from '@/lib/employees/inviteStatus';
import { inviteErrorMessage } from '@/lib/employees/inviteErrorMessage';

type TemplateOption = { _id: string; name: string; presetId: string; includeAnimationSlot?: boolean };
type OrgJson = Record<string, unknown>;

function EmployeeDetailPageContent() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [org, setOrg] = useState<OrgJson | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlockData[]>([]);
  const [previewToken, setPreviewToken] = useState('');
  const [inviteSentAt, setInviteSentAt] = useState<string | null>(null);
  const [inviteAcceptedAt, setInviteAcceptedAt] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<SignatureProfile>({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    officePhone: '',
    mobilePhone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailBusy, setGmailBusy] = useState(false);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [gmailApplyToReplies, setGmailApplyToReplies] = useState(true);
  /** Server HTML with signed tracking URLs when org enables analytics. */
  const [trackedHtml, setTrackedHtml] = useState<string | null>(null);
  /** Bumps after mount so signature HTML re-renders with real `window` origin (SSR memo used localhost). */
  const [assetOriginNonce, setAssetOriginNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, tmplRes, orgRes, gRes] = await Promise.all([
        fetch(`/api/dashboard/employees/${id}`, { credentials: 'include' }),
        fetch('/api/dashboard/templates', { credentials: 'include' }),
        fetch('/api/dashboard/organization', { credentials: 'include' }),
        fetch('/api/integrations/gmail/status', { credentials: 'include' }),
      ]);
      const empJson = await empRes.json();
      const tmplJson = await tmplRes.json();
      const orgJson = await orgRes.json();
      if (!empRes.ok) {
        setError('Employee not found');
        return;
      }
      const e = empJson.employee;
      setFirstName(e.firstName);
      setLastName(e.lastName);
      setTitle(e.title || '');
      setEmail(e.email);
      setPhone(e.phone || '');
      setLinkedin(e.linkedin || '');
      setTwitter(e.twitter || '');
      setContentBlocks((e as any).contentBlocks || []);
      setTemplateId(String(e.templateId));
      setPreviewToken(e.previewToken);
      setInviteSentAt(e.inviteSentAt ? String(e.inviteSentAt) : null);
      setInviteAcceptedAt(e.inviteAcceptedAt ? String(e.inviteAcceptedAt) : null);
      setProfile({
        firstName: e.firstName,
        lastName: e.lastName,
        title: e.title || '',
        email: e.email,
        officePhone: e.phone || '',
        mobilePhone: '',
      });
      setTemplates(tmplJson.templates || []);
      setOrg(orgJson.organization || null);
      const role = orgJson.viewer?.role;
      setCanManage(role === 'owner' || role === 'admin');
      const gJson = await gRes.json().catch(() => ({}));
      if (gJson.connected) {
        setGmailConnected(true);
        setGmailEmail(String(gJson.googleEmail || ''));
        setGmailApplyToReplies(gJson.applyToReplies !== false);
      } else {
        setGmailConnected(false);
        setGmailEmail('');
        setGmailApplyToReplies(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    setAssetOriginNonce(1);
  }, []);

  useEffect(() => {
    setProfile((p) => ({
      ...p,
      firstName,
      lastName,
      title,
      email,
      officePhone: phone,
    }));
  }, [firstName, lastName, title, email, phone]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === templateId),
    [templates, templateId]
  );

  const engineTemplate = useMemo(() => {
    if (!org || !selectedTemplate) return null;
    const planKey = String(org.plan || 'none');
    return engineTemplateFromStoredConfig({
      templateId: selectedTemplate._id,
      name: selectedTemplate.name,
      presetId: selectedTemplate.presetId as TemplatePresetId,
      includeAnimationSlot: shouldIncludeSignatureAnimation(
        {
          plan: planKey === 'pro' ? 'pro' : planKey === 'basic' ? 'basic' : 'none',
          subscriptionStatus:
            (org.subscriptionStatus as
              | 'none'
              | 'active'
              | 'trialing'
              | 'past_due'
              | 'canceled'
              | 'incomplete') ?? 'none',
        },
        { includeAnimationSlot: Boolean(selectedTemplate.includeAnimationSlot) }
      ),
    });
  }, [org, selectedTemplate]);

  const html = useMemo(() => {
    if (!engineTemplate) return '';
    const renderInput = buildRenderInput({
      orgBrand: mergeEmployeeSocialIntoOrgBrand(org as never, { linkedin }),
      employee: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        title: profile.title,
        email: profile.email,
        officePhone: profile.officePhone,
        mobilePhone: profile.mobilePhone,
      },
      template: engineTemplate,
      publicSiteOrigin: getSignatureAssetOrigin(),
    });
    // Override contentBlocks for preview
    renderInput.brand.contentBlocks = contentBlocks;
    return renderSignature(renderInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- assetOriginNonce forces post-mount recompute so preview URLs use window origin, not SSR fallback
  }, [engineTemplate, org, profile, assetOriginNonce, linkedin, contentBlocks]);

  const trackingEnabled = Boolean(org && org.signatureClickTrackingEnabled);

  useEffect(() => {
    if (!trackingEnabled || !templateId || !html.trim() || !id) {
      setTrackedHtml(null);
      return;
    }
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      setTrackedHtml(null);
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/dashboard/me/signature-html', {
            method: 'POST',
            credentials: 'include',
            signal: ac.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateId,
              employeeId: id,
              linkedin,
              profile: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                title: profile.title,
                email: profile.email,
                officePhone: profile.officePhone ?? '',
                mobilePhone: profile.mobilePhone ?? '',
              },
            }),
          });
          const j = (await res.json().catch(() => ({}))) as { html?: unknown };
          if (!res.ok || typeof j.html !== 'string') {
            setTrackedHtml(null);
            return;
          }
          setTrackedHtml(j.html);
        } catch (e) {
          if ((e as Error).name === 'AbortError') return;
          setTrackedHtml(null);
        }
      })();
    }, 450);
    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, [
    trackingEnabled,
    templateId,
    id,
    linkedin,
    html,
    profile.firstName,
    profile.lastName,
    profile.title,
    profile.email,
    profile.officePhone,
    profile.mobilePhone,
  ]);

  const previewHtml = trackedHtml ?? html;

  const trackingForGmail = Boolean(trackingEnabled && trackedHtml);
  const gmailSourceHtml = trackingForGmail ? trackedHtml! : html;
  const gmailPrep = useMemo(
    () => prepareSignatureHtmlForGmailDetailed(gmailSourceHtml),
    [gmailSourceHtml]
  );
  const gmailCharCount = gmailPrep.charCount;
  const gmailOverLimit = gmailCharCount > GMAIL_SIGNATURE_MAX_CHARS;
  const gmailPromosStripped = gmailPrep.stackedPromosRemoved;
  const hasEnabledPromoBlocks = contentBlocks.some((b) => b.enabled);
  const gmailPromosBlocked = gmailPromosStripped && hasEnabledPromoBlocks;

  const previewUrl = useMemo(() => {
    if (!previewToken) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/p/${previewToken}`;
  }, [previewToken]);

  async function save() {
    setError(null);
    const res = await fetch(`/api/dashboard/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        title,
        email,
        phone,
        linkedin,
        twitter,
        templateId,
        contentBlocks,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === 'string' ? j.error : 'Save failed');
      return;
    }
    void load();
  }

  async function remove() {
    if (!canManage) return;
    if (!confirm('Delete this employee?')) return;
    setDeleteError(null);
    const res = await fetch(`/api/dashboard/employees/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setDeleteError(typeof j.error === 'string' ? j.error : 'Could not delete employee');
      return;
    }
    router.push('/dashboard/employees');
    router.refresh();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error && !firstName) return <p className="text-sm text-destructive">{error}</p>;

  const canCopy =
    Boolean(profile.firstName.trim() && profile.lastName.trim() && profile.email.trim() && previewHtml.trim());

  async function handleApplyGmail() {
    if (!gmailSourceHtml.trim() || gmailOverLimit || gmailPromosBlocked) return;
    setGmailBusy(true);
    setInstallMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/apply-signature', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: gmailSourceHtml, applyToReplies: gmailApplyToReplies }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInstallMessage(typeof j.error === 'string' ? j.error : 'Could not update Gmail signature');
        return;
      }
      const who = typeof j.sendAsEmail === 'string' ? j.sendAsEmail : 'your send-as address';
      let msg = `Gmail signature updated for ${who}. Gmail may simplify HTML.`;
      if (gmailApplyToReplies) {
        msg +=
          ' For replies and forwards, open Gmail Settings → General → Signature defaults and choose this signature under “For replies and forwards” if it does not apply automatically. See https://support.google.com/mail/answer/8395';
      }
      setInstallMessage(msg);
    } finally {
      setGmailBusy(false);
    }
  }

  async function handleDisconnectGmail() {
    setGmailBusy(true);
    setInstallMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/disconnect', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        setInstallMessage('Could not disconnect Gmail');
        return;
      }
      setGmailConnected(false);
      setGmailEmail('');
      setInstallMessage('Gmail disconnected.');
    } finally {
      setGmailBusy(false);
    }
  }

  const inviteFields = { inviteSentAt, inviteAcceptedAt };
  const inviteStatus = getEmployeeInviteStatus(inviteFields);
  const showInviteWarning = searchParams.get('inviteWarning') === '1';
  const inviteWarningText = inviteErrorMessage(
    undefined,
    searchParams.get('inviteErrorCode') ?? undefined
  );

  async function sendInvite() {
    setInviteBusy(true);
    setInviteMessage(null);
    try {
      const res = await fetch(`/api/dashboard/employees/${id}/invite`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteMessage(
          inviteErrorMessage(
            typeof data.error === 'string' ? data.error : undefined,
            typeof data.code === 'string' ? data.code : undefined
          )
        );
        return;
      }
      setInviteSentAt(data.inviteSentAt ? String(data.inviteSentAt) : new Date().toISOString());
      setInviteMessage('Invitation email sent.');
    } finally {
      setInviteBusy(false);
    }
  }

  return (
    <div className="max-w-7xl min-w-0 space-y-8 w-full">
      <Link href="/dashboard/employees" className="text-sm text-muted-foreground hover:text-foreground">
        ← Employees
      </Link>
      {showInviteWarning && inviteStatus !== 'accepted' ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {inviteWarningText}
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-12 items-start min-w-0">
        <div className="lg:col-span-5 space-y-8 min-w-0">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Invitation</CardTitle>
              <EmployeeInviteBadge employee={inviteFields} />
            </div>
            <CardDescription>
              {inviteStatus === 'accepted'
                ? inviteAcceptedAt
                  ? `Accepted on ${new Date(inviteAcceptedAt).toLocaleDateString()}.`
                  : 'This employee has joined your organization.'
                : inviteStatus === 'pending'
                  ? 'Waiting for them to accept the email invitation.'
                  : 'No invitation email has been sent yet.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inviteMessage ? (
              <p
                className={`text-sm ${inviteMessage.includes('not configured') ? 'text-amber-800 dark:text-amber-300' : 'text-muted-foreground'}`}
              >
                {inviteMessage}
              </p>
            ) : null}
            {canManage && inviteStatus !== 'accepted' ? (
              <Button type="button" variant="secondary" disabled={inviteBusy} onClick={() => void sendInvite()}>
                {inviteBusy ? 'Sending…' : inviteStatus === 'pending' ? 'Resend invite' : 'Send invite'}
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Edit employee</CardTitle>
            <CardDescription>Twitter is stored but not rendered in signatures yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.presetId})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Twitter URL</Label>
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </div>

            <div className="pt-4 border-t space-y-4">
              <div>
                <h3 className="text-sm font-medium leading-none mb-1">Promotional Content Blocks</h3>
                <p className="text-sm text-muted-foreground">Up to 2 blocks to the right of the signature in the Corporate and Professional templates.</p>
              </div>
              <ContentBlocksEditor value={contentBlocks} onChange={setContentBlocks} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void save()}>
                Save
              </Button>
              {canManage ? (
                <Button type="button" variant="outline" onClick={() => void remove()}>
                  Delete
                </Button>
              ) : null}
            </div>
            {previewUrl && (
              <p className="text-xs text-muted-foreground break-all">
                Hosted preview:{' '}
                <a href={previewUrl} className="underline" target="_blank" rel="noreferrer">
                  {previewUrl}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Install to your inbox</CardTitle>
            <CardDescription>Gmail uses the preview HTML below. Outlook is manual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm font-medium">Gmail</p>
              <p
                className={
                  gmailOverLimit || gmailPromosBlocked
                    ? 'text-xs text-destructive font-medium'
                    : 'text-xs text-muted-foreground'
                }
              >
                Gmail size: {gmailCharCount.toLocaleString()} / {GMAIL_SIGNATURE_MAX_CHARS.toLocaleString()}{' '}
                characters
                {gmailOverLimit
                  ? ' — over limit. Remove promo blocks, use a simpler template, or shorten content.'
                  : gmailPromosBlocked
                    ? ' — promotional blocks would be omitted to meet Gmail’s limit. Remove a promo block, shorten copy, switch template, or disable click tracking.'
                    : trackingForGmail
                      ? '. Tracked links included when under the size limit.'
                      : '. Direct links are used (enable click analytics on Overview to track Gmail link clicks).'}
              </p>
              <p className="text-xs text-muted-foreground">
                Gmail uses a stacked layout for promotional blocks (same as the mobile preview). Desktop
                side-by-side layout applies in the dashboard preview and when copying HTML.
              </p>
              {installMessage && <p className="text-xs text-muted-foreground">{installMessage}</p>}
              {gmailConnected ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Connected{gmailEmail ? ` as ${gmailEmail}` : ''}.
                  </p>
                  <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
                    <input
                      id="employee-gmail-apply-replies"
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-input"
                      checked={gmailApplyToReplies}
                      onChange={(e) => setGmailApplyToReplies(e.target.checked)}
                      disabled={gmailBusy}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="employee-gmail-apply-replies" className="cursor-pointer font-normal leading-snug">
                        Use this signature for replies and forwards (where Gmail allows)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Gmail&apos;s API sets the signature for new messages. Replies may need Signature defaults in
                        Gmail Settings → General.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={gmailBusy || !canCopy || gmailOverLimit || gmailPromosBlocked}
                      onClick={() => void handleApplyGmail()}
                    >
                      {gmailBusy ? 'Applying…' : 'Apply signature to Gmail'}
                    </Button>
                    <Button type="button" variant="outline" disabled={gmailBusy} onClick={() => void handleDisconnectGmail()}>
                      Disconnect Gmail
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Connect your Google account once (also available on the organization Signature page).
                  </p>
                  <Button type="button" variant="secondary" asChild>
                    <a href="/api/integrations/gmail/start">Connect Gmail</a>
                  </Button>
                </>
              )}
            </div>
            <OutlookInstallHelp />
          </CardContent>
        </Card>
        </div>

        <LivePreviewStickyColumn className="lg:col-span-7">
      <Card className="max-w-full min-w-0 shadow-xl border-primary/10">
        <CardHeader>
          <CardTitle>Preview & export</CardTitle>
          <CardDescription>Desktop and mobile frames; hosted page matches saved data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 max-w-full min-w-0 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
          <div className="grid grid-cols-1 gap-10 min-w-0">
            <div className="min-w-0 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Desktop</p>
              <SignaturePreviewFrame html={previewHtml} variant="desktop" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Mobile</p>
              <SignaturePreviewFrame
                html={previewHtml}
                variant="mobile"
                mobileFrameWidth={mobileFrameWidthForLayout(engineTemplate?.layout)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopySignatureButton html={previewHtml} disabled={!canCopy} />
            <CopyRichTextButton html={previewHtml} disabled={!canCopy} />
            <Button
              type="button"
              variant="outline"
              disabled={!canCopy}
              onClick={() => downloadHtml('signature.html', previewHtml)}
            >
              Download HTML
            </Button>
          </div>
        </CardContent>
      </Card>
        </LivePreviewStickyColumn>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <EmployeeDetailPageContent />
    </Suspense>
  );
}
