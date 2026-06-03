import type { ContentBlockData } from 'emailsignature-engine';
import type { SignatureClickKind } from '@/models/SignatureClickEvent';
import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { AUTH_USER_COLLECTION } from '@/lib/auth/platformAdmin';
import { EmployeeModel } from '@/models/Employee';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';

const PROMO_KINDS: SignatureClickKind[] = ['content_block_1', 'content_block_2'];

export type PromoBlockKind = 'content_block_1' | 'content_block_2';

export type PromoBlockAnalyticsSlot = {
  kind: PromoBlockKind;
  label: string;
  description: string;
};

function isContentBlockData(b: unknown): b is ContentBlockData {
  return typeof b === 'object' && b !== null && 'type' in b;
}

function isPromoBlockEnabled(block: ContentBlockData): boolean {
  return block.enabled === true;
}

function firstListItemTitle(block: ContentBlockData): string {
  if (!Array.isArray(block.listItems)) return '';
  for (const item of block.listItems) {
    const t = item?.title?.trim();
    if (t) return t;
  }
  return '';
}

export function contentBlockDisplayLabel(block: ContentBlockData, slotIndex: number): string {
  const title =
    block.listTitle?.trim() ||
    block.callTitle?.trim() ||
    block.customTitle?.trim() ||
    firstListItemTitle(block) ||
    '';
  if (title) return title;

  switch (block.type) {
    case 'book_a_call':
      return 'Book a call';
    case 'latest_blogs':
      return 'Latest blogs';
    case 'image':
      return 'Image promo';
    case 'list':
      return 'Promo list';
    case 'custom':
      return 'Promo block';
    default:
      return `Promo block ${slotIndex + 1}`;
  }
}

export function contentBlockClickDescription(block: ContentBlockData): string {
  switch (block.type) {
    case 'book_a_call':
      return 'Book-a-call button and link clicks';
    case 'latest_blogs':
      return 'Blog item link clicks in this block';
    case 'image':
      return 'Promo image link clicks';
    case 'list':
    case 'custom':
      return 'List item and promo link clicks in this block';
    default:
      return 'Promotional link clicks in this block';
  }
}

function defaultPromoSlotMeta(index: number): Pick<PromoBlockAnalyticsSlot, 'label' | 'description'> {
  return {
    label: `Promo block ${index + 1}`,
    description: 'Promotional link clicks in this block',
  };
}

function isGenericPromoLabel(label: string, index: number): boolean {
  const n = index + 1;
  return (
    label === `Promo block ${n}` ||
    label === 'Promo list' ||
    label === 'Promo block' ||
    label === 'Book a call' ||
    label === 'Latest blogs' ||
    label === 'Image promo'
  );
}

function hasUserPromoTitle(block: ContentBlockData): boolean {
  return Boolean(
    block.listTitle?.trim() ||
      block.callTitle?.trim() ||
      block.customTitle?.trim() ||
      firstListItemTitle(block)
  );
}

function mergeSlotMeta(
  current: Pick<PromoBlockAnalyticsSlot, 'label' | 'description'> | null,
  block: ContentBlockData,
  index: number
): Pick<PromoBlockAnalyticsSlot, 'label' | 'description'> {
  const next = {
    label: contentBlockDisplayLabel(block, index),
    description: contentBlockClickDescription(block),
  };
  if (!current) return next;
  if (isGenericPromoLabel(current.label, index) && hasUserPromoTitle(block)) {
    return next;
  }
  if (!isGenericPromoLabel(current.label, index)) return current;
  return next;
}

function collectEnabledSlotsFromBlocks(
  blocks: unknown,
  slotMeta: Array<Pick<PromoBlockAnalyticsSlot, 'label' | 'description'> | null>
): void {
  if (!Array.isArray(blocks)) return;
  for (let index = 0; index < PROMO_KINDS.length; index += 1) {
    const raw = blocks[index];
    if (!isContentBlockData(raw) || !isPromoBlockEnabled(raw)) continue;
    slotMeta[index] = mergeSlotMeta(slotMeta[index] ?? null, raw, index);
  }
}

async function loadOrgPromoSlotMeta(
  organizationId: string
): Promise<Array<Pick<PromoBlockAnalyticsSlot, 'label' | 'description'> | null>> {
  await connectMongoose();

  const db = getMongoDb();
  const userRows = await db
    .collection(AUTH_USER_COLLECTION)
    .find({ organizationId })
    .project({ _id: 1 })
    .toArray();
  const userIds = userRows.map((r) => String((r as { _id?: unknown })._id ?? '')).filter(Boolean);

  const [employees, profiles] = await Promise.all([
    EmployeeModel.find({ organizationId }).select('contentBlocks').lean<{ contentBlocks?: unknown[] }[]>(),
    userIds.length > 0
      ? UserSignatureProfileModel.find({ userId: { $in: userIds } })
          .select('contentBlocks')
          .lean<{ contentBlocks?: unknown[] }[]>()
      : Promise.resolve([]),
  ]);

  const slotMeta: Array<Pick<PromoBlockAnalyticsSlot, 'label' | 'description'> | null> = [null, null];

  for (const emp of employees) {
    collectEnabledSlotsFromBlocks(emp.contentBlocks, slotMeta);
  }
  for (const profile of profiles) {
    collectEnabledSlotsFromBlocks(profile.contentBlocks, slotMeta);
  }

  return slotMeta;
}

/** Display labels for content_block_1 / content_block_2 click kinds (analytics charts). */
export async function buildPromoKindLabelMap(
  organizationId: string
): Promise<Partial<Record<PromoBlockKind, string>>> {
  const slotMeta = await loadOrgPromoSlotMeta(organizationId);
  const map: Partial<Record<PromoBlockKind, string>> = {};
  for (let index = 0; index < PROMO_KINDS.length; index += 1) {
    const kind = PROMO_KINDS[index] as PromoBlockKind;
    const meta = slotMeta[index];
    map[kind] = (meta ?? defaultPromoSlotMeta(index)).label;
  }
  return map;
}

export function resolveSignatureClickKindLabel(
  kind: string,
  promoKindLabels?: Record<string, string>
): string {
  const custom = promoKindLabels?.[kind]?.trim();
  if (custom) return custom;
  return kind
    .replace(/^social_/, '')
    .replace(/^content_block_/, 'Promo ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Slots to show on Overview analytics when any employee or workspace profile has that block enabled,
 * or when clicks were recorded for that slot in the last 30 days.
 */
export async function getOrgEnabledPromoBlockSlots(
  organizationId: string
): Promise<PromoBlockAnalyticsSlot[]> {
  const since30 = new Date(Date.now() - 30 * 86400000);
  const oid = new mongoose.Types.ObjectId(organizationId);

  const [slotMeta, clickKinds] = await Promise.all([
    loadOrgPromoSlotMeta(organizationId),
    SignatureClickEventModel.aggregate<{ _id: SignatureClickKind }>([
      {
        $match: {
          organizationId: oid,
          createdAt: { $gte: since30 },
          kind: { $in: PROMO_KINDS },
        },
      },
      { $group: { _id: '$kind' } },
    ]),
  ]);

  const kindsWithClicks = new Set(clickKinds.map((row) => row._id));

  const slots: PromoBlockAnalyticsSlot[] = [];
  for (let index = 0; index < PROMO_KINDS.length; index += 1) {
    const kind = PROMO_KINDS[index] as PromoBlockKind;
    const meta = slotMeta[index];
    if (!meta && !kindsWithClicks.has(kind)) continue;
    slots.push({
      kind,
      ...(meta ?? defaultPromoSlotMeta(index)),
    });
  }

  return slots;
}
