import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import { BimiScanResultModel } from '@/models/BimiScanResult';
import type { Types } from 'mongoose';

export async function persistBimiScanResult(args: {
  domain: string;
  result: BIMIResult;
  organizationId?: Types.ObjectId | string | null;
}) {
  const filter = args.organizationId
    ? { organizationId: args.organizationId, domain: args.domain.toLowerCase() }
    : { organizationId: null, domain: args.domain.toLowerCase() };

  return BimiScanResultModel.findOneAndUpdate(
    filter,
    {
      organizationId: args.organizationId ?? null,
      domain: args.domain.toLowerCase(),
      readinessStatus: args.result.status,
      dmarcStatus: args.result.dmarcStatus.summary,
      bimiRecordStatus: args.result.bimiRecordStatus.summary,
      svgStatus: args.result.svgStatus.summary,
      certificateStatus: args.result.certificateStatus.summary,
      issuesJson: args.result.issues,
      recommendationsJson: args.result.recommendations,
      implementationStepsJson: args.result.implementationSteps,
      fullResultJson: args.result,
      scannedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}
