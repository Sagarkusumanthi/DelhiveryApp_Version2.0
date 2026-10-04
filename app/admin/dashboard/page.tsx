"use client";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

interface Stats { storeCount: number; productCount: number; orderCount: number; revenue: number; byStatus: Record<string, number> }

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then((d) => setStats(d.stats));
  }, []);

  if (!stats) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;

  const cards = [
    { label: "Stores", value: stats.storeCount },
    { label: "Products", value: stats.productCount },
    { label: "Orders", value: stats.orderCount },
    { label: "Revenue (delivered)", value: formatINR(stats.revenue) },
  ];

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Platform overview</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-white p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 text-xl font-semibold text-ink">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-ink">Orders by status</p>
        {Object.entries(stats.byStatus).map(([status, count]) => (
          <div key={status} className="flex justify-between border-b border-border py-1 text-sm last:border-0">
            <span className="text-muted">{status.replaceAll("_", " ")}</span>
            <span className="font-semibold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
