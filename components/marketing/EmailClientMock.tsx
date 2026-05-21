type Props = {
  signatureHtml: string;
};

/**
 * Marketing hero illustration: realistic email composer window with a live
 * Tailnote signature rendered inside. Server component — `signatureHtml` is
 * produced via `renderMarketingSample` (`emailsignature-engine`).
 */
export function EmailClientMock({ signatureHtml }: Props) {
  return (
    <div className="relative w-full min-w-0">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[#0065c9]/15 via-[#0c8fa3]/10 to-[#4fd6b2]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 -z-10 hidden h-40 w-40 rounded-full bg-[#4fd6b2]/30 blur-2xl md:block tn-float"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 bottom-10 -z-10 hidden h-32 w-32 rounded-full bg-[#0065c9]/30 blur-2xl md:block tn-float"
        style={{ animationDelay: '2s' }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-ring ring-1 ring-slate-900/5 sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
          </div>
          <p className="truncate text-xs font-medium text-slate-500">New message</p>
          <span className="w-12" aria-hidden />
        </div>

        <div className="space-y-3 border-b border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 font-medium text-slate-400">To</span>
            <span className="truncate text-slate-700">jordan@northwind.co</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 font-medium text-slate-400">Subject</span>
            <span className="truncate text-slate-700">Quick intro from Acme</span>
          </div>
        </div>

        <div className="space-y-4 px-4 py-5 text-sm text-slate-700 sm:px-6 sm:py-6">
          <p>Hi Jordan,</p>
          <p>
            Great chatting earlier — sharing a couple of useful links below. Happy to set up a quick
            call this week if you&apos;d like to dig into the numbers.
          </p>
          <p>Cheers,</p>
          <div className="signature-email-preview min-w-0 overflow-x-auto rounded-lg border border-slate-100 bg-white p-4 text-left">
            <div className="min-w-0" dangerouslySetInnerHTML={{ __html: signatureHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
}
