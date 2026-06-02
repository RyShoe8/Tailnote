import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  'Remove Powered by Tailnote',
  'Click tracking',
  'Campaign performance',
  'Team management',
  'Future premium features',
];

export default function UpgradePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Remove Tailnote branding and unlock analytics.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free plans include core signature generation. Upgrade anytime to unlock the full platform.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upgrade benefits</CardTitle>
          <CardDescription>Everything included in paid plans.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {BENEFITS.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
          <Button asChild>
            <Link href="/dashboard/billing">Upgrade now</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
