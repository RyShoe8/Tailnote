export function exampleBimiHost(_domain?: string): string {
  return 'default._bimi';
}

export function exampleBimiRecordValue(domain: string): string {
  return `v=BIMI1; l=https://${domain}/placeholder.svg;`;
}

export function missingBimiTechnicalDetail(domain: string): string {
  return `No v=BIMI1 record at default._bimi.${domain}`;
}
