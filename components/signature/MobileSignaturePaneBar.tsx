'use client';

import { Button } from '@/components/ui/button';

export type MobileSignaturePane = 'edit' | 'preview';

type Props = {
  pane: MobileSignaturePane;
  onPaneChange: (pane: MobileSignaturePane) => void;
};

/** Sticky Edit / Preview switcher for signature screens below `lg`. */
export function MobileSignaturePaneBar({ pane, onPaneChange }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
      role="tablist"
      aria-label="Signature editor or preview"
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <Button
          type="button"
          variant={pane === 'edit' ? 'default' : 'outline'}
          className="flex-1"
          role="tab"
          aria-selected={pane === 'edit'}
          onClick={() => onPaneChange('edit')}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant={pane === 'preview' ? 'default' : 'outline'}
          className="flex-1"
          role="tab"
          aria-selected={pane === 'preview'}
          onClick={() => onPaneChange('preview')}
        >
          Preview
        </Button>
      </div>
    </div>
  );
}
