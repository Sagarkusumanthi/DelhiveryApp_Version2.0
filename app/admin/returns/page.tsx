"use client";
import { useEffect, useState } from "react";
import { Sparkline } from "@/components/Sparkline";

interface Analytics {
  returnRate: number;
  rejectedCount: number;
  trend: { label: string; count: number }[];
  topReasons: { reason: string; count: number }[];
  rejectionsByStore: { name: string; pct: number; count: number }[];
  worstStore: { name: string; pct: number; count: number };
  busiestStore: { name: string; orderCount: number };
}

export default function AdminReturnsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/returns").then((r) => r.json()).then((d) => setData(d.analytics));
  }, []);

  if (!data) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;

  const maxReason = Math.max(1, ...data.topReasons.map((r) => r.count));
  const maxStorePct = Math.max(1, ...data.rejectionsByStore.map((s) => s.pct));

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Returns &amp; analytics</h1>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs text-muted">Return rate (all time)</p>
          <p className="mt-1 text-xl font-semibold text-ink">{data.returnRate}%</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs text-muted">Rejected orders</p>
          <p className="mt-1 text-xl font-semibold text-ink">{data.rejectedCount}</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-white p-4">
        <p className="mb-1 text-sm font-semibold text-ink">Rejections trend (last 7 days)</p>
        <Sparkline buckets={data.trend.map((d) => d.count)} color="#E24B4A" />
        <p className="mt-1 text-[11px] text-muted">Real rejected-order volume from your platform data.</p>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-white p-4">
        <p className="mb-2.5 text-sm font-semibold text-ink">Top rejection reasons</p>
        {data.topReasons.length === 0 ? (
          <p className="text-sm text-muted">No rejected orders yet.</p>
        ) : (
          data.topReasons.map(({ reason, count }) => (
            <div key={reason} className="mb-2">
              <div className="mb-1 flex justify-between text-xs">
                <span>{reason}</span>
                <span className="font-semibold">{count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-rose" style={{ width: `${(count / maxReason) * 100}%` }} />
              </div>
            </div>
          ))
        )}
        <p className="mt-1 text-[11px] text-muted">Grouped from the actual reasons store owners entered when rejecting.</p>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-white p-4">
        <p className="mb-2.5 text-sm font-semibold text-ink">Rejections by store</p>
        {data.rejectionsByStore.map((s) => (
          <div key={s.name} className="mb-2">
            <div className="mb-1 flex justify-between text-xs">
              <span>{s.name}</span>
              <span className="font-semibold">{s.pct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-ink" style={{ width: `${(s.pct / maxStorePct) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-ink">Key facts (computed from real data)</p>
        {data.worstStore.count > 0 ? (
          <p className="my-1 text-xs">
            📌 <b>{data.worstStore.name}</b> has the highest reject rate at {data.worstStore.pct.toFixed(1)}% ({data.worstStore.count} rejected order{data.worstStore.count > 1 ? "s" : ""}).
          </p>
        ) : (
          <p className="my-1 text-xs">📌 No store has any rejected orders right now.</p>
        )}
        {data.busiestStore.orderCount > 0 && (
          <p className="my-1 text-xs">📌 <b>{data.busiestStore.name}</b> has the most orders overall ({data.busiestStore.orderCount}).</p>
        )}
      </div>
    </div>
  );
}
