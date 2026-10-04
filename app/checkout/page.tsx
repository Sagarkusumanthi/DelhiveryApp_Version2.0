"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCart } from "@/lib/hooks/useCart";
import { useSession } from "@/lib/hooks/useSession";
import { DELIVERY_FEES, OCCASIONS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

interface Product { id: string; name: string; price: number; icon: string }
interface Store { id: string; name: string }

const DELIVERY_OPTION_META: Record<string, { label: string; sub: string; icon: string }> = {
  STANDARD: { label: "Standard Delivery", sub: "Delivers in 2-3 days", icon: "🚚" },
  EXPRESS: { label: "Same-day Express", sub: "Delivers today, within 4-6 hours", icon: "⚡" },
  SCHEDULED: { label: "Scheduled Delivery", sub: "Choose a date and time", icon: "📅" },
};

export default function CheckoutPage() {
  const router = useRouter();
  const session = useSession();
  const { cart, itemsArray, addItem, clearCart } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState({
    recipientFirstName: "", recipientLastName: "", recipientPhone: "", recipientAddress: "",
    occasion: "Birthday", message: "", sender: "",
    deliveryOption: "STANDARD" as "STANDARD" | "EXPRESS" | "SCHEDULED",
    paymentMethod: "UPI" as "CARD" | "UPI",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all(itemsArray.map((i) => fetch(`/api/products/${i.productId}`).then((r) => r.json()))).then((results) => {
      const map: Record<string, Product> = {};
      for (const r of results) if (r.product) map[r.product.id] = r.product;
      setProducts(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cart.storeId) fetch(`/api/stores/${cart.storeId}`).then((r) => r.json()).then((d) => setStore(d.store));
  }, [cart.storeId]);

  // Pre-fill sender name with the logged-in customer's name, matching the prototype.
  useEffect(() => {
    if (session && session.name) setForm((f) => (f.sender ? f : { ...f, sender: session.name }));
  }, [session]);

  const subtotal = itemsArray.reduce((sum, i) => sum + (products[i.productId]?.price ?? 0) * i.qty, 0);
  const fee = DELIVERY_FEES[form.deliveryOption];
  const total = subtotal + fee;

  if (itemsArray.length === 0) {
    return (
      <div>
        <CustomerHeader />
        <main className="mx-auto max-w-2xl px-4 py-4">
          <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted">Your cart is empty.</div>
          <Button className="mt-3 w-full" onClick={() => router.push("/")}>Browse gifts</Button>
        </main>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: itemsArray }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not place the order. Please try again.");
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/orders/${data.order.id}/confirmed`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <button onClick={() => store && router.push(`/stores/${store.id}`)} className="mb-1 text-sm font-medium text-muted">← Back</button>
        <p className="font-serif text-xl font-bold text-ink">Checkout</p>
        <p className="mb-3.5 mt-0.5 text-xs text-muted">Send a little love 💗</p>

        <form onSubmit={submit} className="space-y-4">
          <section className="rounded-2xl border border-border bg-white p-4">
            {itemsArray.map((i) => {
              const p = products[i.productId];
              if (!p) return null;
              return (
                <div key={i.productId} className="flex items-center gap-3 py-1.5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blush text-2xl">{p.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-muted">{formatINR(p.price)}</p>
                    {store && <p className="text-[10px] text-muted">🏪 Fulfilled by {store.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cart.storeId && addItem(cart.storeId, i.productId, -1)}
                      className="h-6 w-6 rounded-full border border-border text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-4 text-center text-sm font-semibold">{i.qty}</span>
                    <button
                      type="button"
                      onClick={() => cart.storeId && addItem(cart.storeId, i.productId, 1)}
                      className="h-6 w-6 rounded-full border border-border text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush text-sm">👤</span>
              Recipient Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input
                  value={form.recipientFirstName}
                  onChange={(e) => setForm((f) => ({ ...f, recipientFirstName: e.target.value.replace(/[^A-Za-z '-]/g, "") }))}
                  required
                />
              </div>
              <div>
                <Label>Last name</Label>
                <Input
                  value={form.recipientLastName}
                  onChange={(e) => setForm((f) => ({ ...f, recipientLastName: e.target.value.replace(/[^A-Za-z '-]/g, "") }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.recipientPhone}
                onChange={(e) => setForm((f) => ({ ...f, recipientPhone: e.target.value }))}
                placeholder="98XXXXXXXX"
                required
              />
            </div>
            <div>
              <Label>Full delivery address</Label>
              <Input
                value={form.recipientAddress}
                onChange={(e) => setForm((f) => ({ ...f, recipientAddress: e.target.value }))}
                placeholder="Flat, street, area…"
                required
              />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush text-sm">🎀</span>
              Gift Message
            </p>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              maxLength={250}
              rows={2}
              placeholder="Write something heartfelt…"
              className="w-full rounded-2xl border border-dashed border-rose bg-blush px-3 py-2 text-sm outline-none"
            />
            <div>
              <Label>Occasion</Label>
              <Select value={form.occasion} onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}>
                {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
            <div>
              <Label>Sender name</Label>
              <Input value={form.sender} onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4">
            <p className="mb-2.5 flex items-center gap-2 text-sm font-bold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush text-sm">🚚</span>
              Delivery Options
            </p>
            <div className="space-y-2">
              {(["STANDARD", "EXPRESS", "SCHEDULED"] as const).map((opt) => {
                const m = DELIVERY_OPTION_META[opt];
                return (
                  <label key={opt} className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm">
                    <input
                      type="radio"
                      checked={form.deliveryOption === opt}
                      onChange={() => setForm((f) => ({ ...f, deliveryOption: opt }))}
                      className="accent-rose"
                    />
                    <span>{m.icon}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold">{m.label}</span>
                      <span className="text-[11px] text-muted">{m.sub}</span>
                    </span>
                    <span className="text-sm font-bold">{formatINR(DELIVERY_FEES[opt])}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted">Delivery estimates shown are approximate.</p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4">
            <p className="mb-2.5 flex items-center gap-2 text-sm font-bold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush text-sm">💳</span>
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center gap-1 rounded-xl border border-border px-2 py-3.5 text-center">
                <input
                  type="radio"
                  checked={form.paymentMethod === "UPI"}
                  onChange={() => setForm((f) => ({ ...f, paymentMethod: "UPI" }))}
                  className="accent-rose"
                />
                <span className="text-xl">📱</span>
                <span className="text-xs font-bold">UPI</span>
                <span className="text-[10px] text-muted">Pay via any UPI app</span>
              </label>
              <label className="flex flex-col items-center gap-1 rounded-xl border border-border px-2 py-3.5 text-center">
                <input
                  type="radio"
                  checked={form.paymentMethod === "CARD"}
                  onChange={() => setForm((f) => ({ ...f, paymentMethod: "CARD" }))}
                  className="accent-rose"
                />
                <span className="text-xl">💳</span>
                <span className="text-xs font-bold">Credit Card</span>
                <span className="text-[10px] text-muted">Visa, Mastercard, Amex</span>
              </label>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-amber-700">No real payment will be collected or processed.</p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4 text-sm">
            <p className="mb-2.5 flex items-center gap-2 font-bold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush text-sm">🧾</span>
              Order Summary
            </p>
            <div className="flex justify-between py-0.5"><span className="text-muted">Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between py-0.5"><span className="text-muted">Delivery fee</span><span>{formatINR(fee)}</span></div>
            <div className="mt-1.5 flex justify-between border-t border-border pt-2 font-bold"><span>Total</span><span>{formatINR(total)}</span></div>
          </section>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full py-3.5">
            {loading ? "Placing order…" : `Place Order · ${formatINR(total)} →`}
          </Button>
          <p className="text-center text-[11px] text-muted">
            This is a demo — no real order is placed with a store.
          </p>
        </form>
      </main>
    </div>
  );
}
