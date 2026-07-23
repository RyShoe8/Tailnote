import { CalendarClock, ImageIcon, ListChecks, Quote, Rss } from 'lucide-react';
import { MarketingBrowserFrame } from '@/components/marketing/MarketingBrowserFrame';
import { Badge } from '@/components/ui/badge';

const BLOCK_ROWS = [
  { icon: CalendarClock, label: 'Book a call', enabled: true },
  { icon: ListChecks, label: 'Featured offers', enabled: true },
  { icon: Quote, label: 'Quote', enabled: true },
  { icon: Rss, label: 'Dynamic Content', enabled: true },
  { icon: ImageIcon, label: 'Spring promo banner', enabled: false },
] as const;

export function MarketingPromoEditorMock() {
  return (
    <MarketingBrowserFrame url="app.tailnote.com/dashboard/signature">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Promotional blocks</p>
            <p className="text-xs text-muted-foreground">Organization defaults</p>
          </div>
          <Badge variant="accent" className="text-[10px] uppercase tracking-wide">
            All employees
          </Badge>
        </div>
        <ul className="mt-4 space-y-2">
          {BLOCK_ROWS.map(({ icon: Icon, label, enabled }) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="truncate text-sm font-medium text-foreground">{label}</span>
              </div>
              <span
                className={
                  enabled
                    ? 'shrink-0 text-xs font-medium text-primary'
                    : 'shrink-0 text-xs text-muted-foreground'
                }
              >
                {enabled ? 'On' : 'Off'}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          One update here refreshes every employee signature on the next send.
        </p>
      </div>
    </MarketingBrowserFrame>
  );
}
