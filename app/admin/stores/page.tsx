"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { demoRating } from "@/lib/demo";

interface Store { id: string; name: string; category: string; icon: string; open: boolean; cityId: string }
interface Order { status: string; items: { product: { storeId: string } }[] }

const ACTIVE = ["ORDER_PLACED", "STORE_ACCEPTED", "PREPARING_GIFT", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];

export default function AdminStoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "open" | "closed">("all");

  function load() {
    fetch("/api/stores").then((r) => r.json()).then((d) => setStores(d.stores ?? []));
    fetch("/api/admin/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
  }
  useEffect(load, []);

  async function toggle(id: string, open: boolean) {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, open } : s)));
    await fetch(`/api/admin/stores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open }),
    });
  }

  const statsByStore = useMemo(() => {
    const map: Record<string, { active: number; completed: number; rejected: number; total: number }> = {};
    for (const s of stores) map[s.id] = { active: 0, completed: 0, rejected: 0, total: 0 };
    for (const o of orders) {
      const storeId = o.items[0]?.product?.storeId;
      if (!storeId || !map[storeId]) continue;
      map[storeId].total++;
      if (ACTIVE.includes(o.status)) map[storeId].active++;
      if (o.status === "DELIVERED") map[storeId].completed++;
      if (o.status === "REJECTED") map[storeId].rejected++;
    }
    return map;
  }, [stores, orders]);

  const q = query.trim().toLowerCase();
  const openCount = stores.filter((s) => s.open).length;
  let list = stores;
  if (q) list = list.filter((s) => s.name.toLowerCase().includes(q));
  if (tab === "open") list = list.filter((s) => s.open);
  if (tab === "closed") list = list.filter((s) => !s.open);

  return (
    <div>
      <h1 className="mb-3 font-serif text-lg font-bold text-ink">Stores ({stores.length})</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stores by name or city…"
        className="w-full rounded-full border border-border px-4 py-2.5 text-sm outline-none"
      />
      <div className="my-3 flex gap-2 rounded-full bg-blush p-1">
        {([["all", `All (${stores.length})`], ["open", `Open (${openCount})`], ["closed", `Closed (${stores.length - openCount})`]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold ${tab === key ? "bg-ink text-white" : "text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {list.map((s) => {
          const stats = statsByStore[s.id] ?? { active: 0, completed: 0, rejected: 0, total: 0 };
          const returnPct = stats.total ? ((stats.rejected / stats.total) * 100).toFixed(1) : "0.0";
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blush text-xl">{s.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{s.name}</p>
                  <p className="text-xs text-muted">⭐ {demoRating(s.id).toFixed(1)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.open ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {s.open ? "Open" : "Closed"}
                </span>
              </div>
              <div className="mt-2.5 flex justify-between border-t border-border pt-2 text-center">
                <div className="flex-1"><p className="text-sm font-bold">{stats.active}</p><p className="text-[10px] text-muted">Active orders</p></div>
                <div className="flex-1"><p className="text-sm font-bold">{stats.completed}</p><p className="text-[10px] text-muted">Completed</p></div>
                <div className="flex-1"><p className="text-sm font-bold">{returnPct}%</p><p className="text-[10px] text-muted">Returns</p></div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/admin/stores/${s.id}`)}>
                  View store profile →
                </Button>
                <Button size="sm" variant={s.open ? "destructive" : "primary"} onClick={() => toggle(s.id, !s.open)}>
                  {s.open ? "Close store" : "Reopen store"}
                </Button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="py-6 text-center text-sm text-muted">No stores match.</p>}
      </div>
    </div>
  );
}
