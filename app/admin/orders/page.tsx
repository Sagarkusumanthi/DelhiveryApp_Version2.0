"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_VALUES } from "@/lib/constants";
import { STATUS_LABELS } from "@/lib/demo";

interface Order { id: string; code: string; status: string; total: number; recipientName: string }

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [overrideFor, setOverrideFor] = useState<string | null>(null);
  const [target, setTarget] = useState<string>(ORDER_STATUS_VALUES[0]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
  }
  useEffect(load, []);

  async function submitOverride(id: string) {
    setError(null);
    if (reason.trim().length < 3) { setError("Please provide a reason (min 3 characters)."); return; }
    const res = await fetch(`/api/admin/orders/${id}/override`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus: target, reason }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? "Could not override this order."); return; }
    setOverrideFor(null);
    setReason("");
    load();
  }

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Orders</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{o.code}</p>
              <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-ink">{STATUS_LABELS[o.status] ?? o.status}</span>
            </div>
            <p className="text-sm text-muted">For {o.recipientName} · {formatINR(o.total)}</p>
            {overrideFor === o.id ? (
              <div className="mt-3 space-y-2 rounded-xl bg-blush/40 p-3">
                <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                  {ORDER_STATUS_VALUES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
                </Select>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for override (min 3 characters)"
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm"
                />
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => submitOverride(o.id)}>Confirm override</Button>
                  <Button size="sm" variant="outline" onClick={() => { setOverrideFor(null); setError(null); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button
                className="mt-2 text-xs font-semibold text-rose"
                onClick={() => { setOverrideFor(o.id); setTarget(o.status); setReason(""); }}
              >
                Admin override
              </button>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="py-6 text-center text-sm text-muted">No orders yet.</p>}
      </div>
    </div>
  );
}
