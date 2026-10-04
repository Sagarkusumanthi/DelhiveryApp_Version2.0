"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { demoRating, storeHoursLabel } from "@/lib/demo";

interface StoreDetail {
  store: { id: string; name: string; icon: string; category: string; owner: string; open: boolean; openTime: string; closeTime: string; city: { name: string } };
  productCount: number; active: number; completed: number; returnPct: number; revenue: number; totalOrders: number;
}

export default function AdminStoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<StoreDetail | null>(null);

  function load() {
    fetch(`/api/admin/stores/${id}`).then((r) => r.json()).then(setData);
  }
  useEffect(load, [id]);

  async function toggleBan() {
    if (!data) return;
    const open = !data.store.open;
    await fetch(`/api/admin/stores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open }),
    });
    load();
  }

  if (!data) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;
  const { store } = data;

  return (
    <div className="mx-auto max-w-md">
      <button onClick={() => router.push("/admin/stores")} className="mb-3 text-sm font-medium text-muted">← Back</button>
      <p className="mb-3 font-serif text-lg font-bold text-ink">Store Profile</p>

      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blush text-2xl">{store.icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-ink">{store.name}</p>
          <p className="text-xs text-muted">{store.category} · {store.city.name}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${store.open ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
          {store.open ? "Open" : "Closed"}
        </span>
      </div>

      <div className="mb-3 rounded-2xl border border-border bg-white p-4 text-sm">
        <div className="flex justify-between py-1"><span className="text-muted">Owner</span><span className="font-semibold">{store.owner || "—"}</span></div>
        <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Rating (demo)</span><span className="font-semibold">⭐ {demoRating(store.id).toFixed(1)}</span></div>
        <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Hours</span><span className="font-semibold">{storeHoursLabel(store)}</span></div>
        <div className="flex justify-between border-t border-border py-1"><span className="text-muted">Products listed</span><span className="font-semibold">{data.productCount}</span></div>
      </div>

      <div className="mb-3 rounded-2xl border border-border bg-white p-4">
        <p className="mb-2.5 text-sm font-bold text-ink">Performance (all time, real data)</p>
        <div className="flex justify-between text-center">
          <div className="flex-1"><p className="text-lg font-bold">{data.active}</p><p className="text-[10px] text-muted">Active orders</p></div>
          <div className="flex-1"><p className="text-lg font-bold">{data.completed}</p><p className="text-[10px] text-muted">Completed</p></div>
          <div className="flex-1"><p className="text-lg font-bold">{data.returnPct}%</p><p className="text-[10px] text-muted">Returns</p></div>
        </div>
        <div className="mt-2.5 flex justify-between border-t border-border pt-2 text-xs">
          <span className="text-muted">Revenue from delivered orders</span>
          <span className="font-bold">{formatINR(data.revenue)}</span>
        </div>
      </div>

      <Button
        className={`w-full ${store.open ? "bg-red-600 hover:bg-red-700" : ""}`}
        onClick={toggleBan}
      >
        {store.open ? "Close store" : "Reopen store"}
      </Button>
    </div>
  );
}
