'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

export type AddonRow = {
  _id: string;
  name: string;
  slug: string;
  interval: string;
  priceCents: number;
  active: boolean;
  stripePriceId?: string;
};

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AdminAddonsTable({ initialAddons }: { initialAddons: AddonRow[] }) {
  const router = useRouter();
  const [addons, setAddons] = useState(initialAddons);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch('/api/admin/addons', { credentials: 'include' });
    const j = await res.json();
    if (res.ok) setAddons(j.addons);
  }, []);

  async function sync(id: string) {
    setMsg(null);
    const res = await fetch(`/api/admin/addons/${id}/sync`, { method: 'POST', credentials: 'include' });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Sync failed');
      return;
    }
    setMsg('Synced to Stripe.');
    await reload();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="overflow-x-auto rounded-md border min-w-0">
          <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Interval</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Active</th>
              <th className="p-3 font-medium">Stripe</th>
              <th className="p-3 font-medium w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addons.map((a) => (
              <tr key={a._id} className="border-b last:border-0">
                <td className="p-3 font-medium">
                  {a.name}
                  <span className="block text-xs text-muted-foreground">{a.slug}</span>
                </td>
                <td className="p-3">{a.interval}</td>
                <td className="p-3">{fmtMoney(a.priceCents)}</td>
                <td className="p-3">{a.active ? 'Yes' : 'No'}</td>
                <td className="p-3">{a.stripePriceId ? 'Yes' : 'No'}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" size="sm" variant="secondary" onClick={() => void sync(a._id)}>
                      Sync
                    </Button>
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link href={`/admin/addons/${a._id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
