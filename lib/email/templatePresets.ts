import type { SignatureElement, SignatureTemplate, SignatureLayout } from 'emailsignature-engine';

export type TemplatePresetId =
  | 'default'
  | 'creator'
  | 'executive_minimalist'
  | 'minimal'
  | 'stacked'
  | 'corporate'
  | 'professional'
  | 'portfolio'
  | 'ecard';

export type TemplatePresetMeta = {
  id: TemplatePresetId;
  name: string;
  description: string;
};

export const TEMPLATE_PRESET_META: TemplatePresetMeta[] = [
  {
    id: 'default',
    name: 'Default',
    description:
      'Logo column with brand accent border, name and title band, P|E|W contact row, social icons, and two-column promo list footer.',
  },
  {
    id: 'creator',
    name: 'Creator',
    description:
      'Dark card layout with logo and social in a side column, monospace tagline, terminal-style contact rows, and pill-style promo links.',
  },
  {
    id: 'executive_minimalist',
    name: 'Executive Minimalist',
    description:
      'Serif name band with logo on the right, inline contact row, and text-only Connect and Portfolio link rows.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Logo, name, title, contact, and optional social icons when links are set—compact.',
  },
  {
    id: 'stacked',
    name: 'Stacked',
    description: 'Stacked layout with optional social and divider.',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Premium layout with accent bars, branded footer, circular social icons, and promotional content blocks.',
  },
  {
    id: 'professional',
    name: 'Professional',
    description:
      'Card-style layout with the same structure as Corporate — curved frame, hero name band, tighter spacing, and richer brand color.',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description:
      'Dark card with circular logo, pill contact buttons, and network portfolio tags. Primary color sets the card background; secondary color drives accents.',
  },
  {
    id: 'ecard',
    name: 'eCard',
    description:
      'Light card with primary top bar, contact rows, save-contact button, framed logo, and portfolio links with social icons in the footer.',
  },
];

function elementsMinimal(): SignatureElement[] {
  return [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'address' },
    { type: 'contentBlocks' },
  ];
}

function elementsStacked(): SignatureElement[] {
  return [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
    { type: 'address' },
    { type: 'contentBlocks' },
  ];
}

function elementsDefault(): SignatureElement[] {
  return [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'address' },
    { type: 'contentBlocks' },
  ];
}

function elementsCreator(): SignatureElement[] {
  return elementsDefault();
}

function elementsExecutiveMinimalist(): SignatureElement[] {
  return elementsDefault();
}

function elementsCorporate(): SignatureElement[] {
  return [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
    { type: 'address' },
    { type: 'contentBlocks' },
  ];
}

function elementsProfessional(): SignatureElement[] {
  return elementsCorporate();
}

function elementsPortfolio(): SignatureElement[] {
  return [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'contentBlocks' },
  ];
}

function elementsEcard(): SignatureElement[] {
  return elementsPortfolio();
}

/**
 * Resolves a named preset to engine `SignatureTemplate` (no HTML in DB).
 * `templateDocId` is the Mongo id string of the org template row when persisted.
 */
export function presetToEngineTemplate(
  presetId: TemplatePresetId,
  templateDocId: string,
  displayName?: string
): SignatureTemplate {
  switch (presetId) {
    case 'default':
      return {
        id: templateDocId,
        name: displayName ?? 'Default',
        layout: 'default',
        elements: elementsDefault(),
      };
    case 'creator':
      return {
        id: templateDocId,
        name: displayName ?? 'Creator',
        layout: 'creator',
        elements: elementsCreator(),
      };
    case 'executive_minimalist':
      return {
        id: templateDocId,
        name: displayName ?? 'Executive Minimalist',
        layout: 'executive_minimalist',
        elements: elementsExecutiveMinimalist(),
      };
    case 'minimal':
      return {
        id: templateDocId,
        name: displayName ?? 'Minimal',
        layout: 'standard',
        elements: elementsMinimal(),
      };
    case 'stacked':
      return {
        id: templateDocId,
        name: displayName ?? 'Stacked',
        layout: 'stacked',
        elements: elementsStacked(),
      };
    case 'corporate':
      return {
        id: templateDocId,
        name: displayName ?? 'Corporate',
        layout: 'corporate',
        elements: elementsCorporate(),
      };
    case 'professional':
      return {
        id: templateDocId,
        name: displayName ?? 'Professional',
        layout: 'professional',
        elements: elementsProfessional(),
      };
    case 'portfolio':
      return {
        id: templateDocId,
        name: displayName ?? 'Portfolio',
        layout: 'portfolio',
        elements: elementsPortfolio(),
      };
    case 'ecard':
      return {
        id: templateDocId,
        name: displayName ?? 'eCard',
        layout: 'ecard',
        elements: elementsEcard(),
      };
    default:
      return {
        id: templateDocId,
        name: displayName ?? 'Corporate',
        layout: 'corporate',
        elements: elementsCorporate(),
      };
  }
}

export function engineTemplateFromStoredConfig(args: {
  templateId: string;
  name: string;
  presetId: TemplatePresetId;
  /** When true (Pro), allow animation block if org enables GIF. */
  includeAnimationSlot?: boolean;
}): SignatureTemplate {
  const base = presetToEngineTemplate(args.presetId, args.templateId, args.name);
  if (!args.includeAnimationSlot) return base;
  return {
    ...base,
    elements: [...base.elements, { type: 'animation' }],
  };
}
