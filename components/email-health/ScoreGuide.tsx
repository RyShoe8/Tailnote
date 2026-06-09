import {
  CATEGORY_GUIDE,
  STATUS_LABEL_GUIDE,
  scoreBandForLabel,
} from '@/lib/email-health/categoryGuide';
import { DISPLAY_CATEGORY_ORDER } from '@/lib/email-health/categoryDisplay';
import type { StatusLabel } from '@/lib/email-health/types';

type Props = {
  statusLabel: StatusLabel;
};

const CATEGORY_ORDER = DISPLAY_CATEGORY_ORDER;

export function ScoreGuide({ statusLabel }: Props) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
      <details className="group">
        <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-foreground [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            How your score works
            <span className="text-sm font-normal text-primary group-open:hidden">Show breakdown</span>
            <span className="hidden text-sm font-normal text-primary group-open:inline">Hide breakdown</span>
          </span>
        </summary>

        <div className="mt-5 space-y-6">
          <p className="text-sm text-muted-foreground">
            Your score is the sum of seven checks (max 100 points). Each category earns full points on{' '}
            <strong className="font-medium text-foreground">pass</strong>, about half on{' '}
            <strong className="font-medium text-foreground">warn</strong>, and zero on{' '}
            <strong className="font-medium text-foreground">fail</strong>.
          </p>

          <div className="overflow-x-auto rounded-lg border border-slate-200/80">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80">
                  <th className="px-3 py-2 font-medium text-foreground">Check</th>
                  <th className="px-3 py-2 font-medium text-foreground">Points</th>
                  <th className="px-3 py-2 font-medium text-foreground">What we check</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORY_ORDER.map((key) => {
                  const guide = CATEGORY_GUIDE[key];
                  return (
                    <tr key={key} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2.5 font-medium text-foreground">{guide.label}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{guide.maxPoints}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{guide.whatItChecks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Your band: {statusLabel} ({STATUS_LABEL_GUIDE[statusLabel].summary})
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{scoreBandForLabel(statusLabel)}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">All score bands</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {(Object.keys(STATUS_LABEL_GUIDE) as StatusLabel[]).map((label) => (
                <li key={label}>
                  <strong className="font-medium text-foreground">{label}</strong> ({STATUS_LABEL_GUIDE[label].summary}
                  ): {STATUS_LABEL_GUIDE[label].meaning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}
