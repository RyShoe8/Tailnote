'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Move } from 'lucide-react';
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
import { useHydratedContentBlocks } from '@/components/signature/useHydratedContentBlocks';
import { SocialLinksEditor } from '@/components/signature/SocialLinksEditor';
import type { ContentBlockData } from 'emailsignature-engine';
import { SignatureForm } from '@/components/signature/SignatureForm';
import {
  SignaturePreviewFrame,
  mobileFrameWidthForLayout,
} from '@/components/signature/SignaturePreviewFrame';
import { LivePreviewStickyColumn } from '@/components/signature/LivePreviewStickyColumn';
import {
  MobileSignaturePaneBar,
  type MobileSignaturePane,
} from '@/components/signature/MobileSignaturePaneBar';
import { useIsLgUp, useIsMobileInstallContext } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { SignatureInstallPanel } from '@/components/signature/SignatureInstallPanel';
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';
import { shouldIncludeSignatureAnimation } from '@/lib/billing/entitlements';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';
import { hasAnalytics, hasBrandingRemoval } from '@/lib/billing/subscriptionAccess';
import { SignatureBimiTab } from '@/components/dashboard/SignatureBimiTab';
import { appendSignatureAttributionIfNeeded } from '@/lib/signatureAttribution';
import { PreviewDropOverlay } from '@/components/signature/PreviewDropOverlay';

function DraggableBrandHandle({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="cursor-grab text-muted-foreground hover:text-primary active:cursor-grabbing transition-colors"
      title="Drag to preview to reposition"
    >
      <Move className="h-3.5 w-3.5" />
    </div>
  );
}

type OrgResponse = {
  companyName?: string;
  website?: string;
  logoUrl?: string;
  logoHeightPx?: number;
  logoShape?: 'rectangle' | 'circle';
  logoLink?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  socialLinks?: { linkedin?: string; facebook?: string; instagram?: string; reddit?: string; discord?: string; bluesky?: string; youtube?: string };
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  animation?: { enabled?: boolean; gifUrl?: string };
  name?: string;
  plan?: string;
  subscriptionStatus?: string;
  signatureClickTrackingEnabled?: boolean;
  employeesCanEditBrand?: boolean;
  employeesCanEditPromoBlocks?: boolean;
  brandOrder?: string[];
  hiddenFields?: string[];
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
    ...(typeof org.logoHeightPx === 'number' && org.logoHeightPx > 0
      ? { logoHeightPx: org.logoHeightPx }
      : {}),
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
      bluesky: sl.bluesky?.trim(),
      youtube: sl.youtube?.trim(),
    },
    address: org.address?.trim(),
    city: org.city?.trim(),
    state: org.state?.trim(),
    zip: org.zip?.trim(),
    animation: {
      enabled: Boolean(org.animation?.enabled),
      gifUrl: org.animation?.gifUrl?.trim() ?? '',
    },
    brandOrder: org.brandOrder ?? [],
    hiddenFields: org.hiddenFields ?? [],
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
  const [activeTab, setActiveTab] = useState<'brand' | 'bimi' | 'blocks' | 'details' | 'install'>('details');
  const [mobilePane, setMobilePane] = useState<MobileSignaturePane>('edit');
  const isLgUp = useIsLgUp();
  const isMobileInstall = useIsMobileInstallContext();

  const toggleBrandHidden = (field: string) => {
    setOrg((o) => {
      if (!o) return o;
      const hidden = new Set(o.hiddenFields || []);
      if (hidden.has(field)) hidden.delete(field);
      else hidden.add(field);
      return { ...o, hiddenFields: Array.from(hidden) };
    });
  };
  const isBrandHidden = (field: string) => org?.hiddenFields?.includes(field) ?? false;

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  /** Server-rendered HTML with signed tracking URLs when org flag is on. */
  const [trackedHtml, setTrackedHtml] = useState<string | null>(null);
  /** Bumps after mount so signature HTML re-renders with real `window` origin (SSR memo used localhost). */
  const [assetOriginNonce, setAssetOriginNonce] = useState(0);

  // ── Drag-to-preview state ──
  const [isDraggingToPreview, setIsDraggingToPreview] = useState(false);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  const handlePreviewDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = String(event.active.id);
    setIsDraggingToPreview(true);
    setDraggedFieldId(fieldId);
  }, []);

  const handlePreviewDragEnd = useCallback(() => {
    setIsDraggingToPreview(false);
    setDraggedFieldId(null);
  }, []);

  const handleContactReorder = useCallback(
    (fieldId: string, insertAfterField: string | null) => {
      const defaultOrder = ['companyName', 'email', 'website', 'officePhone', 'mobilePhone'];
      const currentOrder = profile.contactDisplayOrder?.length
        ? [...profile.contactDisplayOrder]
        : [...defaultOrder];

      // Remove field from its current position
      const curIdx = currentOrder.indexOf(fieldId);
      if (curIdx !== -1) currentOrder.splice(curIdx, 1);

      if (insertAfterField === null) {
        // Insert at the beginning
        currentOrder.unshift(fieldId);
      } else {
        const afterIdx = currentOrder.indexOf(insertAfterField);
        if (afterIdx !== -1) {
          currentOrder.splice(afterIdx + 1, 0, fieldId);
        } else {
          currentOrder.push(fieldId);
        }
      }

      setProfile((p) => ({ ...p, contactDisplayOrder: currentOrder }));
      // Clear drag state
      setIsDraggingToPreview(false);
      setDraggedFieldId(null);
    },
    [profile.contactDisplayOrder]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      handlePreviewDragEnd();
      const { active, over } = event;
      if (!over) return;
      
      const activeId = String(active.id);
      const overId = String(over.id);

      // Dropped on a preview zone
      if (overId.startsWith('zone-')) {
        const zone = over.data.current;
        if (zone) {
          handleContactReorder(activeId, zone.insertAfterField);
        }
        return;
      }

      // Dropped on another form field (reordering details list)
      if (activeId !== overId) {
        setProfile((p) => {
          const defaultOrder = ['avatarUrl', 'firstName', 'lastName', 'title', 'email', 'officePhone', 'mobilePhone'];
          const currentOrder = p.detailOrder?.length ? p.detailOrder : defaultOrder;
          // Ensure all fields are present
          const activeItems = [...new Set([...currentOrder, ...defaultOrder])].filter((id) => defaultOrder.includes(id));
          
          const oldIndex = activeItems.indexOf(activeId);
          const newIndex = activeItems.indexOf(overId);
          if (oldIndex !== -1 && newIndex !== -1) {
            return { ...p, detailOrder: arrayMove(activeItems, oldIndex, newIndex) };
          }
          return p;
        });
      }
    },
    [handleContactReorder, handlePreviewDragEnd]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [oRes, tRes, pRes] = await Promise.all([
        fetch('/api/dashboard/organization', { credentials: 'include' }),
        fetch('/api/dashboard/templates', { credentials: 'include' }),
        fetch('/api/dashboard/me/signature-profile', { credentials: 'include' }),
      ]);
      const oJson = await oRes.json().catch(() => ({}));
      const tJson = await tRes.json().catch(() => ({}));
      const pJson = await pRes.json().catch(() => ({}));

      if (!oRes.ok) {
        const msg =
          typeof oJson.error === 'string'
            ? oJson.error
            : 'Could not load organization settings';
        setLoadError(msg);
        setOrg(null);
        return;
      }

      if (typeof oJson.viewer?.role === 'string') {
        setViewerRole(oJson.viewer.role);
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
      if (!oJson.organization) {
        setOrg(null);
        return;
      }

      const o = oJson.organization as OrgResponse;
      setOrg(o);
      setOrgName(String(o.name || ''));

      if (!tRes.ok) {
        setLoadError(
          typeof tJson.error === 'string' ? tJson.error : 'Could not load signature layouts'
        );
        return;
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
  const isAdmin = viewerRole === 'admin';
  const isMember = viewerRole === 'member';
  const canSeeBrandTab = !isMember || permissions.employeesCanEditBrand;
  const canSeeBlocksTab = !isMember || permissions.employeesCanEditPromoBlocks;
  const canUploadOrgLogo = isOwner || isAdmin;
  const initialTabHandled = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (isMember) {
      if (activeTab === 'brand' && !canSeeBrandTab) setActiveTab('details');
      if (activeTab === 'blocks' && !canSeeBlocksTab) setActiveTab('details');
    }
  }, [loading, isMember, canSeeBrandTab, canSeeBlocksTab, activeTab]);

  useLayoutEffect(() => {
    setAssetOriginNonce(1);
  }, []);

  useEffect(() => {
    if (loading || typeof window === 'undefined' || initialTabHandled.current) return;
    initialTabHandled.current = true;
    const sp = new URLSearchParams(window.location.search);
    const tab = sp.get('tab');
    if (tab) {
      if (tab === 'install') setActiveTab('install');
      else if (tab === 'brand' && canSeeBrandTab) setActiveTab('brand');
      else if (tab === 'bimi') setActiveTab('bimi');
      else if (tab === 'blocks' && canSeeBlocksTab) setActiveTab('blocks');
      else if (tab === 'details') setActiveTab('details');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (!isMember || canSeeBrandTab) setActiveTab('brand');
  }, [loading, canSeeBrandTab, canSeeBlocksTab, isMember]);

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
          plan: org?.plan ?? 'free',
          subscriptionStatus:
            (org?.subscriptionStatus as
              | 'none'
              | 'active'
              | 'trialing'
              | 'past_due'
              | 'canceled'
              | 'incomplete'
              | undefined) ?? 'none',
        },
        { includeAnimationSlot: Boolean(selectedTemplate.includeAnimationSlot) }
      ),
    });
  }, [selectedTemplate, org?.plan, org?.subscriptionStatus]);

  const hydratedContentBlocks = useHydratedContentBlocks(contentBlocks);

  const html = useMemo(() => {
    if (!engineTemplate) return '';
    const filteredProfile = { ...profile };
    if (profile.hiddenFields?.length) {
      for (const field of profile.hiddenFields) {
        (filteredProfile as any)[field] = '';
      }
    }
    const filteredBrand = { ...brand, contentBlocks: hydratedContentBlocks };
    if (brand.hiddenFields?.length) {
      for (const field of brand.hiddenFields) {
        (filteredBrand as any)[field] = '';
      }
    }
    const rendered = renderSignature({
      profile: filteredProfile,
      brand: filteredBrand,
      template: engineTemplate,
      publicSiteOrigin: getSignatureAssetOrigin(),
    });
    return appendSignatureAttributionIfNeeded({
      html: rendered,
      org: org
        ? {
            plan: org.plan,
            subscriptionStatus: org.subscriptionStatus,
          }
        : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- assetOriginNonce forces post-mount recompute so preview URLs use window origin, not SSR fallback
  }, [profile, brand, engineTemplate, assetOriginNonce, hydratedContentBlocks]);

  const contentBlocksHash = useMemo(() => JSON.stringify(contentBlocks), [contentBlocks]);

  useEffect(() => {
    if (
      !org?.signatureClickTrackingEnabled ||
      !hasAnalytics({
        plan: org?.plan,
        subscriptionStatus: org?.subscriptionStatus,
      }) ||
      !selectedTemplateId ||
      !engineTemplate
    ) {
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
          const filteredProfile = { ...profile };
          if (profile.hiddenFields?.length) {
            for (const field of profile.hiddenFields) {
              (filteredProfile as any)[field] = '';
            }
          }
          const res = await fetch('/api/dashboard/me/signature-html', {
            method: 'POST',
            credentials: 'include',
            signal: ac.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateId: selectedTemplateId,
              profile: {
                firstName: filteredProfile.firstName,
                lastName: filteredProfile.lastName,
                title: filteredProfile.title,
                email: filteredProfile.email,
                officePhone: filteredProfile.officePhone ?? '',
                mobilePhone: filteredProfile.mobilePhone ?? '',
                avatarUrl: filteredProfile.avatarUrl ?? '',
                contentBlocks,
              },
              brandOverride: {
                fontFamily: brand.hiddenFields?.includes('fontFamily') ? '' : brand.fontFamily,
                primaryColor: brand.hiddenFields?.includes('primaryColor') ? '' : brand.primaryColor,
                secondaryColor: brand.hiddenFields?.includes('secondaryColor') ? '' : brand.secondaryColor,
                logoUrl: brand.hiddenFields?.includes('logoUrl') ? '' : brand.logoUrl,
                logoShape: brand.hiddenFields?.includes('logoShape') ? '' : brand.logoShape,
                logoLink: brand.hiddenFields?.includes('logoLink') ? '' : brand.logoLink,
                website: brand.hiddenFields?.includes('website') ? '' : brand.website,
                companyName: brand.hiddenFields?.includes('companyName') ? '' : brand.companyName,
                socialLinks: brand.hiddenFields?.includes('socialLinks') ? {} : brand.socialLinks,
                address: brand.hiddenFields?.includes('address') ? '' : brand.address,
                city: brand.hiddenFields?.includes('city') ? '' : brand.city,
                state: brand.hiddenFields?.includes('state') ? '' : brand.state,
                zip: brand.hiddenFields?.includes('zip') ? '' : brand.zip,
                animation: brand.hiddenFields?.includes('animation') ? undefined : brand.animation,
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
    brand.socialLinks?.bluesky,
    brand.socialLinks?.youtube,
    brand.address,
    brand.city,
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

  const canCopy = Boolean(
    profile.firstName.trim() && profile.lastName.trim() && profile.email.trim() && engineTemplate
  );
  const showUpgradeNotice = !hasBrandingRemoval({
    plan: org?.plan,
    subscriptionStatus: org?.subscriptionStatus,
  });

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
    if (!org || loading) return;
    setSaving(true);
    setMessage(null);
    setMessageIsError(false);
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
          city: org.city,
          state: org.state,
          zip: org.zip,
          animation: org.animation,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = typeof j.error === 'string' ? j.error : 'Save failed';
        setMessage(err);
        setMessageIsError(true);
        return;
      }
      if (j.organization) setOrg(j.organization as OrgResponse);
      if (typeof j.logoUrlWarning === 'string') {
        setMessage(j.logoUrlWarning);
        setMessageIsError(true);
      }

      if (profile.firstName.trim() && profile.lastName.trim() && profile.email.trim()) {
        const pRes = await patchSignatureProfile({ includeBlocks: promoBlocksEditable, includeTemplate: promoBlocksEditable });
        if (!pRes.ok) {
          const pj = await pRes.json().catch(() => ({}));
          setMessage(
            typeof pj.error === 'string'
              ? `Brand saved; profile/template: ${pj.error}`
              : 'Brand saved; could not save profile or template'
          );
          setMessageIsError(true);
          return;
        }
      }

      if (!j.logoUrlWarning) {
        setMessage('Saved');
        setMessageIsError(false);
      }
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
    setMessageIsError(false);
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
        setMessageIsError(true);
        return;
      }
      if (typeof j.url === 'string') {
        setOrg((o) => ({
          ...(o || {}),
          logoUrl: j.url,
          ...(typeof j.logoHeightPx === 'number' ? { logoHeightPx: j.logoHeightPx } : {}),
        }));
        setMessage('Logo saved.');
        setMessageIsError(false);
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!org) {
    return <p className="text-sm text-muted-foreground">Create an organization to edit signature defaults.</p>;
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Setting up signature layouts for your organization…
        </p>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

    const showEditColumn = isLgUp || mobilePane === 'edit';
    const showPreviewColumn = isLgUp || mobilePane === 'preview';

    return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handlePreviewDragStart} onDragEnd={handleDragEnd}>
      <div
        className={cn(
          'grid lg:grid-cols-12 gap-8 items-start max-w-full min-w-0',
          !isLgUp && 'pb-24'
        )}
      >
        {showEditColumn ? (
      <div className="lg:col-span-5 xl:col-span-4 space-y-6 min-w-0">
        {showUpgradeNotice ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            Upgrade to remove Tailnote branding and unlock analytics.{' '}
            <Link href={DASHBOARD_UPGRADE_HREF} className="underline underline-offset-4">
              View upgrade options
            </Link>
            .
          </div>
        ) : null}
        <div className="flex gap-2 pb-2 overflow-x-auto border-b hide-scrollbar">
          {canSeeBrandTab ? (
            <button onClick={() => setActiveTab('brand')} className={`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'brand' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Brand</button>
          ) : null}
          <button onClick={() => setActiveTab('bimi')} className={`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'bimi' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Brand logo</button>
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
            <div className="mb-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                These values feed the signature engine for every employee. Drag fields to reorder them in your signature.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLgUp && <DraggableBrandHandle id="companyName" />}
                  <Label className="cursor-pointer" onClick={() => toggleBrandHidden('companyName')}>Organization name</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 text-xs font-medium ${isBrandHidden('companyName') ? 'text-muted-foreground' : 'text-primary'}`}
                  onClick={() => toggleBrandHidden('companyName')}
                >
                  {isBrandHidden('companyName') ? 'Show' : 'Hide'}
                </Button>
              </div>
              {!isBrandHidden('companyName') && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLgUp && <DraggableBrandHandle id="website" />}
                  <Label className="cursor-pointer" onClick={() => toggleBrandHidden('website')}>Website</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 text-xs font-medium ${isBrandHidden('website') ? 'text-muted-foreground' : 'text-primary'}`}
                  onClick={() => toggleBrandHidden('website')}
                >
                  {isBrandHidden('website') ? 'Show' : 'Hide'}
                </Button>
              </div>
              {!isBrandHidden('website') && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <Input
                    value={org.website ?? ''}
                    onChange={(e) => setOrg((o) => ({ ...(o || {}), website: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium cursor-pointer" onClick={() => toggleBrandHidden('address')}>Address</p>
                  <p className="text-xs text-muted-foreground">
                    Optional. Shown on the Corporate and Professional layouts when filled in.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 text-xs font-medium ${isBrandHidden('address') ? 'text-muted-foreground' : 'text-primary'}`}
                  onClick={() => toggleBrandHidden('address')}
                >
                  {isBrandHidden('address') ? 'Show' : 'Hide'}
                </Button>
              </div>
              {!isBrandHidden('address') && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="org-address">Street address</Label>
                    <Input
                      id="org-address"
                      value={org.address ?? ''}
                      onChange={(e) => setOrg((o) => ({ ...(o || {}), address: e.target.value }))}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-city">City</Label>
                    <Input
                      id="org-city"
                      value={org.city ?? ''}
                      onChange={(e) => setOrg((o) => ({ ...(o || {}), city: e.target.value }))}
                      placeholder="Dallas"
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
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium cursor-pointer" onClick={() => toggleBrandHidden('socialLinks')}>Social links</p>
                  <p className="text-xs text-muted-foreground">
                    Paste any profile URL and we&apos;ll detect the network.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 text-xs font-medium ${isBrandHidden('socialLinks') ? 'text-muted-foreground' : 'text-primary'}`}
                  onClick={() => toggleBrandHidden('socialLinks')}
                >
                  {isBrandHidden('socialLinks') ? 'Show' : 'Hide'}
                </Button>
              </div>
              {!isBrandHidden('socialLinks') && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <SocialLinksEditor
                    value={org.socialLinks}
                    onChange={(next) => setOrg((o) => ({ ...(o || {}), socialLinks: next }))}
                  />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer" onClick={() => toggleBrandHidden('logoUrl')}>Logo</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 text-xs font-medium ${isBrandHidden('logoUrl') ? 'text-muted-foreground' : 'text-primary'}`}
                  onClick={() => toggleBrandHidden('logoUrl')}
                >
                  {isBrandHidden('logoUrl') ? 'Show' : 'Hide'}
                </Button>
              </div>
              {!isBrandHidden('logoUrl') && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
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
                    {canUploadOrgLogo ? (
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="w-full min-w-0 max-w-full sm:max-w-xs"
                        onChange={handleLogoFile}
                        disabled={uploadingLogo}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Signature logo upload is managed by your organization owner or admin.
                      </p>
                    )}
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
              )}
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
                Portfolio and Creator use this for the card background. Other layouts use it for
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
              <Label>Signature layout</Label>
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
            {message ? (
              <p
                className={`text-sm ${messageIsError ? 'text-destructive' : 'text-muted-foreground'}`}
                role={messageIsError ? 'alert' : undefined}
              >
                {message}
              </p>
            ) : null}
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
            <Button onClick={handleSave} disabled={saving || loading || !org}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </CardContent>
        </Card>
          )}
          {activeTab === 'bimi' && (
            <SignatureBimiTab canManageBimiLogo={isOwner || isAdmin} />
          )}
          {activeTab === 'blocks' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-lg font-medium">Promotional Blocks</h3>
                <p className="text-sm text-muted-foreground">
                  Blocks appear in a row beneath your signature on every layout, so they stay readable on phone-sized inboxes.
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
                <SignatureForm
                  value={profile}
                  onChange={setProfile}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" disabled={savingProfile} onClick={() => void handleSaveProfile()}>
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
                <CardTitle>Install your signature</CardTitle>
                <CardDescription>
                  Copy for Gmail or Outlook, install on Apple Mail, or download HTML — takes about a minute.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignatureInstallPanel
                  html={previewHtml}
                  disabled={!canCopy}
                  installContext={{ templateId: selectedTemplateId }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      ) : null}

      {showPreviewColumn ? (
      <LivePreviewStickyColumn className="lg:col-span-7 xl:col-span-8">
        <Card className="shadow-xl border-primary/10 max-w-full min-w-0">
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>
            See your changes in real time.
            {showUpgradeNotice ? ' Free plans include Powered by Tailnote attribution.' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 max-w-full min-w-0 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
          <div
            ref={previewWrapperRef}
            className="min-w-0 overflow-hidden select-all [&_.signature-email-preview]:select-all"
            style={{ position: 'relative' }}
          >
            <SignaturePreviewFrame
              html={previewHtml}
              variant="mobile"
              appearance="flat"
              animationKey={org?.fontFamily}
              mobileFrameWidth={mobileFrameWidthForLayout(engineTemplate?.layout)}
            />
            {isDraggingToPreview && isLgUp && (
              <PreviewDropOverlay
                wrapperRef={previewWrapperRef}
                isDragging={isDraggingToPreview}
                draggedFieldId={draggedFieldId}
              />
            )}
          </div>
        </CardContent>
      </Card>
      </LivePreviewStickyColumn>
      ) : null}

      {!isLgUp ? (
        <MobileSignaturePaneBar pane={mobilePane} onPaneChange={setMobilePane} />
      ) : null}
    </div>
    </DndContext>
  );
}