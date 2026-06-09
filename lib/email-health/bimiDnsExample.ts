import { BIMI_PLACEHOLDER_SVG_NOTE } from '@/lib/email-health/bimiCopy';

export function exampleBimiHost(domain: string): string {
  return `default._bimi.${domain}`;
}

export function exampleBimiRecordValue(domain: string): string {
  return `v=BIMI1; l=https://${domain}/placeholder.svg;`;
}

export function missingBimiTechnicalDetail(domain: string): string {
  const host = exampleBimiHost(domain);
  const example = exampleBimiRecordValue(domain);
  return [
    `No v=BIMI1 record at ${host}`,
    '',
    'Illustrative example (will not work without a real BIMI SVG):',
    example,
    '',
    BIMI_PLACEHOLDER_SVG_NOTE,
  ].join('\n');
}
