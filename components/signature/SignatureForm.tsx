'use client';

import { useState } from 'react';
import type { SignatureProfile } from 'emailsignature-engine';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, GripVertical, Eye, EyeOff, Lock } from 'lucide-react';

import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getLayoutEditorFields,
  type SignatureLayout,
} from 'emailsignature-engine';
import { buildDetailOrderForSidebar } from '@/lib/signature/fieldOrder';

const LABELS: Record<string, string> = {
  avatarUrl: 'Profile Picture',
  firstName: 'First name',
  lastName: 'Last name',
  title: 'Title',
  email: 'Email',
  officePhone: 'Office phone',
  mobilePhone: 'Mobile phone',
};

export type SortableFieldProps = {
  id: string;
  label?: string;
  isHidden: boolean;
  onToggle: () => void;
  isReorderable?: boolean;
  children: React.ReactNode;
};

export function SortableField({ id, label, isHidden, onToggle, isReorderable = true, children }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isReorderable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors ${
        isDragging ? 'border-primary ring-1 ring-primary shadow-md' : 'hover:border-primary/50'
      } ${isHidden ? 'opacity-60 bg-muted/30' : ''}`}
    >
      <div
        {...(isReorderable ? { ...attributes, ...listeners } : {})}
        className={`mt-2 ${isReorderable ? 'cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing' : 'cursor-not-allowed text-muted-foreground/50'}`}
        title={isReorderable ? 'Drag to reorder' : 'Fixed in this layout'}
      >
        {isReorderable ? <GripVertical className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
      </div>
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex items-center justify-between">
          <Label className="cursor-pointer font-medium">{label || LABELS[id]}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 px-2 text-xs font-medium ${isHidden ? 'text-muted-foreground' : 'text-primary'}`}
            onClick={onToggle}
          >
            {isHidden ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
            {isHidden ? 'Hidden' : 'Visible'}
          </Button>
        </div>
        {!isHidden && <div className="animate-in fade-in slide-in-from-top-2 duration-200">{children}</div>}
      </div>
    </div>
  );
}

type Props = {
  value: SignatureProfile;
  onChange: (next: SignatureProfile) => void;
  disabled?: boolean;
  layout?: SignatureLayout;
};

export function SignatureForm({ value, onChange, disabled, layout }: Props) {
  const [uploading, setUploading] = useState(false);

  const set =
    (key: keyof SignatureProfile) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [key]: e.target.value });
    };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/dashboard/me/image', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok && json.url) {
        onChange({ ...value, avatarUrl: json.url });
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const isHidden = (field: string) => value.hiddenFields?.includes(field) ?? false;
  const toggleHidden = (field: string) => {
    const hidden = new Set(value.hiddenFields || []);
    if (hidden.has(field)) hidden.delete(field);
    else hidden.add(field);
    onChange({ ...value, hiddenFields: Array.from(hidden) });
  };

  const editorFields = layout ? getLayoutEditorFields(layout) : null;
  const activeItems = buildDetailOrderForSidebar(
    value.detailOrder,
    value.contactDisplayOrder,
    layout ?? 'default',
  );
  const fieldIsReorderable = (id: string) => {
    if (!editorFields) return true;
    return editorFields.reorderableFormFields.includes(id);
  };

  const renderField = (id: string) => {
    switch (id) {
      case 'firstName':
        return <Input id="fn" value={value.firstName} onChange={set('firstName')} autoComplete="given-name" />;
      case 'lastName':
        return <Input id="ln" value={value.lastName} onChange={set('lastName')} autoComplete="family-name" />;
      case 'title':
        return <Input id="title" value={value.title} onChange={set('title')} />;
      case 'email':
        return <Input id="email" type="email" value={value.email} onChange={set('email')} autoComplete="email" />;
      case 'officePhone':
        return <Input id="office" type="tel" value={value.officePhone ?? ''} onChange={set('officePhone')} placeholder="+1 800 555 0199" />;
      case 'mobilePhone':
        return <Input id="mobile" type="tel" value={value.mobilePhone ?? ''} onChange={set('mobilePhone')} placeholder="+1 555 012 3456" />;
      case 'avatarUrl':
        return (
          <div className="flex items-center gap-4 pl-1">
            {value.avatarUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-full border border-dashed bg-slate-50" />
            )}
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" disabled={uploading}>
                <label className="cursor-pointer">
                  {uploading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Upload image
                  <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} disabled={uploading} />
                </label>
              </Button>
              {value.avatarUrl && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onChange({ ...value, avatarUrl: '' })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <fieldset disabled={disabled || uploading} className="space-y-4">
      <div className="mb-4 space-y-1">
        <p className="text-sm text-muted-foreground">
          Fields and drag targets depend on your chosen template. Only fields that appear in this layout can be
          reordered. Use the eye icon to hide a field.
        </p>
      </div>

      <SortableContext items={activeItems} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {activeItems.map((id) => (
            <SortableField
              key={id}
              id={id}
              isHidden={isHidden(id)}
              isReorderable={fieldIsReorderable(id)}
              onToggle={() => toggleHidden(id)}
            >
              {renderField(id)}
            </SortableField>
          ))}
        </div>
      </SortableContext>
    </fieldset>
  );
}
