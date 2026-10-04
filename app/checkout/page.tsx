"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCart } from "@/lib/hooks/useCart";
import { DELIVERY_FEES, OCCASIONS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

interface Product { id: string; name: string; price: number }

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, itemsArray, clearCart } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [form, setForm] = useState({
    recipientFirstName: "", recipientLastName: "", recipientPhone: "", recipientAddress: "",
    occasion: "Birthday", message: "", sender: "",
    deliveryOption: "STANDARD" as "STANDARD" | "EXPRESS" | "SCHEDULED",
    paymentMethod: "UPI" as "CARD" | "UPI" | "COD",
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

  const subtotal = itemsArray.reduce((sum, i) => sum + (products[i.productId]?.price ?? 0) * i.qty, 0);
  const fee = DELIVERY_FEES[form.deliveryOption];
  const total = subtotal + fee;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (itemsArray.length === 0) { setError("Your cart is empty."); return; }
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
        <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Checkout</h1>
        <form onSubmit={submit} className="space-y-5">
          <section className="space-y-3 rounded-3xl border border-border bg-white p-4">
            <p className="font-serif text-sm font-semibold text-ink">Recipient details</p>
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
              <Label>Phone number</Label>
              <Input
                value={form.recipientPhone}
                onChange={(e) => setForm((f) => ({ ...f, recipientPhone: e.target.value }))}
                placeholder="10-digit number starting with 6-9"
                required
              />
            </div>
            <div>
              <Label>Delivery address</Label>
              <Input
                value={form.recipientAddress}
                onChange={(e) => setForm((f) => ({ ...f, recipientAddress: e.target.value }))}
                required
              />
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-border bg-white p-4">
            <p className="font-serif text-sm font-semibold text-ink">Gift message</p>
            <div>
              <Label>Occasion</Label>
              <Select value={form.occasion} onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}>
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Message (optional)</Label>
              <Input value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} maxLength={250} />
            </div>
            <div>
              <Label>Sender name</Label>
              <Input value={form.sender} onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))} />
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-border bg-white p-4">
            <p className="font-serif text-sm font-semibold text-ink">Delivery option</p>
            {(["STANDARD", "EXPRESS", "SCHEDULED"] as const).map((opt) => (
              <label key={opt} className="flex items-center justify-between rounded-2xl border border-border p-3 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.deliveryOption === opt}
                    onChange={() => setForm((f) => ({ ...f, deliveryOption: opt }))}
                  />
                  {opt.charAt(0) + opt.slice(1).toLowerCase()}
                </span>
                <span className="font-semibold">{formatINR(DELIVERY_FEES[opt])}</span>
              </label>
            ))}
          </section>

          <section className="space-y-3 rounded-3xl border border-border bg-white p-4">
            <p className="font-serif text-sm font-semibold text-ink">Payment method</p>
            {(["UPI", "CARD", "COD"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 rounded-2xl border border-border p-3 text-sm">
                <input
                  type="radio"
                  checked={form.paymentMethod === opt}
                  onChange={() => setForm((f) => ({ ...f, paymentMethod: opt }))}
                />
                {opt === "UPI" ? "UPI" : opt === "CARD" ? "Card" : "Cash on Delivery"}
              </label>
            ))}
          </section>

          <section className="rounded-3xl border border-border bg-white p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Delivery fee</span><span>{formatINR(fee)}</span></div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span>{formatINR(total)}</span></div>
          </section>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Placing order…" : `Place Order · ${formatINR(total)} →`}
          </Button>
        </form>
      </main>
    </div>
  );
}
