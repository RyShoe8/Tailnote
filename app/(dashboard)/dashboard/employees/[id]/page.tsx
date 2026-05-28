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
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SignaturePreviewFrame,
  mobileFrameWidthForLayout,
} from '@/components/signature/SignaturePreviewFrame';
import { LivePreviewStickyColumn } from '@/components/signature/LivePreviewStickyColumn';
import {
  MobileSignaturePaneBar,
  type MobileSignaturePane,
} from '@/components/signature/MobileSignaturePaneBar';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { useIsLgUp, useIsMobileInstallContext } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { SignatureInstallPanel } from '@/components/signature/SignatureInstallPanel';
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
  const [mobilePane, setMobilePane] = useState<MobileSignaturePane>('edit');
  const isLgUp = useIsLgUp();
  const isMobileInstall = useIsMobileInstallContext();
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
  /** Server HTML with signed tracking URLs when org enables analytics. */
  const [trackedHtml, setTrackedHtml] = useState<string | null>(null);
  /** Bumps after mount so signature HTML re-renders with real `window` origin (SSR memo used localhost). */
  const [assetOriginNonce, setAssetOriginNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, tmplRes, orgRes] = await Promise.all([
        fetch(`/api/dashboard/employees/${id}`, { credentials: 'include' }),
        fetch('/api/dashboard/templates', { credentials: 'include' }),
        fetch('/api/dashboard/organization', { credentials: 'include' }),
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
    isOrganizationPaid(
      org
        ? {
            subscriptionStatus: org.subscriptionStatus as
              | 'none'
              | 'active'
              | 'trialing'
              | 'past_due'
              | 'canceled'
              | 'incomplete',
          }
        : null
    ) &&
    Boolean(profile.firstName.trim() && profile.lastName.trim() && profile.email.trim() && previewHtml.trim());

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

  const showEditColumn = isLgUp || mobilePane === 'edit';
  const showPreviewColumn = isLgUp || mobilePane === 'preview';

  return (
    <div className={cn('max-w-7xl min-w-0 space-y-8 w-full', !isLgUp && 'pb-24')}>
      <Link href="/dashboard/employees" className="text-sm text-muted-foreground hover:text-foreground">
        ← Employees
      </Link>
      {showInviteWarning && inviteStatus !== 'accepted' ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {inviteWarningText}
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-12 items-start min-w-0">
        {showEditColumn ? (
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
            <CardTitle>Install signature</CardTitle>
            <CardDescription>
              Copy this employee&apos;s signature and paste it into their Gmail or Outlook account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignatureInstallPanel
              html={previewHtml}
              disabled={!canCopy}
              downloadFilename={`${firstName}-${lastName}-signature.html`.replace(/\s+/g, '-').toLowerCase()}
              emailForwardNote={
                firstName.trim() || lastName.trim()
                  ? `Forward this email to ${[firstName, lastName].filter(Boolean).join(' ')} if you are installing their signature for them.`
                  : undefined
              }
            />
          </CardContent>
        </Card>
        </div>
        ) : null}

        {showPreviewColumn ? (
        <LivePreviewStickyColumn className="lg:col-span-7">
      <Card className="max-w-full min-w-0 shadow-xl border-primary/10">
        <CardHeader>
          <CardTitle>Preview & export</CardTitle>
          <CardDescription>Live preview; hosted page matches saved data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 max-w-full min-w-0 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
          <div className="min-w-0 overflow-hidden">
            <SignaturePreviewFrame
              html={previewHtml}
              variant="mobile"
              appearance="flat"
              mobileFrameWidth={mobileFrameWidthForLayout(engineTemplate?.layout)}
            />
          </div>
          {isMobileInstall ? (
            <p className="text-xs text-muted-foreground lg:hidden">
              Install on a desktop or laptop—phones cannot paste rich signatures. Use the Install tab to download or
              email the signature to yourself.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {!isMobileInstall ? <CopySignatureButton html={previewHtml} disabled={!canCopy} /> : null}
          </div>
        </CardContent>
      </Card>
        </LivePreviewStickyColumn>
        ) : null}

        {!isLgUp ? (
          <MobileSignaturePaneBar pane={mobilePane} onPaneChange={setMobilePane} />
        ) : null}
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
