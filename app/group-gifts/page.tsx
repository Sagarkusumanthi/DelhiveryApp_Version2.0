"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/CustomerHeader";
import { CustomerBottomNav } from "@/components/CustomerBottomNav";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface Contributor { amount: number; paid: boolean }
interface GroupGift { id: string; title: string; recipientName: string; goalAmount: number; deliveryDate: string; contributors: Contributor[] }

export default function GroupGiftsPage() {
  const [gifts, setGifts] = useState<GroupGift[]>([]);

  useEffect(() => {
    fetch("/api/group-gifts").then((r) => r.json()).then((d) => setGifts(d.groupGifts ?? []));
  }, []);

  return (
    <div className="pb-20 sm:pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-serif text-xl font-semibold text-ink">Group Gifting</h1>
          <Link href="/group-gifts/new"><Button size="sm">+ New</Button></Link>
        </div>
        <div className="space-y-2">
          {gifts.map((g) => {
            const collected = g.contributors.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
            const pct = Math.min(100, Math.round((collected / g.goalAmount) * 100));
            return (
              <Link key={g.id} href={`/group-gifts/${g.id}`} className="block rounded-2xl border border-border bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-ink">{g.title}</p>
                <p className="text-xs text-muted">For {g.recipientName}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blush">
                  <div className="h-full rounded-full bg-rose" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">{formatINR(collected)} of {formatINR(g.goalAmount)} collected</p>
              </Link>
            );
          })}
          {gifts.length === 0 && <p className="py-6 text-center text-sm text-muted">No group gifts yet.</p>}
        </div>
      </main>
      <CustomerBottomNav />
    </div>
  );
}
