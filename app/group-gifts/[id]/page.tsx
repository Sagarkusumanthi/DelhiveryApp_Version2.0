"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface Contributor { id: string; name: string; amount: number; paid: boolean }
interface GroupGift {
  id: string; title: string; recipientName: string; goalAmount: number; deliveryDate: string;
  message: string | null; contributors: Contributor[];
}

export default function GroupGiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [gift, setGift] = useState<GroupGift | null>(null);
  const [copied, setCopied] = useState(false);

  function load() {
    fetch(`/api/group-gifts/${id}`).then((r) => r.json()).then((d) => setGift(d.groupGift));
  }
  useEffect(load, [id]);

  async function markPaid(contributorId: string) {
    await fetch(`/api/group-gifts/${id}/contributors/${contributorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true }),
    });
    load();
  }

  function share() {
    navigator.clipboard?.writeText(`https://giftly.demo/group/${id}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!gift) {
    return (
      <div>
        <CustomerHeader />
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const collected = gift.contributors.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-md px-4 py-4">
        <button onClick={() => router.back()} className="mb-3 text-sm font-medium text-muted">← Back</button>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-serif text-lg font-semibold text-ink">Group Gift Details</p>
          <Button size="sm" variant="outline" onClick={share}>🔗 {copied ? "Copied!" : "Share"}</Button>
        </div>
        <div className="mb-4 rounded-3xl border border-border bg-white p-4">
          <p className="font-semibold text-ink">{gift.title}</p>
          <p className="text-xs text-muted">For {gift.recipientName} · delivering {new Date(gift.deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          {gift.message && <p className="mt-2 text-sm italic text-ink/80">&ldquo;{gift.message}&rdquo;</p>}
        </div>

        <div className="mb-4 space-y-2">
          {gift.contributors.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-xs font-bold text-rose">
                {c.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <p className="flex-1 text-sm font-semibold">{c.name}</p>
              <p className="text-sm font-semibold">{formatINR(c.amount)}</p>
              {c.paid ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">✓ Paid</span>
              ) : (
                <Button size="sm" onClick={() => markPaid(c.id)}>Mark Paid</Button>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-white p-4 text-sm">
          <div className="flex justify-between border-b border-border py-1"><span className="text-muted">Goal</span><span className="font-semibold">{formatINR(gift.goalAmount)}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">Collected</span><span className="font-semibold text-emerald-700">{formatINR(collected)}</span></div>
        </div>
      </main>
    </div>
  );
}
