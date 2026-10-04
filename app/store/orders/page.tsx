"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface Order {
  id: string; code: string; status: string; total: number; recipientName: string;
  items: { product: { name: string }; qty: number }[];
}

const STORE_NEXT: Record<string, string> = {
  STORE_ACCEPTED: "PREPARING_GIFT",
  PREPARING_GIFT: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "OUT_FOR_DELIVERY",
};
const ADVANCE_LABEL: Record<string, string> = {
  STORE_ACCEPTED: "Start preparing",
  PREPARING_GIFT: "Mark ready for pickup",
  READY_FOR_PICKUP: "Mark out for delivery",
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"new" | "active" | "all">("new");

  function load() {
    fetch("/api/store/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
  }
  useEffect(load, []);

  async function act(id: string, status: string, reason?: string) {
    await fetch(`/api/store/orders/${id}/transition`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    load();
  }

  async function reject(id: string) {
    const reason = window.prompt("Reason for rejecting this order (min 3 characters):");
    if (!reason || reason.trim().length < 3) return;
    await act(id, "REJECTED", reason);
  }

  const filtered = orders.filter((o) => {
    if (tab === "new") return o.status === "ORDER_PLACED";
    if (tab === "active") return ["STORE_ACCEPTED", "PREPARING_GIFT", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status);
    return true;
  });

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Orders</h1>
      <div className="mb-4 flex gap-2 rounded-full bg-blush p-1">
        {(["new", "active", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-ink text-white" : "text-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((o) => (
          <div key={o.id} className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <Link href={`/store/orders/${o.id}`} className="text-sm font-semibold text-ink">{o.code}</Link>
              <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-ink">{o.status.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{o.items.map((i) => `${i.product.name} ×${i.qty}`).join(", ")}</p>
            <p className="text-sm text-muted">For {o.recipientName} · {formatINR(o.total)}</p>
            <div className="mt-2 flex gap-2">
              {o.status === "ORDER_PLACED" && (
                <>
                  <Button size="sm" onClick={() => act(o.id, "STORE_ACCEPTED")}>Accept</Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(o.id)}>Reject</Button>
                </>
              )}
              {STORE_NEXT[o.status] && (
                <Button size="sm" onClick={() => act(o.id, STORE_NEXT[o.status])}>{ADVANCE_LABEL[o.status]}</Button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted">No orders here.</p>}
      </div>
    </div>
  );
}
