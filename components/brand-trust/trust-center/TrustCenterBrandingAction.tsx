'use client';

import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';

type Props = {
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl: string;
  bimiSuggestedRecord: string;
  onUploaded?: (payload: { url: string; suggestedRecord: string }) => void;
};

export function TrustCenterBrandingAction({
  canUseBimiLogoHosting,
  bimiLogoUrl,
  bimiSuggestedRecord,
  onUploaded,
}: Props) {
  return (
    <BimiLogoUpload
      variant="embedded"
      canUseBimiLogoHosting={canUseBimiLogoHosting}
      bimiLogoUrl={bimiLogoUrl}
      bimiSuggestedRecord={bimiSuggestedRecord}
      onUploaded={onUploaded}
    />
  );
}
