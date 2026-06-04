/** Client-safe display labels for signature click kinds (no server/database imports). */
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
