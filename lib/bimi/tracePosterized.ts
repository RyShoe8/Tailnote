export type RgbaFrame = {
  data: Uint8Array;
  width: number;
  height: number;
};

export function countDistinctColors(data: Uint8Array): number {
  const colors = new Set<string>();
  const step = Math.max(4, Math.floor(data.length / 4 / 400));
  for (let i = 0; i < data.length; i += step * 4) {
    const alpha = data[i + 3] ?? 0;
    if (alpha < 32) continue;
    colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    if (colors.size > 16) return colors.size;
  }
  return colors.size;
}

export function isMostlyMonochrome(data: Uint8Array): boolean {
  return countDistinctColors(data) <= 8;
}

export function normalizeTracedSvg(svg: string, viewSize: number): string {
  let out = svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<image[\s\S]*?\/image>/gi, '')
    .replace(/<image[\s\S]*?>/gi, '')
    .replace(/\s(width|height)="[^"]*"/gi, '');

  if (out.match(/viewBox="/i)) {
    out = out.replace(/viewBox="[^"]+"/i, `viewBox="0 0 ${viewSize} ${viewSize}"`);
  } else {
    out = out.replace(/<svg(\s|>)/i, `<svg viewBox="0 0 ${viewSize} ${viewSize}"$1`);
  }
  return out;
}
