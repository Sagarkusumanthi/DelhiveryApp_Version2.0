"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface Contributor { id: string; name: string; amount: number; paid: boolean }
interface GroupGift {
  id: string; title: string; recipientName: string; occasionType: string; goalAmount: number;
  deliveryDate: string; message: string | null; productIds: string[];
  deliveryCity: { name: string }; contributors: Contributor[];
}
interface Product { id: string; name: string; price: number; icon: string; store: { name: string } }

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function GroupGiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [gift, setGift] = useState<GroupGift | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [copied, setCopied] = useState(false);

  function load() {
    fetch(`/api/group-gifts/${id}`).then((r) => r.json()).then((d) => setGift(d.groupGift));
  }
  useEffect(load, [id]);

  useEffect(() => {
    if (!gift) return;
    Promise.all(gift.productIds.map((pid) => fetch(`/api/products/${pid}`).then((r) => r.json()))).then((results) => {
      setProducts(results.map((r) => r.product).filter(Boolean));
    });
  }, [gift]);

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
  const pct = Math.min(100, Math.round((collected / gift.goalAmount) * 100));
  const ready = collected >= gift.goalAmount;
  const paidCount = gift.contributors.filter((c) => c.paid).length;
  const pendingCount = gift.contributors.length - paidCount;
  const storeNames = [...new Set(products.map((p) => p.store.name))].join(", ");
  const remaining = Math.max(0, gift.goalAmount - collected);

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-md px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push("/group-gifts")} className="text-lg text-ink">←</button>
            <p className="font-serif text-base font-bold text-ink">Group Gift Details</p>
          </div>
        </div>

        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
          Selected gifts ({products.length})
        </p>
        {products.map((p, i) => (
          <div key={p.id} className="mb-2 flex items-center gap-2.5 rounded-xl border border-border bg-white p-2.5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blush text-xl">{p.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{p.name}</p>
              <p className="text-xs text-muted">{p.store.name}</p>
            </div>
            <p className="text-sm font-bold text-rose">{formatINR(p.price)}</p>
            {i === 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                {ready ? "✓ Ready" : "⏳ In Progress"}
              </span>
            )}
          </div>
        ))}

        <div className="mt-3 rounded-xl border border-border bg-white p-3 text-sm">
          <div className="flex justify-between py-1"><span className="text-muted">Recipient</span><span className="font-semibold">{gift.recipientName}</span></div>
          <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Occasion</span><span className="font-semibold">{gift.occasionType}</span></div>
          <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Delivery Date</span><span className="font-semibold">{new Date(gift.deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
          <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Delivery City</span><span className="font-semibold">{gift.deliveryCity.name}</span></div>
          <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Store{products.length > 1 ? "s" : ""}</span><span className="text-right font-semibold">{storeNames}</span></div>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-white p-3">
          <p className="text-sm font-bold text-ink">
            {formatINR(collected)} of {formatINR(gift.goalAmount)} collected <span className="text-rose">{pct}%</span>
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-rose" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-[11px] text-muted">{gift.contributors.length} people · {paidCount} contributed · {pendingCount} pending</p>
            {pendingCount > 0 && <Button size="sm" variant="outline">🔔 Send Reminder</Button>}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="font-serif text-sm font-semibold text-ink">Contributors ({gift.contributors.length})</p>
          <Button size="sm" variant="outline" onClick={share}>🔗 {copied ? "Copied!" : "Share"}</Button>
        </div>
        <div className="mt-2 space-y-2">
          {gift.contributors.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-xs font-bold text-rose">{initials(c.name)}</div>
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

        <div className="mt-4 rounded-xl border border-border bg-white p-3 text-sm">
          <div className="flex justify-between py-1"><span className="text-muted">Total Gift Price</span><span className="font-bold">{formatINR(gift.goalAmount)}</span></div>
          <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Collected Amount</span><span className="font-bold text-emerald-700">{formatINR(collected)}</span></div>
          <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Remaining Amount</span><span className={`font-bold ${remaining > 0 ? "text-red-600" : "text-emerald-700"}`}>{formatINR(remaining)}</span></div>
        </div>

        {ready ? (
          <Button className="mt-4 w-full">Proceed to Order →</Button>
        ) : (
          <Button className="mt-4 w-full" variant="outline" disabled>
            Waiting for full contribution ({formatINR(remaining)} more needed)
          </Button>
        )}
      </main>
    </div>
  );
}
