"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OrderTimeline } from "@/components/OrderTimeline";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface Order {
  id: string; code: string; status: string; total: number; recipientName: string; recipientPhone: string;
  recipientAddress: string; message: string | null; rejectionReason: string | null;
  items: { product: { name: string; icon: string; price: number }; qty: number }[];
}

const STORE_NEXT: Record<string, string> = {
  STORE_ACCEPTED: "PREPARING_GIFT",
  PREPARING_GIFT: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "OUT_FOR_DELIVERY",
};

export default function StoreOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  function load() {
    fetch(`/api/store/orders/${id}`).then((r) => r.json()).then((d) => setOrder(d.order));
  }
  useEffect(load, [id]);

  async function act(status: string, reason?: string) {
    await fetch(`/api/store/orders/${id}/transition`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    load();
  }

  async function reject() {
    const reason = window.prompt("Reason for rejecting this order (min 3 characters):");
    if (!reason || reason.trim().length < 3) return;
    act("REJECTED", reason);
  }

  if (!order) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-md">
      <button onClick={() => router.back()} className="mb-3 text-sm font-medium text-muted">← Back</button>
      <div className="mb-4 rounded-3xl border border-border bg-white p-4">
        <p className="font-serif text-lg font-semibold text-ink">{order.code}</p>
        <p className="text-xs text-muted">For {order.recipientName} · {order.recipientPhone}</p>
        <p className="text-xs text-muted">{order.recipientAddress}</p>
        {order.message && <p className="mt-1 text-sm italic text-ink/80">&ldquo;{order.message}&rdquo;</p>}
      </div>
      <div className="mb-4 rounded-3xl border border-border bg-white p-4">
        <OrderTimeline status={order.status} />
        {order.rejectionReason && <p className="text-xs text-muted">Reason: {order.rejectionReason}</p>}
      </div>
      <div className="mb-4 rounded-3xl border border-border bg-white p-4">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between py-1 text-sm">
            <span>{it.product.icon} {it.product.name} × {it.qty}</span>
            <span className="text-muted">{formatINR(it.product.price * it.qty)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-semibold">
          <span>Total</span><span>{formatINR(order.total)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        {order.status === "ORDER_PLACED" && (
          <>
            <Button onClick={() => act("STORE_ACCEPTED")}>Accept order</Button>
            <Button variant="destructive" onClick={reject}>Reject</Button>
          </>
        )}
        {STORE_NEXT[order.status] && <Button onClick={() => act(STORE_NEXT[order.status])}>Advance status</Button>}
      </div>
    </div>
  );
}
