export type {
  SignatureProfile,
  SignatureBrand,
  SignatureTemplate,
  SignatureElement,
  SignatureLayout,
  ContentBlockData,
  ContentBlockListItem,
  PromoUrlPrefix,
  RenderSignatureInput,
} from './core/types';

export {
  renderSignature,
  mergeRenderContext,
  ensureAbsolutePublicUrl,
  unwrapImageProxyUrl,
} from './core/renderer';

export { normalizePromoUrl } from './core/normalizePromoUrl';

export {
  SOCIAL_ICON_LINKEDIN,
  SOCIAL_ICON_FACEBOOK,
  SOCIAL_ICON_INSTAGRAM,
  SOCIAL_ICON_REDDIT,
  SOCIAL_ICON_DISCORD,
} from './core/socialIcons';

export { STANDARD_SIGNATURE_TEMPLATE } from './core/templates/standard';
export { STACKED_SIGNATURE_TEMPLATE } from './core/templates/stacked';
export { CORPORATE_SIGNATURE_TEMPLATE } from './core/templates/corporate';
export { PROFESSIONAL_SIGNATURE_TEMPLATE } from './core/templates/professional';
export { DEFAULT_SIGNATURE_TEMPLATE } from './core/templates/default';
export { CREATOR_SIGNATURE_TEMPLATE } from './core/templates/creator';
export { EXECUTIVE_MINIMALIST_SIGNATURE_TEMPLATE } from './core/templates/executive_minimalist';
export { PORTFOLIO_SIGNATURE_TEMPLATE } from './core/templates/portfolio';

export {
  mockSignatureBrand,
  mockSignatureTemplate,
  defaultSignatureElements,
} from './fixtures';
