"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/CustomerHeader";
import { CustomerBottomNav } from "@/components/CustomerBottomNav";
import { formatINR } from "@/lib/utils";
import { STATUS_LABELS as STATUS_LABEL } from "@/lib/demo";

interface Order {
  id: string; code: string; status: string; total: number; recipientName: string; createdAt: string;
  items: { product: { name: string; icon: string } }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then((d) => {
      setOrders(d.orders ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="pb-20 sm:pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="mb-4 font-serif text-xl font-semibold text-ink">My Orders</h1>
        {loading ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white p-8 text-center">
            <p className="text-sm text-muted">No orders yet.</p>
            <Link href="/" className="mt-3 inline-block text-sm font-semibold text-rose">Browse gifts →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}/track`}
                className="block rounded-2xl border border-border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{o.code}</p>
                  <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-ink">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{o.items[0]?.product?.name} · For {o.recipientName}</p>
                <p className="mt-1 text-sm font-semibold">{formatINR(o.total)}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <CustomerBottomNav />
    </div>
  );
}
