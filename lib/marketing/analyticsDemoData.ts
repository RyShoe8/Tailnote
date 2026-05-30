export const ANALYTICS_DEMO_BY_DAY = [
  { date: 'Apr 1', count: 4 },
  { date: 'Apr 4', count: 7 },
  { date: 'Apr 7', count: 5 },
  { date: 'Apr 10', count: 12 },
  { date: 'Apr 13', count: 9 },
  { date: 'Apr 16', count: 14 },
  { date: 'Apr 19', count: 11 },
  { date: 'Apr 22', count: 18 },
  { date: 'Apr 25', count: 15 },
  { date: 'Apr 28', count: 22 },
  { date: 'May 1', count: 19 },
  { date: 'May 4', count: 24 },
  { date: 'May 7', count: 21 },
  { date: 'May 10', count: 28 },
  { date: 'May 13', count: 26 },
  { date: 'May 16', count: 31 },
  { date: 'May 19', count: 29 },
  { date: 'May 22', count: 34 },
];

export const ANALYTICS_DEMO_BY_KIND = [
  { kind: 'Promo Book a call', count: 42 },
  { kind: 'Website', count: 38 },
  { kind: 'Promo Spring sale', count: 31 },
  { kind: 'LinkedIn', count: 28 },
  { kind: 'Logo', count: 24 },
  { kind: 'Promo Banner', count: 19 },
  { kind: 'Email', count: 15 },
];

export const ANALYTICS_DEMO_TOTAL = ANALYTICS_DEMO_BY_KIND.reduce((sum, row) => sum + row.count, 0);

export const ANALYTICS_DEMO_OPENS_TOTAL = 186;

export const ANALYTICS_DEMO_ACTIVITY_BY_DAY = ANALYTICS_DEMO_BY_DAY.map((row, i) => ({
  date: row.date,
  clicks: row.count,
  opens: Math.max(4, Math.round(row.count * (0.85 + (i % 5) * 0.05))),
}));
