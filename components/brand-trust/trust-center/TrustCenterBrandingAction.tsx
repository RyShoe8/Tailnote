'use client';

import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';

type Props = {
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl: string;
  bimiSuggestedRecord: string;
  bimiLogoUploadedAt?: string | null;
  onUploaded?: (payload: { url: string; suggestedRecord: string; uploadedAt: string }) => void;
  upgradeHref?: string;
};

export function TrustCenterBrandingAction({
  canUseBimiLogoHosting,
  bimiLogoUrl,
  bimiSuggestedRecord,
  bimiLogoUploadedAt = null,
  onUploaded,
  upgradeHref,
}: Props) {
  return (
    <BimiLogoUpload
      variant="embedded"
      canUseBimiLogoHosting={canUseBimiLogoHosting}
      bimiLogoUrl={bimiLogoUrl}
      bimiLogoUploadedAt={bimiLogoUploadedAt}
      bimiSuggestedRecord={bimiSuggestedRecord}
      onUploaded={onUploaded}
      upgradeHref={upgradeHref}
    />
  );
}
