'use client';

import { ShareButtons } from '@/components/blog/ShareButtons';

type Props = {
  domain: string;
  domainSlug: string;
  sharePathPrefix?: string;
};

export function EmailHealthReportShare({
  domain,
  domainSlug,
  sharePathPrefix = '/email-health',
}: Props) {
  return (
    <div className="mt-12 flex justify-center">
      <ShareButtons
        title={`Email health report for ${domain}`}
        path={`${sharePathPrefix}/${domainSlug}`}
      />
    </div>
  );
}
