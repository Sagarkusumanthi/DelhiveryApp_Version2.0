"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { OrderTimeline } from "@/components/OrderTimeline";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface OrderItem { product: { name: string; price: number; icon: string }; qty: number }
interface Order {
  id: string; code: string; status: string; total: number; recipientName: string; recipientPhone: string;
  recipientAddress: string; occasion: string | null; message: string | null; rejectionReason: string | null;
  deliveryConfirmedByCustomer: boolean; items: OrderItem[];
}

export default function OrderTrackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [photoDraft, setPhotoDraft] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function load() {
    fetch(`/api/orders/${id}`).then((r) => r.json()).then((d) => setOrder(d.order));
  }
  useEffect(load, [id]);

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPhotoDraft(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function confirmDelivery() {
    setConfirming(true);
    try {
      await fetch(`/api/orders/${id}/confirm-delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, photoDataUrl: photoDraft ?? undefined }),
      });
      setPhotoDraft(null);
      load();
    } finally {
      setConfirming(false);
    }
  }

  if (!order) {
    return (
      <div>
        <CustomerHeader />
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-md px-4 py-4">
        <button onClick={() => router.back()} className="mb-3 text-sm font-medium text-muted">← Back</button>
        <div className="mb-4 rounded-3xl border border-border bg-white p-4 shadow-sm">
          <p className="font-serif text-lg font-semibold text-ink">{order.code}</p>
          <p className="text-xs text-muted">For {order.recipientName} · {order.recipientAddress}</p>
          {order.occasion && <p className="mt-1 text-xs text-muted">Occasion: {order.occasion}</p>}
          {order.message && <p className="mt-1 text-sm italic text-ink/80">&ldquo;{order.message}&rdquo;</p>}
        </div>

        <div className="mb-4 rounded-3xl border border-border bg-white p-4 shadow-sm">
          <OrderTimeline status={order.status} />
          {order.status === "REJECTED" && order.rejectionReason && (
            <p className="mt-1 text-xs text-muted">Reason: {order.rejectionReason}</p>
          )}
        </div>

        <div className="mb-4 rounded-3xl border border-border bg-white p-4 shadow-sm">
          <p className="mb-2 font-serif text-sm font-semibold text-ink">Items</p>
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

        {order.status === "OUT_FOR_DELIVERY" && !order.deliveryConfirmedByCustomer && (
          <div className="rounded-3xl border border-rose/30 bg-white p-4 shadow-sm">
            <p className="mb-2 font-serif text-sm font-semibold text-ink">Confirm delivery</p>
            <p className="mb-3 text-xs text-muted">Add a photo of your received gift (optional) and confirm it arrived.</p>
            {photoDraft ? (
              <img src={photoDraft} alt="Delivery" className="mb-3 max-h-56 w-full rounded-2xl object-cover" />
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="mb-3 flex w-full items-center justify-center rounded-2xl border border-dashed border-border py-6 text-sm text-muted"
              >
                Tap to add a photo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handlePhoto(e.target.files?.[0])} />
            <label className="mb-3 flex items-center gap-2 text-xs text-ink/80">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              I confirm this order was delivered.
            </label>
            <Button className="w-full" disabled={!agreed || confirming} onClick={confirmDelivery}>
              {confirming ? "Confirming…" : "Confirm delivery"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
