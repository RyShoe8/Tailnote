import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { connectMongoose } from '@/lib/mongoose';
import {
  SignaturePresetCatalogModel,
  type CatalogPresetId,
} from '@/models/SignaturePresetCatalog';
import {
  assertPresetCanBeDisabledOrDeleted,
  PresetCatalogGuardError,
} from '@/lib/templates/presetCatalogGuards';

export const dynamic = 'force-dynamic';

const PRESET_IDS = [
  'default',
  'creator',
  'executive_minimalist',
  'minimal',
  'stacked',
  'corporate',
  'professional',
] as const;

function parsePresetId(raw: string): CatalogPresetId | null {
  return PRESET_IDS.includes(raw as CatalogPresetId) ? (raw as CatalogPresetId) : null;
}

const PatchSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ presetId: string }> }
) {
  const gate = await requirePlatformAdminApi();
  if (gate) return gate;

  const { presetId: raw } = await context.params;
  const presetId = parsePresetId(raw);
  if (!presetId) {
    return NextResponse.json({ error: 'Invalid presetId' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.enabled === false) {
    try {
      await assertPresetCanBeDisabledOrDeleted(presetId);
    } catch (e) {
      if (e instanceof PresetCatalogGuardError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }
  }

  await connectMongoose();
  const $set: Record<string, unknown> = {};
  if (parsed.data.enabled !== undefined) $set.enabled = parsed.data.enabled;
  if (parsed.data.name !== undefined) $set.name = parsed.data.name.trim();
  if (parsed.data.description !== undefined) $set.description = parsed.data.description.trim();

  const doc = await SignaturePresetCatalogModel.findOneAndUpdate(
    { presetId },
    { $set },
    { new: true }
  ).lean();

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ preset: doc });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ presetId: string }> }
) {
  const gate = await requirePlatformAdminApi();
  if (gate) return gate;

  const { presetId: raw } = await context.params;
  const presetId = parsePresetId(raw);
  if (!presetId) {
    return NextResponse.json({ error: 'Invalid presetId' }, { status: 400 });
  }

  try {
    await assertPresetCanBeDisabledOrDeleted(presetId);
  } catch (e) {
    if (e instanceof PresetCatalogGuardError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  await connectMongoose();
  const doc = await SignaturePresetCatalogModel.findOneAndUpdate(
    { presetId },
    { $set: { enabled: false, deletedAt: new Date() } },
    { new: true }
  ).lean();

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ preset: doc });
}

/** Restore a soft-deleted preset. */
export async function POST(
  _request: Request,
  context: { params: Promise<{ presetId: string }> }
) {
  const gate = await requirePlatformAdminApi();
  if (gate) return gate;

  const { presetId: raw } = await context.params;
  const presetId = parsePresetId(raw);
  if (!presetId) {
    return NextResponse.json({ error: 'Invalid presetId' }, { status: 400 });
  }

  await connectMongoose();
  const doc = await SignaturePresetCatalogModel.findOneAndUpdate(
    { presetId },
    { $set: { enabled: true, deletedAt: null } },
    { new: true }
  ).lean();

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ preset: doc });
}
