"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatINR } from "@/lib/utils";

interface Order {
  id: string; code: string; status: string; total: number; recipientName: string; createdAt: string;
  history: { at: string }[]; items: { product: { name: string } }[];
}
interface Store { id: string; name: string; category: string; open: boolean; city: { name: string } }

function orderTitle(o: Order) {
  const first = o.items[0]?.product?.name ?? "";
  const extra = o.items.length - 1;
  return extra > 0 ? `${first} +${extra} more` : first;
}

function BarChart({ buckets, labels }: { buckets: number[]; labels: string[] }) {
  const max = Math.max(1, ...buckets);
  return (
    <div>
      <div className="mt-2.5 flex h-[70px] items-end gap-1.5">
        {buckets.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center">
            <div
              className={`w-full max-w-[22px] rounded-t ${i === buckets.length - 1 ? "bg-rose" : "bg-ink"}`}
              style={{ height: Math.max(4, Math.round((v / max) * 56)) }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {buckets.map((_, i) => (
          <div key={i} className="flex-1 text-center text-[8px] text-muted">{i % 2 === 0 ? labels[i] : ""}</div>
        ))}
      </div>
    </div>
  );
}

export default function StoreDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  function load() {
    fetch("/api/store/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
    fetch("/api/store/profile").then((r) => r.json()).then((d) => setStore(d.store));
  }
  useEffect(load, []);

  async function toggleOpen() {
    if (!store) return;
    const open = !store.open;
    setStore({ ...store, open });
    await fetch("/api/store/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open }),
    });
  }

  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const newOrderCount = orders.filter((o) => o.status === "ORDER_PLACED").length;
  const totalSales = delivered.reduce((s, o) => s + o.total, 0);

  const hourLabels = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];
  const buckets = new Array(8).fill(0);
  for (const o of orders) {
    const placedAt = o.history[0]?.at ?? o.createdAt;
    const h = new Date(placedAt).getHours();
    buckets[Math.floor(h / 3)]++;
  }

  const quickLinks: [string, string, string][] = [
    ["🛍️", "Products", "/store/products"],
    ["📦", "Orders", "/store/orders"],
    ["🏪", "Store profile", "/store/profile"],
    ["📊", "Reports", "/store/reports"],
  ];

  if (!store) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-serif text-lg font-bold text-ink">{store.name}</p>
          <p className="mt-0.5 text-xs text-muted">{store.city.name} · {store.category}</p>
        </div>
        <button
          onClick={toggleOpen}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            store.open ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${store.open ? "bg-emerald-500" : "bg-red-600"}`} />
          {store.open ? "Open · Accepting orders" : "Closed"}
        </button>
      </div>

      <p className="mb-2 mt-5 font-serif text-base font-semibold text-ink">Quick links</p>
      <div className="grid grid-cols-4 gap-2">
        {quickLinks.map(([icon, label, href]) => {
          const badge = href === "/store/orders" ? newOrderCount : 0;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="relative rounded-2xl border border-border bg-white px-1.5 py-3 text-center"
            >
              {badge > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-rose px-1 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
              <span className="block text-xl">{icon}</span>
              <span className="mt-1 block text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted">Total sales (delivered)</p>
            <p className="mt-0.5 text-lg font-bold text-ink">{formatINR(totalSales)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Total orders</p>
            <p className="mt-0.5 text-lg font-bold text-ink">{orders.length}</p>
          </div>
          <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">● Live</span>
        </div>
        <BarChart buckets={buckets} labels={hourLabels} />
        <p className="mt-1.5 text-[10px] text-muted">Orders placed by hour of day, from your real order history</p>
      </div>

      <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-muted">Recent orders</p>
      <div className="space-y-2">
        {orders.slice(0, 5).map((o) => (
          <button
            key={o.id}
            onClick={() => router.push(`/store/orders/${o.id}`)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-white p-3.5 text-left"
          >
            <div>
              <p className="text-xs text-muted">{o.code}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{orderTitle(o)}</p>
              <p className="mt-0.5 text-xs text-muted">{o.recipientName}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={o.status} />
              <p className="mt-1.5 text-sm font-semibold">{formatINR(o.total)}</p>
            </div>
          </button>
        ))}
        {orders.length === 0 && <p className="py-6 text-center text-sm text-muted">No orders yet.</p>}
      </div>
    </div>
  );
}
