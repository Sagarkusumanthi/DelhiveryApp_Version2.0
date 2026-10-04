"use client";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

interface Order { status: string; total: number }

export default function StoreDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    fetch("/api/store/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
  }, []);

  const newOrders = orders.filter((o) => o.status === "ORDER_PLACED").length;
  const inProgress = orders.filter((o) => ["STORE_ACCEPTED", "PREPARING_GIFT", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const revenue = delivered.reduce((s, o) => s + o.total, 0);

  const cards = [
    { label: "New orders", value: newOrders },
    { label: "In progress", value: inProgress },
    { label: "Delivered", value: delivered.length },
    { label: "Revenue", value: formatINR(revenue) },
  ];

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-white p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 text-xl font-semibold text-ink">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
