'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  renderSignature,
  type SignatureBrand,
  type SignatureProfile,
  type SignatureTemplate,
} from 'emailsignature-engine';
import { engineTemplateFromStoredConfig, type TemplatePresetId } from '@/lib/email/templatePresets';
import { FONT_GROUPS, findFontByStack } from '@/lib/email/fontOptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorField } from '@/components/dashboard/ColorField';
import { PrimaryColorField } from '@/components/dashboard/PrimaryColorField';
import { ContentBlocksEditor } from '@/components/signature/ContentBlocksEditor';
import { SocialLinksEditor } from '@/components/signature/SocialLinksEditor';
import type { ContentBlockData } from 'emailsignature-engine';
import { SignatureForm } from '@/components/signature/SignatureForm';
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
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';
import { shouldIncludeSignatureAnimation } from '@/lib/billing/entitlements';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';

type OrgResponse = {
  companyName?: string;
  website?: string;
  logoUrl?: string;
  logoShape?: 'rectangle' | 'circle';
  logoLink?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  socialLinks?: { linkedin?: string; facebook?: string; instagram?: string; reddit?: string; discord?: string };
  address?: string;
  state?: string;
  zip?: string;
  animation?: { enabled?: boolean; gifUrl?: string };
  name?: string;
  plan?: string;
  subscriptionStatus?: string;
  signatureClickTrackingEnabled?: boolean;
  employeesCanEditBrand?: boolean;
  employeesCanEditPromoBlocks?: boolean;
};

type OrgPermissions = {
  employeesCanEditBrand: boolean;
  employeesCanEditPromoBlocks: boolean;
};

type TemplateRow = {
  _id: string;
  name: string;
  presetId: TemplatePresetId;
  includeAnimationSlot?: boolean;
};

function orgToBrand(org: OrgResponse, displayName: string): SignatureBrand {
  const sl = org.socialLinks ?? {};
  return {
    companyName: (org.companyName || displayName || '').trim(),
    website: (org.website || '').trim(),
    logoUrl: (org.logoUrl || '').trim(),
    logoShape: org.logoShape === 'circle' ? 'circle' : 'rectangle',
    logoLink: (org.logoLink || '').trim(),
    primaryColor: org.primaryColor?.trim() || '#0a0a0a',
    secondaryColor: org.secondaryColor?.trim() || '',
    fontFamily: org.fontFamily?.trim() || 'Arial',
    socialLinks: {
      linkedin: sl.linkedin?.trim(),
      facebook: sl.facebook?.trim(),
      instagram: sl.instagram?.trim(),
      reddit: sl.reddit?.trim(),
      discord: sl.discord?.trim(),
    },
    address: org.address?.trim(),
    state: org.state?.trim(),
    zip: org.zip?.trim(),
    animation: {
      enabled: Boolean(org.animation?.enabled),
      gifUrl: org.animation?.gifUrl?.trim() ?? '',
    },
  };
}

const defaultProfile: SignatureProfile = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  officePhone: '',
  mobilePhone: '',
};

export function SignatureWorkspace() {
  const [org, setOrg] = useState<OrgResponse | null>(null);
  const [orgName, setOrgName] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlockData[]>([]);
  const [activeTab, setActiveTab] = useState<'brand' | 'blocks' | 'details' | 'install'>('brand');
  const [viewerRole, setViewerRole] = useState<string>('owner');
  const [permissions, setPermissions] = useState<OrgPermissions>({
    employeesCanEditBrand: false,
    employeesCanEditPromoBlocks: false,
  });
  const [promoBlocksEditable, setPromoBlocksEditable] = useState(true);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [profile, setProfile] = useState<SignatureProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailMessage, setGmailMessage] = useState<string | null>(null);
  const [gmailApplyToReplies, setGmailApplyToReplies] = useState(true);
  const [tailnoteLoginEmail, setTailnoteLoginEmail] = useState('');
  /** Server-rendered HTML with signed tracking URLs when org flag is on. */
  const [trackedHtml, setTrackedHtml] = useState<string | null>(null);
  /** Bumps after mount so signature HTML re-renders with real `window` origin (SSR memo used localhost). */
  const [assetOriginNonce, setAssetOriginNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, tRes, gRes, pRes] = await Promise.all([
        fetch('/api/dashboard/organization', { credentials: 'include' }),
        fetch('/api/dashboard/templates', { credentials: 'include' }),
        fetch('/api/integrations/gmail/status', { credentials: 'include' }),
        fetch('/api/dashboard/me/signature-profile', { credentials: 'include' }),
      ]);
      const oJson = await oRes.json();
      const tJson = await tRes.json();
      const gJson = await gRes.json().catch(() => ({}));
      const pJson = await pRes.json().catch(() => ({}));
      if (typeof oJson.viewer?.role === 'string') {
        setViewerRole(oJson.viewer.role);
      }
      if (typeof oJson.viewer?.email === 'string') {
        setTailnoteLoginEmail(oJson.viewer.email);
      }
      if (oJson.permissions && typeof oJson.permissions === 'object') {
        const p = oJson.permissions as OrgPermissions;
        setPermissions({
          employeesCanEditBrand: Boolean(p.employeesCanEditBrand),
          employeesCanEditPromoBlocks: Boolean(p.employeesCanEditPromoBlocks),
        });
      } else if (oJson.organization) {
        const o = oJson.organization as OrgResponse;
        setPermissions({
          employeesCanEditBrand: o.employeesCanEditBrand === true,
          employeesCanEditPromoBlocks: o.employeesCanEditPromoBlocks === true,
        });
      }
      if (oJson.organization) {
        const o = oJson.organization as OrgResponse;
        setOrg(o);
        setOrgName(String(o.name || ''));
      }
      if (typeof pJson.promoBlocksEditable === 'boolean') {
        setPromoBlocksEditable(pJson.promoBlocksEditable);
      }
      const list: TemplateRow[] = tJson.templates || [];
      setTemplates(list);
      let savedTemplateId: string | undefined;
      if (pJson.profile && typeof pJson.profile === 'object') {
        const tid = (pJson.profile as { templateId?: string }).templateId;
        if (typeof tid === 'string' && tid && list.some((t) => t._id === tid)) {
          savedTemplateId = tid;
        }
      }
      const defaultRow = list.find((t) => t.presetId === 'default');
      const pick = savedTemplateId
        ? list.find((t) => t._id === savedTemplateId) ?? defaultRow ?? list[0]
        : defaultRow ?? list[0];
      if (pick) setSelectedTemplateId(pick._id);
      const gmailEmailFromApi = String(gJson.googleEmail || '').trim();
      const gmailLinkedFromApi = Boolean(gJson.connected && gmailEmailFromApi);
      if (gmailLinkedFromApi) {
        setGmailConnected(true);
        setGmailEmail(gmailEmailFromApi);
        setGmailApplyToReplies(gJson.applyToReplies !== false);
      } else {
        setGmailConnected(false);
        setGmailEmail('');
        setGmailApplyToReplies(true);
        if (gJson.stale) {
          setGmailMessage('Previous Gmail link was incomplete. Connect again to link this Tailnote login.');
        }
      }
      if (pJson.profile && typeof pJson.profile === 'object') {
        const sp = pJson.profile as Partial<SignatureProfile>;
        setProfile({
          ...defaultProfile,
          firstName: typeof sp.firstName === 'string' ? sp.firstName : '',
          lastName: typeof sp.lastName === 'string' ? sp.lastName : '',
          title: typeof sp.title === 'string' ? sp.title : '',
          email: typeof sp.email === 'string' ? sp.email : '',
          officePhone: typeof sp.officePhone === 'string' ? sp.officePhone : '',
          mobilePhone: typeof sp.mobilePhone === 'string' ? sp.mobilePhone : '',
        });
        if ((sp as any).contentBlocks) {
          setContentBlocks((sp as any).contentBlocks);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = viewerRole === 'owner';
  const isMember = viewerRole === 'member';
  const canSeeBrandTab = !isMember || permissions.employeesCanEditBrand;
  const canSeeBlocksTab = !isMember || permissions.employeesCanEditPromoBlocks;

  useEffect(() => {
    if (loading) return;
    if (isMember) {
      if (activeTab === 'brand' && !canSeeBrandTab) setActiveTab('details');
      if (activeTab === 'blocks' && !canSeeBlocksTab) setActiveTab('details');
      if (!canSeeBrandTab && !canSeeBlocksTab && activeTab !== 'install') setActiveTab('details');
    }
  }, [loading, isMember, canSeeBrandTab, canSeeBlocksTab, activeTab]);

  useLayoutEffect(() => {
    setAssetOriginNonce(1);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const gmail = sp.get('gmail');
    const msg = sp.get('message');
    const tab = sp.get('tab');
    if (tab === 'install') {
      setActiveTab('install');
    }
    if (gmail === 'connected') {
      setMessage('Gmail connected. You can apply your signature below.');
      load();
    } else if (gmail === 'error' && msg) {
      setMessage(`Gmail: ${decodeURIComponent(msg)}`);
    }
    if (gmail || tab) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [load]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const brand = useMemo(() => orgToBrand(org ?? {}, orgName), [org, orgName]);

  const engineTemplate: SignatureTemplate | null = useMemo(() => {
    if (!selectedTemplate) return null;
    return engineTemplateFromStoredConfig({
      templateId: selectedTemplate._id,
      name: selectedTemplate.name,
      presetId: selectedTemplate.presetId,
      includeAnimationSlot: shouldIncludeSignatureAnimation(
        {
          plan: org?.plan === 'pro' ? 'pro' : org?.plan === 'basic' ? 'basic' : 'none',
          subscriptionStatus:
            (org?.subscriptionStatus as 'none' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete') ??
            'none',
        },
        { includeAnimationSlot: Boolean(selectedTemplate.includeAnimationSlot) }
      ),
    });
  }, [selectedTemplate, org?.plan, org?.subscriptionStatus]);

  const html = useMemo(() => {
    if (!engineTemplate) return '';
    return renderSignature({
      profile,
      brand: { ...brand, contentBlocks },
      template: engineTemplate,
      publicSiteOrigin: getSignatureAssetOrigin(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- assetOriginNonce forces post-mount recompute so preview URLs use window origin, not SSR fallback
  }, [profile, brand, engineTemplate, assetOriginNonce]);

  const contentBlocksHash = useMemo(() => JSON.stringify(contentBlocks), [contentBlocks]);

  useEffect(() => {
    if (!org?.signatureClickTrackingEnabled || !selectedTemplateId || !engineTemplate) {
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
              templateId: selectedTemplateId,
              profile: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                title: profile.title,
                email: profile.email,
                officePhone: profile.officePhone ?? '',
                mobilePhone: profile.mobilePhone ?? '',
                contentBlocks,
              },
              brandOverride: {
                fontFamily: brand.fontFamily,
                primaryColor: brand.primaryColor,
                secondaryColor: brand.secondaryColor,
                logoUrl: brand.logoUrl,
                logoShape: brand.logoShape,
                logoLink: brand.logoLink,
                website: brand.website,
                companyName: brand.companyName,
                socialLinks: brand.socialLinks,
                address: brand.address,
                state: brand.state,
                zip: brand.zip,
                animation: brand.animation,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we use granular sub-field deps and a JSON hash for contentBlocks to drive precise refetches
  }, [
    org?.signatureClickTrackingEnabled,
    selectedTemplateId,
    profile.firstName,
    profile.lastName,
    profile.title,
    profile.email,
    profile.officePhone,
    profile.mobilePhone,
    brand.companyName,
    brand.website,
    brand.logoUrl,
    brand.logoShape,
    brand.logoLink,
    brand.primaryColor,
    brand.secondaryColor,
    brand.fontFamily,
    brand.socialLinks?.linkedin,
    brand.socialLinks?.facebook,
    brand.socialLinks?.instagram,
    brand.socialLinks?.reddit,
    brand.socialLinks?.discord,
    brand.address,
    brand.state,
    brand.zip,
    brand.animation?.enabled,
    brand.animation?.gifUrl,
    org?.plan,
    engineTemplate,
    assetOriginNonce,
    contentBlocksHash,
  ]);

  const previewHtml = trackedHtml ?? html;

  const trackingForGmail = Boolean(org?.signatureClickTrackingEnabled && trackedHtml);
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
    Boolean(profile.firstName.trim() && profile.lastName.trim() && profile.email.trim() && engineTemplate);

  const gmailLinked = gmailConnected && Boolean(gmailEmail.trim());

  const patchSignatureProfile = async (opts?: { includeBlocks?: boolean; includeTemplate?: boolean }) => {
    const includeBlocks = opts?.includeBlocks === true;
    const includeTemplate = opts?.includeTemplate === true;
    const body: Record<string, unknown> = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      title: profile.title,
      email: profile.email,
      officePhone: profile.officePhone ?? '',
      mobilePhone: profile.mobilePhone ?? '',
    };
    if (includeBlocks && promoBlocksEditable) {
      body.contentBlocks = contentBlocks;
    }
    if (includeTemplate && promoBlocksEditable && selectedTemplateId) {
      body.templateId = selectedTemplateId;
    }
    return fetch('/api/dashboard/me/signature-profile', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const saveEmployeePermission = async (
    field: 'employeesCanEditBrand' | 'employeesCanEditPromoBlocks',
    value: boolean
  ) => {
    if (!org || !isOwner) return;
    setPermissionSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/dashboard/organization', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof j.error === 'string' ? j.error : 'Could not update employee permissions');
        return;
      }
      if (j.permissions) {
        setPermissions(j.permissions as OrgPermissions);
      }
      if (j.organization) {
        setOrg(j.organization as OrgResponse);
      }
    } finally {
      setPermissionSaving(false);
    }
  };

  const handleSaveBlocks = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      setProfileMessage('Save My Details (name and email) before saving blocks.');
      return;
    }
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await patchSignatureProfile({ includeBlocks: true, includeTemplate: true });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileMessage(typeof j.error === 'string' ? j.error : 'Could not save blocks');
        return;
      }
      if (j.profile && typeof j.profile === 'object' && Array.isArray((j.profile as { contentBlocks?: unknown }).contentBlocks)) {
        setContentBlocks((j.profile as { contentBlocks: ContentBlockData[] }).contentBlocks);
      }
      if (typeof j.promoBlocksEditable === 'boolean') {
        setPromoBlocksEditable(j.promoBlocksEditable);
      }
      setProfileMessage('Promotional blocks saved.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      setProfileMessage('First name, last name, and email are required to save.');
      return;
    }
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await patchSignatureProfile({ includeBlocks: false, includeTemplate: false });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileMessage(typeof j.error === 'string' ? j.error : 'Could not save your details');
        return;
      }
      if (j.profile && typeof j.profile === 'object') {
        const sp = j.profile as Partial<SignatureProfile> & { contentBlocks?: ContentBlockData[] };
        setProfile({
          ...defaultProfile,
          firstName: typeof sp.firstName === 'string' ? sp.firstName : '',
          lastName: typeof sp.lastName === 'string' ? sp.lastName : '',
          title: typeof sp.title === 'string' ? sp.title : '',
          email: typeof sp.email === 'string' ? sp.email : '',
          officePhone: typeof sp.officePhone === 'string' ? sp.officePhone : '',
          mobilePhone: typeof sp.mobilePhone === 'string' ? sp.mobilePhone : '',
        });
        if (Array.isArray(sp.contentBlocks)) {
          setContentBlocks(sp.contentBlocks);
        }
      }
      if (typeof j.promoBlocksEditable === 'boolean') {
        setPromoBlocksEditable(j.promoBlocksEditable);
      }
      setProfileMessage('Saved. We will pre-fill these fields next time you open Signature.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/dashboard/organization', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          companyName: orgName,
          website: org.website,
          logoUrl: org.logoUrl,
          logoShape: org.logoShape === 'circle' ? 'circle' : 'rectangle',
          logoLink: org.logoLink,
          primaryColor: org.primaryColor,
          secondaryColor: org.secondaryColor,
          fontFamily: org.fontFamily,
          socialLinks: org.socialLinks,
          address: org.address,
          state: org.state,
          zip: org.zip,
          animation: org.animation,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMessage(typeof j.error === 'string' ? j.error : 'Save failed');
        return;
      }
      const j = await res.json();
      if (j.organization) setOrg(j.organization as OrgResponse);

      if (profile.firstName.trim() && profile.lastName.trim() && profile.email.trim()) {
        const pRes = await patchSignatureProfile({ includeBlocks: promoBlocksEditable, includeTemplate: promoBlocksEditable });
        if (!pRes.ok) {
          const pj = await pRes.json().catch(() => ({}));
          setMessage(
            typeof pj.error === 'string'
              ? `Brand saved; profile/template: ${pj.error}`
              : 'Brand saved; could not save profile or template'
          );
          return;
        }
      }

      setMessage('Saved');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !org) return;
    setUploadingLogo(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/dashboard/organization/logo', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof j.error === 'string' ? j.error : 'Logo upload failed');
        return;
      }
      if (typeof j.url === 'string') {
        setOrg((o) => ({ ...(o || {}), logoUrl: j.url }));
        setMessage('Logo uploaded — click Save to persist with other brand fields, or Save now from the button below.');
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleApplyGmail = async () => {
    if (!gmailSourceHtml.trim() || gmailOverLimit || gmailPromosBlocked) return;
    setGmailBusy(true);
    setGmailMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/apply-signature', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: gmailSourceHtml, applyToReplies: gmailApplyToReplies }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGmailMessage(typeof j.error === 'string' ? j.error : 'Could not update Gmail signature');
        return;
      }
      const who = typeof j.sendAsEmail === 'string' ? j.sendAsEmail : 'your send-as address';
      let msg = `Gmail signature updated for ${who}. Gmail may simplify HTML.`;
      if (gmailApplyToReplies) {
        msg +=
          ' For replies and forwards, open Gmail Settings → General → Signature defaults and choose this signature under “For replies and forwards” if it does not apply automatically. See https://support.google.com/mail/answer/8395';
      }
      setGmailMessage(msg);
    } finally {
      setGmailBusy(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setGmailBusy(true);
    setGmailMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/disconnect', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        setGmailMessage('Could not disconnect Gmail');
        return;
      }
      setGmailConnected(false);
      setGmailEmail('');
      setGmailMessage('Gmail disconnected.');
    } finally {
      setGmailBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!org) {
    return <p className="text-sm text-muted-foreground">Create an organization to edit signature defaults.</p>;
  }

    return (
    <div className="grid lg:grid-cols-12 gap-8 items-start max-w-full min-w-0 pb-20">
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">
        <div className="flex gap-2 pb-2 overflow-x-auto border-b hide-scrollbar">
          {canSeeBrandTab ? (
            <button onClick={() => setActiveTab('brand')} className={`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'brand' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Brand</button>
          ) : null}
          {canSeeBlocksTab ? (
            <button onClick={() => setActiveTab('blocks')} className={`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'blocks' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Blocks</button>
          ) : null}
          <button onClick={() => setActiveTab('details')} className={`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'details' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>My Details</button>
          <button onClick={() => setActiveTab('install')} className={`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'install' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Install</button>
        </div>

        <div className="pt-2 min-w-0">
          {activeTab === 'brand' && (
            <Card>
          <CardHeader>
            <CardTitle>Organization brand</CardTitle>
            <CardDescription>These values feed the signature engine for every employee.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={org.website ?? ''}
                onChange={(e) => setOrg((o) => ({ ...(o || {}), website: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Address</p>
              <p className="text-xs text-muted-foreground">
                Optional. Shown on the Corporate and Professional templates when filled in.
              </p>
              <div className="space-y-2">
                <Label htmlFor="org-address">Street address</Label>
                <Input
                  id="org-address"
                  value={org.address ?? ''}
                  onChange={(e) => setOrg((o) => ({ ...(o || {}), address: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-state">State</Label>
                  <Input
                    id="org-state"
                    value={org.state ?? ''}
                    onChange={(e) => setOrg((o) => ({ ...(o || {}), state: e.target.value }))}
                    placeholder="TX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-zip">ZIP</Label>
                  <Input
                    id="org-zip"
                    value={org.zip ?? ''}
                    onChange={(e) => setOrg((o) => ({ ...(o || {}), zip: e.target.value }))}
                    placeholder="75201"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Social links</p>
              <p className="text-xs text-muted-foreground">
                Paste any profile URL and we&apos;ll detect the network and use the matching icon. LinkedIn, Facebook, Instagram, Reddit, and Discord are supported.
              </p>
              <SocialLinksEditor
                value={org.socialLinks}
                onChange={(next) => setOrg((o) => ({ ...(o || {}), socialLinks: next }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={org.logoShape !== 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrg((o) => ({ ...(o || {}), logoShape: 'rectangle' }))}
                >
                  Rectangle
                </Button>
                <Button
                  type="button"
                  variant={org.logoShape === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrg((o) => ({ ...(o || {}), logoShape: 'circle' }))}
                >
                  Circle
                </Button>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="w-full min-w-0 max-w-full sm:max-w-xs"
                  onChange={handleLogoFile}
                  disabled={uploadingLogo}
                />
                {uploadingLogo ? <span className="text-xs text-muted-foreground">Uploading…</span> : null}
                {org.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={org.logoUrl}
                    alt=""
                    className={
                      org.logoShape === 'circle'
                        ? 'h-12 w-12 shrink-0 object-cover border bg-white p-0.5 rounded-full'
                        : 'h-12 w-auto max-w-[120px] object-contain border rounded bg-white p-1'
                    }
                  />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!org.logoUrl}
                  onClick={() => setOrg((o) => ({ ...(o || {}), logoUrl: '' }))}
                >
                  Clear logo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload PNG, JPEG, WebP, or GIF up to 4 MB. Circular logos work best with a square
                headshot; some Outlook versions may show a square crop.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Logo link (optional)</Label>
              <Input
                value={org.logoLink ?? ''}
                onChange={(e) => setOrg((o) => ({ ...(o || {}), logoLink: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label>Primary color</Label>
              <PrimaryColorField
                value={org.primaryColor ?? ''}
                onChange={(primaryColor) => setOrg((o) => ({ ...(o || {}), primaryColor }))}
              />
              <p className="text-xs text-muted-foreground">
                Portfolio and Creator use this for the card background. Other templates use it for
                borders, headers, and link accents.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Secondary color</Label>
              <ColorField
                value={org.secondaryColor ?? ''}
                onChange={(secondaryColor) => setOrg((o) => ({ ...(o || {}), secondaryColor }))}
                placeholder="#E29578"
                pickerAriaLabel="Pick secondary color"
              />
              <p className="text-xs text-muted-foreground">
                Portfolio accents (role line, logo ring, network label, website button). Creator uses
                this for the left stripe when primary fills the card. Falls back to a lighter primary
                when empty.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Font</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={findFontByStack(org.fontFamily || 'Arial')?.stack || 'Arial'}
                onChange={(e) => setOrg((o) => ({ ...(o || {}), fontFamily: e.target.value }))}
              >
                {FONT_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.fonts.map((f) => (
                      <option key={f.id} value={f.stack} style={{ fontFamily: f.stack }}>
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Preview template</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            {isOwner ? (
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={permissions.employeesCanEditBrand}
                  disabled={permissionSaving}
                  onChange={(e) => void saveEmployeePermission('employeesCanEditBrand', e.target.checked)}
                />
                <span>Allow employees to edit brand</span>
              </label>
            ) : null}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </CardContent>
        </Card>
          )}
          {activeTab === 'blocks' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-lg font-medium">Promotional Blocks</h3>
                <p className="text-sm text-muted-foreground">
                  Blocks appear in a row beneath your signature on every template, so they stay readable on phone-sized inboxes.
                </p>
              </div>
              <ContentBlocksEditor value={contentBlocks} onChange={setContentBlocks} />
              {isOwner ? (
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={permissions.employeesCanEditPromoBlocks}
                    disabled={permissionSaving}
                    onChange={(e) =>
                      void saveEmployeePermission('employeesCanEditPromoBlocks', e.target.checked)
                    }
                  />
                  <span>Allow employees to edit promotional blocks</span>
                </label>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => void handleSaveBlocks()}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Blocks'}
                </Button>
                {profileMessage && <p className="text-sm text-muted-foreground">{profileMessage}</p>}
              </div>
            </div>
          )}
          {activeTab === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle>My Details</CardTitle>
                <CardDescription>Sample person for preview. Save your details so they persist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SignatureForm value={profile} onChange={setProfile} />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" disabled={savingProfile} onClick={() => void handleSaveProfile()}>
                    {savingProfile ? 'Saving…' : 'Save my details'}
                  </Button>
                  {profileMessage ? <p className="text-sm text-muted-foreground">{profileMessage}</p> : null}
                </div>
              </CardContent>
            </Card>
          )}
          {activeTab === 'install' && (
            <Card>
          <CardHeader>
            <CardTitle>Install to your inbox</CardTitle>
            <CardDescription>Gmail (OAuth) and Outlook (manual).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm font-medium">Gmail</p>
              {tailnoteLoginEmail ? (
                <p className="text-xs text-muted-foreground">
                  Tailnote login: <span className="font-medium text-foreground">{tailnoteLoginEmail}</span>
                  {gmailLinked
                    ? ` · Linked Gmail: ${gmailEmail}`
                    : ' · No Gmail linked for this login yet'}
                </p>
              ) : null}
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
                Gmail uses a stacked layout for promotional blocks, matching this preview. Copied HTML
                uses the full template layout for each mail client.
              </p>
              {gmailMessage ? <p className="text-xs text-muted-foreground">{gmailMessage}</p> : null}
              {gmailLinked ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Connected as {gmailEmail}. Gmail may rewrite HTML when saving.
                  </p>
                  <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
                    <input
                      id="gmail-apply-replies"
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-input"
                      checked={gmailApplyToReplies}
                      onChange={(e) => setGmailApplyToReplies(e.target.checked)}
                      disabled={gmailBusy}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="gmail-apply-replies" className="cursor-pointer font-normal leading-snug">
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
                      onClick={handleApplyGmail}
                    >
                      {gmailBusy ? 'Applying…' : 'Apply signature to Gmail'}
                    </Button>
                    <Button type="button" variant="outline" disabled={gmailBusy} onClick={handleDisconnectGmail}>
                      Disconnect Gmail
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Connect once, then apply your signature to Gmail send-as.</p>
                  <Button type="button" variant="secondary" asChild>
                    <a href="/api/integrations/gmail/start">Connect Gmail</a>
                  </Button>
                </>
              )}
            </div>
            <OutlookInstallHelp />
          </CardContent>
        </Card>
          )}
        </div>
      </div>

      <LivePreviewStickyColumn className="lg:col-span-7 xl:col-span-8">
        <Card className="shadow-xl border-primary/10">
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>See your changes in real time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 max-w-full min-w-0 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
          <div className="min-w-0">
            <SignaturePreviewFrame
              html={previewHtml}
              variant="mobile"
              mobileFrameWidth={mobileFrameWidthForLayout(engineTemplate?.layout)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <CopySignatureButton html={previewHtml} disabled={!canCopy} />
            <CopyRichTextButton html={previewHtml} disabled={!canCopy} />
            <Button
              type="button"
              variant="outline"
              disabled={!canCopy}
              onClick={() => downloadHtml('tailnote-signature.html', previewHtml)}
            >
              Download HTML
            </Button>
          </div>
        </CardContent>
      </Card>
      </LivePreviewStickyColumn>
    </div>
  );
}