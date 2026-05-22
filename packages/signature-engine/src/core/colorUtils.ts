export type RgbColor = { r: number; g: number; b: number };

function clampByte(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function parseHexChannel(pair: string): number | null {
  if (!/^[0-9a-fA-F]{1,2}$/.test(pair)) return null;
  const one = pair.length === 1 ? pair + pair : pair;
  return parseInt(one, 16);
}

/** Parse #RGB, #RRGGBB, rgb(), or rgba() into RGB bytes. */
export function parseCssColor(input: string): RgbColor | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      const r = parseHexChannel(hex[0]);
      const g = parseHexChannel(hex[1]);
      const b = parseHexChannel(hex[2]);
      if (r === null || g === null || b === null) return null;
      return { r, g, b };
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return { r, g, b };
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)(?:\s*,\s*[\d.]+%?)?\s*\)$/i
  );
  if (rgbMatch) {
    const parseComponent = (raw: string): number | null => {
      if (raw.endsWith('%')) {
        const pct = parseFloat(raw.slice(0, -1));
        if (Number.isNaN(pct)) return null;
        return clampByte((pct / 100) * 255);
      }
      const n = parseFloat(raw);
      if (Number.isNaN(n)) return null;
      return clampByte(n);
    };
    const r = parseComponent(rgbMatch[1]);
    const g = parseComponent(rgbMatch[2]);
    const b = parseComponent(rgbMatch[3]);
    if (r === null || g === null || b === null) return null;
    return { r, g, b };
  }

  return null;
}

export function colorToHex({ r, g, b }: RgbColor): string {
  const toPair = (n: number) => clampByte(n).toString(16).padStart(2, '0');
  return `#${toPair(r)}${toPair(g)}${toPair(b)}`;
}

/** Normalize user input to lowercase #rrggbb, or null if invalid. */
export function normalizeCssColor(input: string): string | null {
  const rgb = parseCssColor(input);
  if (!rgb) return null;
  return colorToHex(rgb);
}

/**
 * Mix hex toward white (positive amount) or black (negative amount).
 * amount in [0, 1] lightens; in [-1, 0] darkens. Returns input if unparseable.
 */
export function adjustHexLightness(hex: string, amount: number): string {
  const normalized = normalizeCssColor(hex);
  if (!normalized) return hex.trim() || hex;

  const rgb = parseCssColor(normalized)!;
  const clamped = Math.max(-1, Math.min(1, amount));

  if (clamped >= 0) {
    return colorToHex({
      r: rgb.r + (255 - rgb.r) * clamped,
      g: rgb.g + (255 - rgb.g) * clamped,
      b: rgb.b + (255 - rgb.b) * clamped,
    });
  }

  const factor = 1 + clamped;
  return colorToHex({
    r: rgb.r * factor,
    g: rgb.g * factor,
    b: rgb.b * factor,
  });
}
