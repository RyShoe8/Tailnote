'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '@/lib/utils';

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

function CollapsibleContentStyled({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      className={cn('overflow-hidden text-sm data-[state=closed]:hidden', className)}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContentStyled as CollapsibleContent };
