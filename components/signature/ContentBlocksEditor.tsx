'use client';

import { useEffect, useRef, useState } from 'react';
import type { ContentBlockData, ContentBlockListItem, PromoUrlPrefix } from 'emailsignature-engine';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { QuoteLibraryPicker } from '@/components/signature/QuoteLibraryPicker';

type Props = {
  value: ContentBlockData[];
  onChange: (blocks: ContentBlockData[]) => void;
  spotlightMode?: boolean;
};

/** Must match List editor slots so migrated docs persist four rows. */
const MAX_LIST_ITEMS = 4;

function ensureSlots(blocks: ContentBlockData[], spotlightMode: boolean = false): ContentBlockData[] {
  const SLOT_COUNT = spotlightMode ? 1 : 2;
  const out = [...blocks];
  while (out.length < SLOT_COUNT) {
    out.push({ type: spotlightMode ? 'quote' : 'book_a_call', enabled: false });
  }
  return out.slice(0, SLOT_COUNT);
}

/** Promote legacy `custom` (no image) to `list` with padded items; keeps multi-row editing + renderer parity. */
function migrateCustomToListFields(
  block: ContentBlockData,
  listTitleOverride?: string
): Partial<ContentBlockData> {
  const listTitle =
    listTitleOverride !== undefined
      ? listTitleOverride.trim()
      : (block.listTitle ?? block.customTitle ?? '').trim();

  let listItems: ContentBlockListItem[] = (block.listItems ?? [])
    .filter(Boolean)
    .map((it) => ({
      title: typeof it?.title === 'string' ? it.title : '',
      description: typeof it?.description === 'string' ? it.description : undefined,
      url: typeof it?.url === 'string' ? it.url : undefined,
    }));

  if (
    listItems.length === 0 &&
    ((block.customTitle || '').trim() ||
      (block.customText || '').trim() ||
      (block.customUrl || '').trim())
  ) {
    listItems = [
      {
        title: (block.customTitle || '').trim() || 'Item 1',
        description: block.customText || undefined,
        url: block.customUrl || undefined,
      },
    ];
  }

  while (listItems.length < MAX_LIST_ITEMS) listItems.push({ title: '' });
  listItems = listItems.slice(0, MAX_LIST_ITEMS);

  return {
    type: 'list',
    listTitle,
    listItems,
    customTitle: undefined,
    customText: undefined,
    customUrl: undefined,
    customImageUrl: undefined,
  };
}

export function ContentBlocksEditor({ value, onChange, spotlightMode = false }: Props) {
  const blocks = ensureSlots(value, spotlightMode);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const migratedCustomSlotRef = useRef<Set<number>>(new Set());

  /** Persist legacy `custom` blocks as real `list` rows so the renderer uses listItems (multi-row + per-item links). */
  useEffect(() => {
    const slots = ensureSlots(value, spotlightMode);
    let changed = false;
    const next = [...slots];
    for (let i = 0; i < next.length; i += 1) {
      const b = next[i];
      if (!b.enabled || b.type !== 'custom') continue;
      if (b.customImageUrl?.trim()) continue;
      if (migratedCustomSlotRef.current.has(i)) continue;
      migratedCustomSlotRef.current.add(i);

      next[i] = {
        ...b,
        ...migrateCustomToListFields(b),
      } as ContentBlockData;
      changed = true;
    }
    if (changed) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-wave migration when persisted `value` still uses custom
  }, [value]);

  const updateBlock = (index: number, next: Partial<ContentBlockData>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...next } as ContentBlockData;
    onChange(newBlocks);
  };

  const block = blocks[activeSlot];

  return (
    <div className="space-y-4">
      {!spotlightMode && (
        <div className="flex items-center gap-2 border-b px-4">
          {blocks.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlot(i)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeSlot === i
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Slot {i + 1}
              {b.enabled && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />}
            </button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id={`block-enabled-${activeSlot}`}
                type="checkbox"
                checked={block.enabled}
                onChange={(e) => updateBlock(activeSlot, { enabled: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor={`block-enabled-${activeSlot}`} className="font-normal text-sm">
                Enable Block {activeSlot + 1}
              </Label>
            </div>
          </div>
        </CardHeader>
        {block.enabled && (
          <CardContent className="space-y-4 pt-0">
          {!spotlightMode && (
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={block.type === 'custom' ? 'list' : block.type}
                onChange={(e) => updateBlock(activeSlot, { type: e.target.value as ContentBlockData['type'] })}
              >
                <option value="book_a_call">Book a Call</option>
                <option value="latest_blogs">Latest Blogs (RSS)</option>
                <option value="list">List</option>
                <option value="image">Image</option>
                <option value="quote">Quote</option>
                <option value="spotlight">Tailnote Spotlight</option>
              </select>
            </div>
          )}

            {block.type === 'book_a_call' && (
              <BookACallEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
            {block.type === 'latest_blogs' && (
              <LatestBlogsEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
            {(block.type === 'list' || block.type === 'custom') && (
              <ListEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
            {block.type === 'image' && (
              <ImageEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
            {block.type === 'quote' && (
              <QuoteEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
            {block.type === 'spotlight' && (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                <p className="font-medium text-foreground mb-1">Tailnote Spotlight</p>
                <p>
                  This block automatically displays the currently featured company from Tailnote Spotlight.
                  No configuration is required. It updates automatically when a new Spotlight is published.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function BookACallEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={block.callTitle || ''}
          onChange={(e) => onChange({ callTitle: e.target.value })}
          placeholder="Book a Call"
        />
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          value={block.callUrl || ''}
          onChange={(e) => onChange({ callUrl: e.target.value })}
          placeholder="https://calendly.com/..."
        />
      </div>
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={block.callButtonText || ''}
          onChange={(e) => onChange({ callButtonText: e.target.value })}
          placeholder="Schedule Now"
        />
      </div>
    </>
  );
}

function LatestBlogsEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>RSS Feed URL</Label>
        <Input
          value={block.rssUrl || ''}
          onChange={(e) => onChange({ rssUrl: e.target.value })}
          placeholder="https://blog.example.com/rss.xml"
        />
      </div>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            if (!block.rssUrl) return;
            try {
              const res = await fetch('/api/dashboard/rss-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: block.rssUrl }),
              });
              const json = await res.json();
              if (json.items) {
                onChange({ rssItems: json.items, rssLastFetched: new Date().toISOString() });
              }
            } catch {
              /* swallow fetch errors; user can retry */
            }
          }}
        >
          Refresh Now
        </Button>
        <span className="text-xs text-muted-foreground">
          {block.rssLastFetched ? `Last fetched: ${new Date(block.rssLastFetched).toLocaleString()}` : 'Not fetched yet'}
        </span>
      </div>
      <div className="space-y-2">
        <Label>Auto-refresh Schedule</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={block.rssRefreshInterval || 'none'}
          onChange={(e) => onChange({ rssRefreshInterval: e.target.value as ContentBlockData['rssRefreshInterval'] })}
        >
          <option value="none">None (Manual only)</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      {block.rssItems && block.rssItems.length > 0 && (
        <div className="text-sm space-y-1 mt-4">
          <p className="font-medium text-xs text-muted-foreground">Preview items:</p>
          <ul className="list-disc pl-4 text-xs">
            {block.rssItems.slice(0, 3).map((item, idx) => (
              <li key={idx} className="truncate">
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ListEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  // Migrate a legacy `custom` block into the list shape on first edit.
  const legacyMigrated: ContentBlockListItem[] | undefined =
    block.type === 'custom' && !block.listItems && (block.customTitle || block.customText || block.customUrl)
      ? [
          {
            title: (block.customTitle || '').trim() || 'Item 1',
            description: block.customText || undefined,
            url: block.customUrl || undefined,
          },
        ]
      : undefined;

  const items = (block.listItems ?? legacyMigrated ?? [])
    .filter(Boolean)
    .map((it) => ({
      title: typeof it?.title === 'string' ? it.title : '',
      description: typeof it?.description === 'string' ? it.description : undefined,
      url: typeof it?.url === 'string' ? it.url : undefined,
      urlPrefix: (it?.urlPrefix === 'www' ? 'www' : 'https') as PromoUrlPrefix,
    }));
  const title = block.listTitle ?? (block.type === 'custom' ? block.customTitle ?? '' : '');

  const updateItem = (index: number, next: Partial<ContentBlockListItem>) => {
    const padded: ContentBlockListItem[] = [];
    const maxLen = Math.max(items.length, index + 1);
    for (let i = 0; i < maxLen; i += 1) {
      padded[i] = items[i] ?? { title: '', urlPrefix: 'https' };
    }
    padded[index] = { ...padded[index], ...next } as ContentBlockListItem;
    const base =
      block.type === 'custom' && !block.customImageUrl?.trim() ? migrateCustomToListFields(block) : {};
    onChange({ ...base, listItems: padded.slice(0, MAX_LIST_ITEMS) });
  };

  const clearItem = (index: number) => {
    const padded: ContentBlockListItem[] = [];
    const maxLen = Math.max(items.length, index + 1);
    for (let i = 0; i < maxLen; i += 1) {
      padded[i] = i === index ? { title: '' } : items[i] ?? { title: '' };
    }
    const base =
      block.type === 'custom' && !block.customImageUrl?.trim() ? migrateCustomToListFields(block) : {};
    onChange({ ...base, listItems: padded.slice(0, MAX_LIST_ITEMS) });
  };

  return (
    <>
      <div className="space-y-2">
        <Label>List title</Label>
        <Input
          value={title}
          onChange={(e) => {
            const v = e.target.value;
            if (block.type === 'custom' && !block.customImageUrl?.trim()) {
              onChange(migrateCustomToListFields(block, v));
            } else {
              onChange({ listTitle: v });
            }
          }}
          placeholder="Special Offers"
        />
      </div>
      <div className="space-y-3">
        <Label>Items (up to {MAX_LIST_ITEMS})</Label>
        <p className="text-xs text-muted-foreground">
          Fill any of the four slots. Empty slots are skipped in the preview.
        </p>
        {Array.from({ length: MAX_LIST_ITEMS }).map((_, i) => {
          const item = items[i] ?? { title: '' };
          const filled = Boolean(item.title?.trim() || item.description?.trim() || item.url?.trim());
          return (
            <div
              key={i}
              className={`rounded-md border p-3 space-y-2 transition-opacity ${filled ? 'opacity-100' : 'opacity-70'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                {filled ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => clearItem(i)}>
                    Clear
                  </Button>
                ) : null}
              </div>
              <Input
                value={item.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                placeholder={`Item ${i + 1} title`}
              />
              <Textarea
                value={item.description || ''}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder="Optional description"
                className="resize-none"
                rows={2}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Link prefix</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={item.urlPrefix === 'www' ? 'www' : 'https'}
                    onChange={(e) =>
                      updateItem(i, { urlPrefix: e.target.value as PromoUrlPrefix })
                    }
                  >
                    <option value="https">https://</option>
                    <option value="www">www.</option>
                  </select>
                </div>
                <Input
                  className="flex-1"
                  value={item.url || ''}
                  onChange={(e) => updateItem(i, { url: e.target.value })}
                  placeholder="example.com/page"
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ImageEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={block.imageUrl || ''}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="https://..."
            className="min-w-0 flex-1"
          />
          <div className="relative shrink-0">
            <Input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = '';
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const res = await fetch('/api/dashboard/me/image', {
                    method: 'POST',
                    body: formData,
                  });
                  if (!res.ok) throw new Error('Upload failed');
                  const data = await res.json();
                  onChange({ imageUrl: data.url });
                } catch {
                  alert('Image upload failed. Please ensure it is < 4MB.');
                }
              }}
            />
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Upload
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Link URL (optional)</Label>
        <Input
          value={block.imageLinkUrl || ''}
          onChange={(e) => onChange({ imageLinkUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </>
  );
}

function QuoteEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  const source = block.quoteSource ?? (block.quoteId ? 'library' : 'custom');

  function setSource(next: 'library' | 'custom') {
    if (next === 'library') {
      onChange({
        quoteSource: 'library',
        quoteText: undefined,
        quoteAttribution: undefined,
      });
    } else {
      onChange({
        quoteSource: 'custom',
        quoteId: undefined,
      });
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Label>Quote source</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="quote-source"
              checked={source === 'library'}
              onChange={() => setSource('library')}
            />
            Choose from Tailnote Library
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="quote-source"
              checked={source === 'custom'}
              onChange={() => setSource('custom')}
            />
            Custom Quote
          </label>
        </div>
      </div>

      {source === 'library' ? (
        <QuoteLibraryPicker
          selectedQuoteId={block.quoteId}
          onSelect={(quote) =>
            onChange({
              quoteSource: 'library',
              quoteId: quote.id,
              quoteText: undefined,
              quoteAttribution: undefined,
              quoteResolvedText: quote.quoteText,
              quoteResolvedAttribution: quote.attribution || quote.source,
              quoteResolvedSourceUrl: quote.sourceUrl || undefined,
            })
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            <Label>Quote text</Label>
            <Textarea
              value={block.quoteText || ''}
              onChange={(e) =>
                onChange({
                  quoteText: e.target.value,
                  quoteResolvedText: e.target.value,
                })
              }
              rows={3}
              placeholder="The best marketing is helpful."
            />
          </div>
          <div className="space-y-2">
            <Label>Attribution (optional)</Label>
            <Input
              value={block.quoteAttribution || ''}
              onChange={(e) =>
                onChange({
                  quoteAttribution: e.target.value,
                  quoteResolvedAttribution: e.target.value,
                })
              }
              placeholder="Tailnote"
            />
          </div>
        </>
      )}

      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium text-foreground">Display options</p>
        <div className="flex items-center gap-2">
          <input
            id="quote-show-attribution"
            type="checkbox"
            checked={block.quoteShowAttribution !== false}
            onChange={(e) => onChange({ quoteShowAttribution: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="quote-show-attribution" className="font-normal text-sm">
            Show attribution
          </Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Alignment</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={block.quoteAlignment ?? 'left'}
              onChange={(e) =>
                onChange({ quoteAlignment: e.target.value as 'left' | 'center' })
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Font size</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={block.quoteFontSize ?? 'medium'}
              onChange={(e) =>
                onChange({
                  quoteFontSize: e.target.value as 'small' | 'medium' | 'large',
                })
              }
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Style</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={block.quoteStyle ?? 'standard'}
              onChange={(e) =>
                onChange({
                  quoteStyle: e.target.value as 'standard' | 'minimal' | 'highlighted',
                })
              }
            >
              <option value="standard">Standard</option>
              <option value="minimal">Minimal</option>
              <option value="highlighted">Highlighted</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
