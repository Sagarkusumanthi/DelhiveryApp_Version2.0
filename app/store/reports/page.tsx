"use client";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import { Sparkline } from "@/components/Sparkline";
import { STATUS_LABELS } from "@/lib/demo";

interface Reports {
  totalSales: number; deliveredCount: number; avgOrderValue: number;
  salesTrend: { count: number }[]; ordersTrend: { count: number }[]; byStatus: Record<string, number>;
}

export default function StoreReportsPage() {
  const [reports, setReports] = useState<Reports | null>(null);

  useEffect(() => {
    fetch("/api/store/reports").then((r) => r.json()).then((d) => setReports(d.reports));
  }, []);

  if (!reports) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Reports</h1>

      <div className="mb-4 rounded-2xl border border-border bg-white p-4">
        <p className="mb-2.5 text-sm font-semibold text-ink">Sales</p>
        <div className="flex items-center justify-between border-t border-border py-2">
          <div>
            <p className="text-xs text-muted">Total sales (delivered)</p>
            <p className="mt-0.5 text-lg font-semibold text-ink">{formatINR(reports.totalSales)}</p>
          </div>
          <Sparkline buckets={reports.salesTrend.map((d) => d.count)} color="#1D9E75" />
        </div>
        <div className="flex items-center justify-between border-t border-border py-2">
          <div>
            <p className="text-xs text-muted">Orders delivered</p>
            <p className="mt-0.5 text-lg font-semibold text-ink">{reports.deliveredCount}</p>
          </div>
          <Sparkline buckets={reports.ordersTrend.map((d) => d.count)} color="#D9663F" />
        </div>
        <div className="flex items-center justify-between border-t border-border py-2">
          <div>
            <p className="text-xs text-muted">Avg order value</p>
            <p className="mt-0.5 text-lg font-semibold text-ink">{formatINR(reports.avgOrderValue)}</p>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          Based on your actual order history to date — no projected or estimated figures.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-ink">Orders by status</p>
        {Object.entries(reports.byStatus).map(([status, count]) =>
          count > 0 ? (
            <div key={status} className="flex justify-between py-1 text-sm">
              <span className="text-muted">{STATUS_LABELS[status] ?? status}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
